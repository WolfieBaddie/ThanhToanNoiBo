import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ImageOff, Loader2, Minus, Plus, Package, ShieldCheck, RefreshCw, Store, MapPin } from 'lucide-react';
import { CatalogItem, ServiceResponse, PackageResponse } from '@/types/catalog.type';
import { formatCurrency } from '@/utils/format';
import { useBuyVoucher } from '@/hooks/useBuyVoucher';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useUserCredit } from '@/hooks/useUserCredit';

interface MenuItemCardProps {
    item: CatalogItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { creditInfo } = useUserCredit(user?.userId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [step, setStep] = useState<'CONFIRM' | 'OTP'>('CONFIRM');
    const [otpCode, setOtpCode] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { requestOtp, buyVoucher, buyPackage, isLoading } = useBuyVoucher();
    const notify = useNotification();

    // [MỚI] STATE CHO SLIDE ẢNH
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [slideImages, setSlideImages] = useState<string[]>([]);

    useEffect(() => {
        if (resendCountdown > 0) {
            timerRef.current = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [resendCountdown]);

    // =========================================================================
    // [MỚI] LOGIC XỬ LÝ ẢNH SLIDER (Lấy hết ảnh của Package & Items)
    // =========================================================================
    useEffect(() => {
        let images: string[] = [];
        if (item.type === 'PACKAGE') {
            const pkg = item as PackageResponse;
            // 1. Lấy ảnh đại diện gói
            if (pkg.imageUrl) images.push(pkg.imageUrl);
            // 2. Lấy ảnh các món trong gói
            if (pkg.items && pkg.items.length > 0) {
                pkg.items.forEach(subItem => {
                    if (subItem.imageUrl) images.push(subItem.imageUrl);
                });
            }
        } else {
            // Nếu là Service lẻ
            const svc = item as ServiceResponse;
            if (svc.imageUrl) images.push(svc.imageUrl);
        }
        // Lọc trùng lặp URL
        setSlideImages(Array.from(new Set(images)));
    }, [item]);

    // [MỚI] Tự động chuyển ảnh sau mỗi 2.5 giây nếu có > 1 ảnh
    useEffect(() => {
        if (slideImages.length > 1) {
            const slideTimer = setInterval(() => {
                setCurrentImgIndex(prev => (prev + 1) % slideImages.length);
            }, 2500);
            return () => clearInterval(slideTimer);
        }
    }, [slideImages]);

    // =========================================================================
    // LOGIC XỬ LÝ THÔNG TIN KHÁC
    // =========================================================================
    const isCombo = item.type === 'PACKAGE';

    let displayId = '';
    let navigateId = '';
    let displayPrice = 0;
    let locationInfo = '';

    if (isCombo) {
        const pkg = item as PackageResponse;
        displayId = pkg.packageId;
        navigateId = pkg.packageId;
        displayPrice = pkg.price;

        if (pkg.merchantInfo && pkg.merchantInfo.counterName) {
            locationInfo = pkg.merchantInfo.counterName;
        } else {
            locationInfo = "Toàn hệ thống";
        }
    } else {
        const service = item as ServiceResponse;
        const firstOption = service.options && service.options.length > 0 ? service.options[0] : null;
        navigateId = service.masterServiceCode || (firstOption ? firstOption.serviceId : '');

        if (firstOption) {
            displayId = firstOption.serviceId;
            displayPrice = service.minPrice || firstOption.unitPrice;
            if (service.options.length > 1) {
                locationInfo = `${service.options.length} địa điểm phục vụ`;
            } else {
                locationInfo = firstOption.location || firstOption.counterName;
            }
        } else {
            locationInfo = "Đang cập nhật";
        }
    }

    const displayName = isCombo ? item.packageName : item.serviceName;
    const displayCategory = isCombo ? 'Combo' : item.categoryName;
    const description = item.description || "Chưa có mô tả";

    // Ảnh hiển thị hiện tại (theo slider)
    const currentDisplayImage = slideImages.length > 0 ? slideImages[currentImgIndex] : null;

    const displayPriceWithTax = displayPrice * 1.1;
    const baseTotalAmount = displayPrice * quantity;
    const vatAmount = baseTotalAmount * 0.1;
    const finalTotalAmount = baseTotalAmount + vatAmount;

    // --- ACTIONS ---
    const handleCardClick = () => {
        if (navigateId) {
            navigate(`/menu/${navigateId}`);
        }
    };

    const handleOpenModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!displayId) {
            notify.error("Sản phẩm này tạm thời không khả dụng");
            return;
        }
        const currentBalance = creditInfo?.balance || 0;
        if (currentBalance < finalTotalAmount) {
            const missingAmount = finalTotalAmount - currentBalance;
            notify.error(`Số dư không đủ. Bạn còn thiếu ${formatCurrency(missingAmount)}`);
            navigate('/payment/topup', { state: { suggestedAmount: missingAmount } });
            return;
        }
        setQuantity(1);
        setStep('CONFIRM');
        setOtpCode('');
        setResendCountdown(0);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setResendCountdown(0);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleMainAction = async () => {
        if (step === 'CONFIRM') {
            const success = await requestOtp();
            if (success) {
                setStep('OTP');
                setResendCountdown(60);
            }
        } else if (step === 'OTP') {
            if (!otpCode || otpCode.length < 6) {
                notify.error("Vui lòng nhập đủ 6 số OTP");
                return;
            }
            const onSuccess = () => handleCloseModal();
            if (isCombo) {
                await buyPackage({ packageId: displayId, quantity }, otpCode, displayPrice, onSuccess);
            } else {
                await buyVoucher({ serviceId: displayId, amount: quantity }, otpCode, displayPrice, onSuccess);
            }
        }
    };

    return (
        <>
            <div
                onClick={handleCardClick}
                className={`bg-white dark:bg-slate-800 rounded-3xl border overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer ${isCombo ? 'border-orange-200 dark:border-orange-900 shadow-orange-100' : 'border-slate-100 dark:border-slate-700 hover:shadow-slate-200'}`}
            >
                {/* Header Ảnh - [CẬP NHẬT: SLIDER] */}
                <div className={`relative h-48 overflow-hidden shrink-0 ${isCombo ? 'bg-orange-50 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    {currentDisplayImage ? (
                        <>
                            <img
                                src={currentDisplayImage}
                                alt={displayName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                            />

                            {/* [MỚI] Dots Indicator (Chỉ hiện khi có nhiều ảnh) */}
                            {slideImages.length > 1 && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                    {slideImages.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${idx === currentImgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            {isCombo ? <><Package size={48} className="text-orange-300 mb-2" /><span className="text-xs font-medium text-orange-400">Gói Combo</span></> : <ImageOff size={32} />}
                        </div>
                    )}
                    <span className={`absolute top-3 left-3 backdrop-blur-md border px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isCombo ? 'bg-orange-500/90 text-white border-orange-400' : 'bg-white/30 dark:bg-black/30 border-white/20 text-white'}`}>
                        {displayCategory}
                    </span>
                </div>

                {/* Body Thông tin */}
                <div className="p-5 flex flex-col flex-1">
                    <div className="mb-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-2 group-hover:text-indigo-600 transition-colors" title={displayName}>{displayName}</h4>
                    </div>

                    <div className={`flex items-center gap-1.5 text-[11px] font-bold mb-3 uppercase tracking-tight ${isCombo ? 'text-orange-500' : 'text-indigo-500'}`}>
                        {isCombo ? <Store size={12} /> : <MapPin size={12} />}
                        <span className="truncate">{locationInfo}</span>
                    </div>

                    <div className="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[32px]"><p>{description}</p></div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                        <span className={`font-extrabold text-lg ${isCombo ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                            {formatCurrency(displayPriceWithTax)}
                        </span>

                        <button
                            onClick={handleOpenModal}
                            disabled={isLoading}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors shadow-lg active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed ${isCombo ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Confirm (Giữ nguyên) */}
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleMainAction}
                isLoading={isLoading}
                title={step === 'CONFIRM' ? (isCombo ? "Xác nhận mua Combo" : "Xác nhận mua vé") : "Nhập mã xác thực"}
                confirmText={step === 'CONFIRM' ? "Xác nhận" : "Hoàn tất giao dịch"}
                message={
                    <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in duration-200">
                        <span className="text-center text-slate-500">
                            Bạn muốn mua {isCombo ? 'gói' : 'dịch vụ'} <br/>
                            <strong className="text-indigo-600 dark:text-indigo-400 text-lg">{displayName}</strong>
                        </span>
                        {step === 'CONFIRM' && (
                            <>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl border border-slate-100 dark:border-slate-600 my-2">
                                    <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg border hover:bg-slate-50 text-slate-600 dark:text-white active:scale-95 transition-transform"><Minus size={18} /></button>
                                    <span className="font-bold text-2xl w-12 text-center text-slate-800 dark:text-white">{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg border hover:bg-slate-50 text-slate-600 dark:text-white active:scale-95 transition-transform"><Plus size={18} /></button>
                                </div>
                                <div className="w-full text-sm text-slate-500 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-2">
                                    <div className="flex justify-between"><span>Tạm tính:</span><span>{formatCurrency(baseTotalAmount)}</span></div>
                                    <div className="flex justify-between"><span>Thuế VAT (10%):</span><span>{formatCurrency(vatAmount)}</span></div>
                                    <div className="flex justify-between gap-4 pt-2 border-t border-indigo-200 dark:border-indigo-700"><span className="font-bold">Tổng thanh toán:</span><strong className="text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(finalTotalAmount)}</strong></div>
                                </div>
                            </>
                        )}
                        {step === 'OTP' && (
                            <div className="w-full">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-center mb-4 border border-blue-100 dark:border-blue-800/50"><ShieldCheck className="text-blue-500 shrink-0" size={24} /><p className="text-sm text-blue-700 dark:text-blue-300">Đã gửi OTP. Vui lòng kiểm tra email.</p></div>
                                <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="block w-full text-center text-3xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl border-2 border-indigo-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="••••••" autoFocus />
                            </div>
                        )}
                    </div>
                }
            />
        </>
    );
};