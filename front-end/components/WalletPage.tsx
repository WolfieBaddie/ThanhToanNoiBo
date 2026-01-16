import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Landmark,
    Smartphone,
    PlusCircle,
    AlertCircle,
    RefreshCw,
    History,
    CreditCard
} from 'lucide-react';

import { WalletCard } from './dashboard/WalletCard';
import { useAuth } from '../context/AuthContext';
import { useUserCredit } from '../hooks/useUserCredit';
import { formatCurrency } from '../utils/format';

const WalletPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Gọi hook lấy dữ liệu ví (Sử dụng userId từ user profile)
    const { creditInfo, isLoading, refreshCredit } = useUserCredit(user?.userId);

    // Chuẩn hóa biến isUnlimited (xử lý trường hợp backend trả về tên biến khác nhau)
    const isUnlimited = creditInfo?.isUnlimited === true || creditInfo?.unlimited === true;

    // Loading State
    if (isLoading && !creditInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <RefreshCw className="animate-spin mb-2" size={32} />
                <p>Đang tải thông tin ví...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ví & Nạp tiền</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Quản lý số dư, hạn mức chi tiêu và lịch sử giao dịch.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={refreshCredit}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-4 py-2.5 rounded-xl transition-colors active:scale-95"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                        <span>Làm mới</span>
                    </button>

                    <button
                        onClick={() => navigate('/history')}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 font-medium bg-white border border-slate-200 px-4 py-2.5 rounded-xl transition-colors hover:shadow-sm active:scale-95"
                    >
                        <History size={18} />
                        <span>Lịch sử</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- CỘT TRÁI: THÔNG TIN VÍ & HẠN MỨC --- */}
                <div className="space-y-8">
                    {/* 1. Thẻ Ví (Hiển thị số dư) */}
                    <WalletCard
                        balance={creditInfo?.balance ?? 0}
                        studentName={user?.fullName || "Học sinh"}
                        studentId={user?.username || "ID: ---"}
                    />

                    {/* 2. Thông tin Kiểm soát chi tiêu */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                            Hạn mức chi tiêu
                        </h3>

                        <div className="space-y-5">
                            {/* Dòng 1: Giới hạn ngày */}
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">Giới hạn theo ngày</p>
                                    <p className="text-xs text-slate-500">Mức tối đa được phép tiêu</p>
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${isUnlimited ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:text-slate-300'}`}>
                                    {isUnlimited ? "Không giới hạn" : formatCurrency(creditInfo?.dailyLimitAmount)}
                                </div>
                            </div>

                            {/* Dòng 2: Chi tiêu hôm nay (Chỉ hiện nếu có giới hạn) */}
                            {!isUnlimited && (
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="font-medium text-slate-700 dark:text-slate-300">Còn lại hôm nay</p>
                                        <p className="text-xs text-slate-500">
                                            Đã tiêu: {formatCurrency(creditInfo?.currentDaySpending)}
                                        </p>
                                    </div>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                                        {formatCurrency(creditInfo?.remainingDailyLimit)}
                                    </span>
                                </div>
                            )}

                            {/* Dòng 3: Cài đặt tự động (UI giả lập) */}
                            <div className="flex justify-between items-center pt-1">
                                <div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">Cảnh báo số dư thấp</p>
                                    <p className="text-xs text-slate-500">Thông báo khi dưới 20.000 xu</p>
                                </div>
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full relative cursor-pointer hover:bg-slate-300 transition-colors">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: PHƯƠNG THỨC NẠP TIỀN --- */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm h-full flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-6 flex items-center gap-2">
                        <PlusCircle className="text-indigo-600" />
                        Nạp tiền vào ví
                    </h3>

                    <div className="space-y-4 flex-1">
                        {/* Option 1: VNPay (Primary Action) */}
                        <button
                            onClick={() => navigate('/payment/topup')}
                            className="w-full flex items-center gap-4 p-4 border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group text-left relative overflow-hidden"
                        >
                            {/* Decor nhẹ cho button sinh động hơn */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>

                            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-indigo-50 dark:border-indigo-500/30 flex items-center justify-center shrink-0 shadow-sm z-10">
                                <Landmark size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 z-10">
                                <p className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                                    Cổng thanh toán VNPAY
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Quét mã QR, Thẻ ATM, Visa/Mastercard
                                </p>
                            </div>
                            <div className="z-10 bg-indigo-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <PlusCircle size={20} />
                            </div>
                        </button>

                        {/* Option 2: MoMo (Disabled/Comming Soon) */}
                        <button
                            disabled
                            className="w-full flex items-center gap-4 p-4 border border-slate-100 bg-slate-50 rounded-2xl opacity-60 cursor-not-allowed text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <Smartphone size={24} className="text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-500">Ví MoMo</p>
                                <p className="text-xs text-slate-400">Đang bảo trì hệ thống</p>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            Mọi giao dịch nạp tiền đều được mã hóa an toàn và cập nhật số dư ngay lập tức.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletPage;