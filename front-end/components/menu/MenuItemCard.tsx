import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ImageOff, Loader2, Minus, Plus, Package, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { CatalogItem } from '@/types/catalog.type';
import { formatCurrency } from '@/utils/format';
import { useBuyVoucher } from '@/hooks/useBuyVoucher';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useNotification } from '@/context/NotificationContext';

interface MenuItemCardProps {
    item: CatalogItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
    // --- STATE UI ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // --- STATE CHO LUỒNG OTP ---
    const [step, setStep] = useState<'CONFIRM' | 'OTP'>('CONFIRM');
    const [otpCode, setOtpCode] = useState('');

    // [CẬP NHẬT] Thời gian chờ gửi lại (Resend Cooldown): 60 giây
    const [resendCountdown, setResendCountdown] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- HOOKS ---
    const { requestOtp, buyVoucher, buyPackage, isLoading } = useBuyVoucher();
    const notify = useNotification();

    // --- LOGIC ĐẾM NGƯỢC (Chỉ dùng cho nút Gửi lại) ---
    useEffect(() => {
        if (resendCountdown > 0) {
            timerRef.current = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [resendCountdown]);

    // Chuẩn hóa dữ liệu hiển thị
    const isCombo = item.type === 'PACKAGE';
    const displayId = isCombo ? item.packageId : item.serviceId;
    const displayName = isCombo ? item.packageName : item.serviceName;
    const displayPrice = isCombo ? item.price : item.unitPrice;
    const displayImage = isCombo ? null : item.imageUrl;
    const displayCategory = isCombo ? 'Combo' : item.categoryName;
    const totalAmount = displayPrice * quantity;

    // Reset trạng thái khi đóng/mở Modal
    const handleOpenModal = () => {
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

    // --- [LOGIC MỚI] XỬ LÝ GỬI LẠI MÃ ---
    const handleResendOtp = async () => {
        if (resendCountdown > 0 || isLoading) return;

        // Gọi API sinh mã mới
        const success = await requestOtp();
        if (success) {
            setResendCountdown(60); // Reset bộ đếm 60s
            setOtpCode(''); // Xóa ô nhập cũ
        }
    };

    // --- XỬ LÝ HÀNH ĐỘNG CHÍNH ---
    const handleMainAction = async () => {
        // BƯỚC 1: XÁC NHẬN THANH TOÁN -> GỌI OTP
        if (step === 'CONFIRM') {
            const success = await requestOtp();
            if (success) {
                setStep('OTP');      // Chuyển sang màn hình nhập
                setResendCountdown(60); // Bắt đầu đếm ngược 60s ngay
            }
        }
        // BƯỚC 2: NHẬP OTP -> GỬI REQUEST BACKEND
        else if (step === 'OTP') {
            if (!otpCode || otpCode.length < 6) {
                notify.error("Vui lòng nhập đủ 6 số OTP");
                return;
            }

            const onSuccess = () => handleCloseModal();

            // Gửi request mua hàng kèm OTP
            if (isCombo) {
                await buyPackage({ packageId: displayId, quantity }, otpCode, displayPrice, onSuccess);
            } else {
                await buyVoucher({ serviceId: displayId, amount: quantity }, otpCode, displayPrice, onSuccess);
            }
        }
    };

    return (
        <>
            {/* Card hiển thị giữ nguyên, chỉ thay đổi phần Modal bên dưới */}
            <div className={`bg-white dark:bg-slate-800 rounded-3xl border overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full ${isCombo ? 'border-orange-200 dark:border-orange-900 shadow-orange-100' : 'border-slate-100 dark:border-slate-700 hover:shadow-slate-200'}`}>
                <div className={`relative h-48 overflow-hidden shrink-0 ${isCombo ? 'bg-orange-50 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    {displayImage ? (
                        <img src={displayImage} alt={displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            {isCombo ? <><Package size={48} className="text-orange-300 mb-2" /><span className="text-xs font-medium text-orange-400">Gói Combo</span></> : <ImageOff size={32} />}
                        </div>
                    )}
                    <span className={`absolute top-3 left-3 backdrop-blur-md border px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isCombo ? 'bg-orange-500/90 text-white border-orange-400' : 'bg-white/30 dark:bg-black/30 border-white/20 text-white'}`}>
                        {displayCategory}
                    </span>
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2"><h4 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-2" title={displayName}>{displayName}</h4></div>
                    <div className="text-slate-400 text-sm mb-4 line-clamp-3 min-h-[40px]"><p>{item.description || "Chưa có mô tả"}</p></div>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                        <span className={`font-extrabold text-lg ${isCombo ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(displayPrice)}</span>
                        <button onClick={handleOpenModal} disabled={isLoading} className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors shadow-lg active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed ${isCombo ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL XỬ LÝ GIAO DỊCH 2 BƯỚC --- */}
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleMainAction}
                isLoading={isLoading}
                // Đổi text nút bấm theo bước
                title={step === 'CONFIRM' ? (isCombo ? "Xác nhận mua Combo" : "Xác nhận mua vé") : "Nhập mã xác thực"}
                confirmText={step === 'CONFIRM' ? "Xác nhận" : "Hoàn tất giao dịch"}

                message={
                    <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in duration-200">
                        <span className="text-center text-slate-500">
                            Bạn muốn mua {isCombo ? 'gói' : 'dịch vụ'} <br/>
                            <strong className="text-indigo-600 dark:text-indigo-400 text-lg">{displayName}</strong>
                        </span>

                        {/* --- BƯỚC 1: CHỌN SỐ LƯỢNG --- */}
                        {step === 'CONFIRM' && (
                            <>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl border border-slate-100 dark:border-slate-600 my-2">
                                    <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg border hover:bg-slate-50 text-slate-600 dark:text-white active:scale-95 transition-transform"><Minus size={18} /></button>
                                    <span className="font-bold text-2xl w-12 text-center text-slate-800 dark:text-white">{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg border hover:bg-slate-50 text-slate-600 dark:text-white active:scale-95 transition-transform"><Plus size={18} /></button>
                                </div>
                                <div className="w-full text-sm text-slate-500 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <div className="flex justify-between gap-4 pt-2 border-t border-indigo-200 dark:border-indigo-700">
                                        <span className="font-bold">Tổng thanh toán:</span>
                                        <strong className="text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(totalAmount)}</strong>
                                    </div>
                                    <p className="text-xs text-center mt-3 text-indigo-500 opacity-80">
                                        Sau khi bấm "Xác nhận thanh toán", mã OTP sẽ được gửi về email của bạn.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* --- BƯỚC 2: NHẬP OTP --- */}
                        {step === 'OTP' && (
                            <div className="w-full">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-center mb-4 border border-blue-100 dark:border-blue-800/50">
                                    <ShieldCheck className="text-blue-500 shrink-0" size={24} />
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Đã gửi OTP. Vui lòng kiểm tra email và nhập mã để hoàn tất.
                                    </p>
                                </div>

                                <input
                                    type="text" maxLength={6} value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    className="block w-full text-center text-3xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl border-2 border-indigo-100 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-300"
                                    placeholder="••••••" autoFocus
                                />

                                <div className="mt-4 flex justify-center">
                                    <button
                                        type="button" // Để không submit form nếu modal nằm trong form
                                        onClick={handleResendOtp}
                                        disabled={resendCountdown > 0 || isLoading}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                                             ${resendCountdown > 0
                                            ? 'text-slate-400 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                                            : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30'
                                        }`}
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                        {resendCountdown > 0
                                            ? `Gửi lại mã sau ${resendCountdown}s`
                                            : "Gửi lại mã OTP"
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                }
            />
        </>
    );
};