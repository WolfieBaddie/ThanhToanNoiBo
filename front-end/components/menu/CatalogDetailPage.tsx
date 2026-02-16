import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Store, ShieldCheck, Info, ShoppingBag,
    Package, Minus, Plus, Loader2, RefreshCw, CheckCircle2,
    Building2 // Icon cho toàn hệ thống
} from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { formatCurrency } from '@/utils/format';
import { ServiceResponse, PackageResponse } from '@/types/catalog.type'; // [CẬP NHẬT] Import PackageResponse
import { useAuth } from '@/context/AuthContext';
import { useUserCredit } from '@/hooks/useUserCredit';
import { useBuyVoucher } from '@/hooks/useBuyVoucher';
import { useNotification } from '@/context/NotificationContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const CatalogDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { displayedItems, isLoading: isCatalogLoading } = useCatalog();

    // Hooks mua hàng
    const { user } = useAuth();
    const { creditInfo } = useUserCredit(user?.userId);
    const { requestOtp, buyVoucher, buyPackage, isLoading: isBuying } = useBuyVoucher();
    const notify = useNotification();

    // State UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [step, setStep] = useState<'CONFIRM' | 'OTP'>('CONFIRM');
    const [otpCode, setOtpCode] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // State Slide Ảnh
    const [slideImages, setSlideImages] = useState<string[]>([]);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    // Tìm item
    const item = displayedItems.find(i =>
        (i.type === 'PACKAGE' ? i.packageId === id : (i.masterServiceCode === id || i.serviceId === id))
    );

    // Effect: Countdown OTP
    useEffect(() => {
        if (resendCountdown > 0) {
            timerRef.current = setInterval(() => setResendCountdown(p => p - 1), 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [resendCountdown]);

    // Effect: Scroll top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // Effect: Xử lý danh sách ảnh cho Slide
    useEffect(() => {
        if (!item) return;
        let images: string[] = [];

        if (item.type === 'PACKAGE') {
            const pkg = item as PackageResponse;
            if (pkg.imageUrl) images.push(pkg.imageUrl);
            if (pkg.items && pkg.items.length > 0) {
                pkg.items.forEach(i => {
                    if (i.imageUrl) images.push(i.imageUrl);
                });
            }
        } else {
            // Nếu là Service lẻ
            if (item.imageUrl) images.push(item.imageUrl);
        }

        // Lọc trùng & null
        const uniqueImages = Array.from(new Set(images.filter(Boolean)));
        setSlideImages(uniqueImages);
        setCurrentImgIndex(0);
    }, [item]);

    // Effect: Tự động chạy slide
    useEffect(() => {
        if (slideImages.length > 1) {
            const slideTimer = setInterval(() => {
                setCurrentImgIndex(prev => (prev + 1) % slideImages.length);
            }, 3000); // 3 giây chuyển 1 lần
            return () => clearInterval(slideTimer);
        }
    }, [slideImages]);


    if (isCatalogLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    if (!item) return <div className="p-10 text-center text-slate-500">Không tìm thấy dịch vụ.</div>;

    const isCombo = item.type === 'PACKAGE';
    const displayName = isCombo ? item.packageName : item.serviceName;
    const description = item.description || "Chưa có mô tả chi tiết.";

    // Lấy ảnh hiện tại để hiển thị
    const displayImage = slideImages.length > 0 ? slideImages[currentImgIndex] : null;

    let displayPrice = 0;
    let buyId = '';
    let optionsList: any[] = []; // Danh sách các quầy (cho Service)

    // [MỚI] Biến hiển thị thông tin địa điểm cho Combo
    let comboLocationName = "Toàn hệ thống";
    let comboLocationDesc = "Gói này có thể sử dụng tại bất kỳ quầy nào trong hệ thống có phục vụ các món trong danh sách.";
    let ComboIcon = Building2; // Mặc định icon tòa nhà
    let comboLocationClass = "bg-green-50 border-green-100 text-green-800"; // Màu xanh cho toàn hệ thống

    if (isCombo) {
        const pkg = item as PackageResponse;
        displayPrice = pkg.price;
        buyId = pkg.packageId;

        // [LOGIC MỚI] Kiểm tra merchantInfo để hiển thị địa điểm
        if (pkg.merchantInfo && pkg.merchantInfo.counterName) {
            comboLocationName = pkg.merchantInfo.counterName;
            comboLocationDesc = pkg.merchantInfo.location || "Tại quầy bán hàng.";
            ComboIcon = Store; // Đổi icon thành cửa hàng
            comboLocationClass = "bg-blue-50 border-blue-100 text-blue-900"; // Đổi màu xanh dương
        }
    } else {
        const service = item as ServiceResponse;
        if (service.options && service.options.length > 0) {
            displayPrice = service.minPrice || service.options[0].unitPrice;
            buyId = service.options[0].serviceId;
            optionsList = service.options;
        }
    }

    const displayPriceWithTax = displayPrice * 1.1;
    const baseTotalAmount = displayPrice * quantity;
    const vatAmount = baseTotalAmount * 0.1;
    const finalTotalAmount = baseTotalAmount + vatAmount;

    // --- LOGIC MUA ---
    const handleOpenModal = () => {
        if (!buyId) {
            notify.error("Tạm thời chưa thể mua.");
            return;
        }
        const currentBalance = creditInfo?.balance || 0;
        if (currentBalance < finalTotalAmount) {
            const missing = finalTotalAmount - currentBalance;
            notify.error(`Số dư không đủ. Thiếu ${formatCurrency(missing)}`);
            navigate('/payment/topup', { state: { suggestedAmount: missing } });
            return;
        }
        setStep('CONFIRM');
        setOtpCode('');
        setIsModalOpen(true);
    };

    const handleMainAction = async () => {
        if (step === 'CONFIRM') {
            const success = await requestOtp();
            if (success) {
                setStep('OTP');
                setResendCountdown(60);
            }
        } else {
            if (otpCode.length < 6) return notify.error("Vui lòng nhập đủ OTP");
            const onSuccess = () => {
                setIsModalOpen(false);
                navigate('/vouchers');
            };
            if (isCombo) await buyPackage({ packageId: buyId, quantity }, otpCode, displayPrice, onSuccess);
            else await buyVoucher({ serviceId: buyId, amount: quantity }, otpCode, displayPrice, onSuccess);
        }
    };

    return (
        <div className="bg-white min-h-screen pb-10 font-sans">
            {/* 1. HERO HEADER (SLIDESHOW) */}
            <div className="relative h-72 lg:h-80 bg-slate-100 overflow-hidden group">
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={displayName}
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        {isCombo ? <Package size={64} className="text-orange-300 mb-2"/> : <Store size={64}/>}
                        <span className="font-medium">Chưa có hình ảnh</span>
                    </div>
                )}

                {/* Dots Indicator (Chỉ hiện khi có > 1 ảnh) */}
                {slideImages.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {slideImages.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${idx === currentImgIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Back Button */}
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-slate-800 hover:bg-white transition-all z-20">
                    <ArrowLeft size={20} />
                </button>

                {/* Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>

                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm ${isCombo ? 'bg-orange-500 text-white' : 'bg-white text-indigo-600'}`}>
                        {isCombo ? item.packageType : item.categoryName}
                    </span>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 md:px-6 -mt-4 relative z-10">
                {/* 2. MAIN INFO CARD */}
                <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8 mb-8">

                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight">{displayName}</h1>

                    <div className="flex items-center gap-4 mb-6">
                        <span className={`text-3xl font-black ${isCombo ? 'text-orange-500' : 'text-indigo-600'}`}>
                            {formatCurrency(displayPriceWithTax)}
                        </span>
                        {isCombo && <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-md">Trọn gói</span>}
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shrink-0">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-xs font-bold text-slate-700">Xác thực OTP</span>
                        </div>
                        {!isCombo && (
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shrink-0">
                                <Store size={16} className="text-blue-500" />
                                <span className="text-xs font-bold text-slate-700">{optionsList.length} Điểm bán</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shrink-0">
                            <CheckCircle2 size={16} className="text-indigo-500" />
                            <span className="text-xs font-bold text-slate-700">Thanh toán ví</span>
                        </div>
                    </div>

                    {/* --- KHU VỰC MUA HÀNG --- */}
                    <div className="bg-slate-50 rounded-2xl p-4 md:p-6 border border-slate-100">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                            <div className="flex items-center justify-between w-full md:w-auto gap-4">
                                <span className="text-sm font-bold text-slate-500 md:hidden">Số lượng:</span>
                                <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                                    <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                                        <Minus size={18}/>
                                    </button>
                                    <span className="w-12 text-center font-black text-lg text-slate-800">{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                                        <Plus size={18}/>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto flex-1 md:justify-end">
                                <div className="hidden md:block text-right mr-2">
                                    <p className="text-xs text-slate-400 font-bold uppercase">Tổng cộng</p>
                                    <p className="text-xl font-black text-slate-900">{formatCurrency(finalTotalAmount)}</p>
                                </div>
                                <button
                                    onClick={handleOpenModal}
                                    disabled={isBuying}
                                    className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isCombo ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                                >
                                    {isBuying ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />}
                                    <span>Mua Ngay</span>
                                    <span className="md:hidden bg-white/20 px-2 py-0.5 rounded text-xs ml-2">
                                        {formatCurrency(finalTotalAmount)}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. DESCRIPTION */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                        <Info size={20} className="text-slate-400" />
                        Thông tin chi tiết
                    </h3>
                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        {description}
                    </div>
                </div>

                {/* 4. LOCATIONS */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-slate-400" />
                        Địa điểm sử dụng
                    </h3>

                    {isCombo ? (
                        /* [ĐÃ SỬA] Hiển thị địa điểm linh hoạt cho Combo */
                        <div className={`flex items-start gap-4 p-5 rounded-3xl border ${comboLocationClass}`}>
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-current">
                                <ComboIcon size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{comboLocationName}</h4>
                                <p className="text-sm mt-1 opacity-90">
                                    {comboLocationDesc}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {optionsList.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                        <Store size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 text-sm">{opt.counterName}</h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <MapPin size={10} /> {opt.location || 'Không xác định'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-indigo-600 text-sm">{formatCurrency(opt.unitPrice)}</span>
                                        {opt.remainingQuantity < 20 && (
                                            <span className="text-[10px] text-red-500 font-medium">Sắp hết vé</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {optionsList.length === 0 && <p className="text-slate-400 italic">Chưa có thông tin địa điểm.</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* CONFIRM MODAL */}
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleMainAction}
                isLoading={isBuying}
                title={step === 'CONFIRM' ? "Xác nhận đơn hàng" : "Nhập mã OTP"}
                confirmText={step === 'CONFIRM' ? "Xác nhận" : "Hoàn tất"}
                message={
                    <div className="flex flex-col items-center gap-4 w-full">
                        <strong className="text-xl text-indigo-600">{displayName}</strong>
                        {step === 'CONFIRM' && (
                            <>
                                <div className="w-full bg-slate-50 p-4 rounded-xl space-y-2 text-sm border border-slate-100">
                                    <div className="flex justify-between"><span>Số lượng:</span><span className="font-bold">{quantity}</span></div>
                                    <div className="flex justify-between"><span>Đơn giá:</span><span>{formatCurrency(displayPriceWithTax)}</span></div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                                        <span>Tổng cộng:</span><span className="text-indigo-600">{formatCurrency(finalTotalAmount)}</span>
                                    </div>
                                </div>
                            </>
                        )}
                        {step === 'OTP' && (
                            <div className="w-full text-center">
                                <p className="text-sm text-slate-500 mb-4">Mã xác thực đã gửi tới email của bạn.</p>
                                <input
                                    type="text" maxLength={6}
                                    value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full text-center text-3xl font-bold tracking-[0.5em] p-3 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none"
                                    placeholder="••••••" autoFocus
                                />
                                <button onClick={() => requestOtp().then(() => setResendCountdown(60))} disabled={resendCountdown > 0} className="mt-4 text-sm text-indigo-600 font-medium flex items-center justify-center gap-2 mx-auto">
                                    <RefreshCw size={14} /> {resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : "Gửi lại mã"}
                                </button>
                            </div>
                        )}
                    </div>
                }
            />
        </div>
    );
};

export default CatalogDetailPage;