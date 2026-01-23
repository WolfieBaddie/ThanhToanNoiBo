import React from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { MerchantStatsData } from '@/types/merchant.types'; // Đảm bảo import đúng type

interface MerchantStatsProps {
    data: MerchantStatsData; // data bao gồm: todayRevenue, orderCount, avgOrderValue
}

export const MerchantStats: React.FC<MerchantStatsProps> = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* THẺ 1: DOANH THU (Đổi từ Đen -> Trắng viền Xanh) */}
            <div className="bg-white p-6 rounded-[32px] border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                    <DollarSign size={80} className="text-indigo-600" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                        <Wallet size={20} />
                    </div>
                    <p className="text-slate-500 font-bold text-sm">Doanh thu hôm nay</p>
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                    {data.todayRevenue.toLocaleString('vi-VN')}đ
                </h3>
                <div className="mt-3 flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                    <TrendingUp size={14} /> +12.5% hôm qua
                </div>
            </div>

            {/* THẺ 2: ĐƠN HÀNG */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                    <ShoppingBag size={80} className="text-slate-800" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-full">
                        <ShoppingBag size={20} />
                    </div>
                    <p className="text-slate-500 font-bold text-sm">Đơn hàng</p>
                </div>
                <h3 className="text-3xl font-black text-slate-800">
                    {data.orderCount}
                </h3>
                <p className="mt-3 text-xs text-slate-400 font-bold">
                    Đang xử lý: <span className="text-orange-500">3 đơn</span>
                </p>
            </div>

            {/* THẺ 3: TRUNG BÌNH (Giữ màu xanh nổi bật nhưng làm dịu lại) */}
            <div className="bg-indigo-600 p-6 rounded-[32px] shadow-lg shadow-indigo-200 relative overflow-hidden text-white">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>

                <p className="text-indigo-100 font-bold mb-1 text-sm">Giá trị trung bình</p>
                <h3 className="text-3xl font-black text-white">
                    {data.avgOrderValue.toLocaleString('vi-VN')}đ
                </h3>
                <div className="mt-4 pt-4 border-t border-indigo-500/30 flex justify-between items-center">
                    <span className="text-xs font-medium text-indigo-200">Mục tiêu ngày</span>
                    <span className="text-sm font-bold">35.000đ</span>
                </div>
            </div>
        </div>
    );
};