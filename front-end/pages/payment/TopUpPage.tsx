import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, ArrowLeft, CheckCircle2, Wallet, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserCredit } from '../../hooks/useUserCredit';
import { usePayment } from '../../hooks/usePayment';
import { WalletCard } from '../../components/dashboard/WalletCard';
import { formatCurrency } from '../../utils/format';
import { PaymentRequestType } from '../../types/payment.types';

const TopUpPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { creditInfo } = useUserCredit(user?.userId);

    // Sử dụng hook thanh toán
    const { initiatePayment, isLoading: isPaying, error: paymentError } = usePayment();

    const [amount, setAmount] = useState<string>('');
    const [selectedMethod, setSelectedMethod] = useState<'VNPAY'>('VNPAY');

    const quickAmounts = [20000, 50000, 100000, 200000, 500000];

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmount(value);
    };

    const handlePayment = async () => {
        const numAmount = parseInt(amount);
        if (!amount || numAmount < 10000) {
            alert("Vui lòng nạp tối thiểu 10.000đ");
            return;
        }

        // Gọi API tạo giao dịch & chuyển hướng sang VNPay
        await initiatePayment({
            amount: numAmount,
            orderInfo: `Nap tien vao tai khoan ${user?.username || 'user'}`,
            type: PaymentRequestType.TOP_UP
        });
    };

    const currentBalance = creditInfo?.balance || 0;
    const depositAmount = parseInt(amount) || 0;
    const predictedBalance = currentBalance + depositAmount;

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
            <button
                onClick={() => navigate('/wallet')}
                className="group flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium"
            >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mr-3 group-hover:border-indigo-500 transition-colors shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                Quay lại Ví của tôi
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- LEFT COLUMN: INPUT FORM --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-[24px] p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        {/* Header Section */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                                <Landmark size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Nạp tiền tài khoản</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Nhập số tiền bạn muốn nạp vào ví</p>
                            </div>
                        </div>

                        {/* Input Số tiền */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                Số tiền nạp (VNĐ)
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={amount ? parseInt(amount).toLocaleString('vi-VN') : ''}
                                    onChange={handleAmountChange}
                                    placeholder="0"
                                    disabled={isPaying}
                                    className="w-full text-4xl font-bold text-indigo-600 dark:text-indigo-400 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">đ</span>
                            </div>

                            {/* Gợi ý mệnh giá */}
                            <div className="flex flex-wrap gap-3 mt-4">
                                {quickAmounts.map((val) => (
                                    <button
                                        key={val}
                                        disabled={isPaying}
                                        onClick={() => setAmount(val.toString())}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            amount === val.toString()
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800'
                                        }`}
                                    >
                                        {val.toLocaleString('vi-VN')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Phương thức thanh toán */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                Phương thức thanh toán
                            </label>

                            <div
                                className={`cursor-pointer relative overflow-hidden border-2 rounded-2xl p-5 flex items-center justify-between transition-all group ${
                                    selectedMethod === 'VNPAY'
                                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10'
                                        : 'border-slate-100 dark:border-slate-700 hover:border-slate-300'
                                }`}
                                onClick={() => setSelectedMethod('VNPAY')}
                            >
                                <div className="flex items-center gap-4 z-10">
                                    <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 flex items-center justify-center p-1 shadow-sm">
                                        <img
                                            src="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png"
                                            alt="VNPay"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-lg">Cổng VNPAY</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Quét QR, ATM, Visa/Mastercard</p>
                                    </div>
                                </div>
                                {selectedMethod === 'VNPAY' ? (
                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center z-10">
                                        <CheckCircle2 size={14} className="text-white" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: SUMMARY & PREVIEW --- */}
                <div className="space-y-6">
                    <WalletCard
                        balance={predictedBalance}
                        studentName={user?.fullName || "Học sinh"}
                        studentId={user?.username || "---"}
                        className="shadow-xl shadow-indigo-200 dark:shadow-none"
                    />

                    <div className="bg-white dark:bg-slate-800 rounded-[24px] p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Wallet size={18} className="text-slate-400" />
                            Chi tiết giao dịch
                        </h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Số dư hiện tại</span>
                                <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(currentBalance)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Số tiền nạp</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">+{formatCurrency(depositAmount)}</span>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                            <div className="flex justify-between text-base">
                                <span className="font-bold text-slate-800 dark:text-white">Số dư sau nạp</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(predictedBalance)}</span>
                            </div>
                        </div>

                        {/* Hiển thị lỗi nếu có */}
                        {paymentError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                                {paymentError}
                            </div>
                        )}

                        <button
                            onClick={handlePayment}
                            disabled={!depositAmount || isPaying}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isPaying ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={20} />
                                    Thanh toán ngay
                                </>
                            )}
                        </button>

                        <p className="text-center text-[11px] text-slate-400 mt-4 leading-tight">
                            Bằng việc thanh toán, bạn đồng ý với điều khoản sử dụng dịch vụ của hệ thống.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopUpPage;