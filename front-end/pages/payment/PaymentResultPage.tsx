import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Home, ArrowRight, RefreshCcw } from 'lucide-react';
import { usePayment } from '../../hooks/usePayment';

const PaymentResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Gọi hook
    const { verifyPaymentCallback, isLoading, error, paymentReceipt } = usePayment();

    // Chặn gọi API 2 lần (React Strict Mode)
    const hasVerified = useRef(false);

    // Lấy params từ URL VNPay trả về
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    const vnpTransactionNo = searchParams.get('vnp_TransactionNo');
    const vnpAmount = searchParams.get('vnp_Amount');

    useEffect(() => {
        if (vnpResponseCode && !hasVerified.current) {
            hasVerified.current = true;
            console.log("🔄 Đang gọi API verify...");
            verifyPaymentCallback(searchParams);
        }
    }, [searchParams, verifyPaymentCallback]);

    // Debug: Xem PaymentReceipt có dữ liệu không
    useEffect(() => {
        if (paymentReceipt) {
            console.log("✅ Dữ liệu đã vào Component:", paymentReceipt);
        }
    }, [paymentReceipt]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <RefreshCcw size={20} className="text-indigo-600" />
                    </div>
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Đang xác thực giao dịch từ VNPay...</p>
            </div>
        );
    }

    // Logic xác định thành công:
    // 1. Backend không trả về lỗi
    // 2. Có dữ liệu receipt
    // 3. Hoặc Mã lỗi từ URL là '00' (Fallback nếu API chưa kịp phản hồi nhưng URL bảo OK)
    const isSuccess = (!error && !!paymentReceipt) || vnpResponseCode === '00';

    const errorMessage = error || "Giao dịch bị hủy hoặc xảy ra lỗi phía ngân hàng.";

    // --- XỬ LÝ DỮ LIỆU HIỂN THỊ ---
    // Ưu tiên lấy từ API (paymentReceipt), nếu chưa có thì lấy tạm từ URL

    // 1. Mã giao dịch
    const displayTransRef = paymentReceipt?.transactionRef || vnpTransactionNo || '---';

    // 2. Số tiền (VNĐ)
    // Nếu lấy từ JSON API: totalAmount = 50000.00
    // Nếu lấy từ URL: vnp_Amount = 5000000 (phải chia 100)
    let displayAmount = 0;
    if (paymentReceipt?.totalAmount) {
        displayAmount = paymentReceipt.totalAmount;
    } else if (vnpAmount) {
        displayAmount = parseInt(vnpAmount) / 100;
    }

    return (
        <div className="max-w-lg mx-auto py-10 px-4">
            <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl shadow-indigo-100 dark:shadow-none overflow-hidden relative border border-slate-100 dark:border-slate-700">

                {/* Header Color Bar */}
                <div className={`h-2 w-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

                <div className="p-8 text-center">
                    {/* Icon Status */}
                    <div className="flex justify-center mb-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                            isSuccess
                                ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20'
                                : 'bg-red-50 text-red-500 dark:bg-red-900/20'
                        }`}>
                            {isSuccess ? <CheckCircle size={48} strokeWidth={3} /> : <XCircle size={48} strokeWidth={3} />}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        {isSuccess ? 'Thanh toán thành công!' : 'Giao dịch thất bại'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-4">
                        {isSuccess
                            ? 'Cảm ơn bạn! Số dư đã được cập nhật vào ví.'
                            : errorMessage}
                    </p>

                    {/* Receipt Details */}
                    {isSuccess && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8 border border-dashed border-slate-200 dark:border-slate-700 relative">
                            {/* Decorative Cuts */}
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 rounded-full"></div>
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 rounded-full"></div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Mã tham chiếu</span>
                                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                        #{displayTransRef}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Thời gian</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {new Date().toLocaleString('vi-VN')}
                                    </span>
                                </div>
                                <div className="h-px bg-slate-200 dark:bg-slate-700 border-dashed"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Tổng tiền</span>
                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {/* Format VNĐ thủ công ở đây cho chính xác */}
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(displayAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Home size={18} /> Trang chủ
                        </button>
                        <button
                            onClick={() => navigate('/wallet')}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            Ví của tôi <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center mt-6">
                <p className="text-xs text-slate-400">
                    Cần hỗ trợ? Liên hệ hotline <span className="font-bold text-indigo-500">1900 1000</span>
                </p>
            </div>
        </div>
    );
};

export default PaymentResultPage;