import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

export const MerchantRevenueChart: React.FC = () => {
    const [period, setPeriod] = useState('Week');

    const revenueData = [
        { day: 'T2', amount: 3200000, height: 60 },
        { day: 'T3', amount: 4500000, height: 85 },
        { day: 'T4', amount: 2800000, height: 50 },
        { day: 'T5', amount: 5100000, height: 95 },
        { day: 'T6', amount: 3900000, height: 75 },
        { day: 'T7', amount: 1500000, height: 30 },
        { day: 'CN', amount: 900000, height: 20 },
    ];

    const topItems = [
        { id: 1, name: 'Cơm sườn bì chả', sales: 125, trend: 'up' },
        { id: 2, name: 'Bún bò Huế', sales: 98, trend: 'up' },
        { id: 3, name: 'Nước cam ép', sales: 85, trend: 'down' },
        { id: 4, name: 'Bánh mì ốp la', sales: 60, trend: 'up' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* --- CỘT 1: BIỂU ĐỒ DOANH THU --- */}
            <div className="lg:col-span-2 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Biểu đồ doanh thu</h3>
                        <p className="text-sm text-slate-500 font-medium">Tổng thu tuần này: <span className="text-indigo-600 font-extrabold">21.900.000đ</span></p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-slate-50 p-1 rounded-xl flex text-xs font-bold border border-slate-100">
                        {['Ngày', 'Tuần', 'Tháng'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg transition-all ${period === p
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                    : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart Bars */}
                <div className="flex-1 flex items-end justify-between gap-4 px-2 min-h-[200px]">
                    {revenueData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                            <div className="relative w-full h-[180px] bg-slate-50 rounded-2xl flex items-end overflow-hidden border border-slate-100">
                                <div
                                    style={{ height: `${d.height}%` }}
                                    // [SỬA LỖI MÀU SẮC]: Thay bg-slate-800 bằng bg-slate-200
                                    className={`w-full transition-all duration-1000 ease-out relative group-hover:opacity-80 
                                        ${d.height > 80 ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                >
                                    {/* Tooltip giá tiền */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold shadow-xl">
                                        {(d.amount / 1000).toLocaleString()}k
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-400">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CỘT 2: MÓN BÁN CHẠY --- */}
            <div className="lg:col-span-1 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Món bán chạy</h3>
                    <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="flex-1 space-y-3">
                    {topItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                            <div className="flex items-center gap-3">
                                {/* Rank Badge */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs 
                                    ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    idx === 1 ? 'bg-slate-100 text-slate-600' :
                                        idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                                    #{idx + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                    <p className="text-xs font-medium text-slate-500">{item.sales} đơn hàng</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {item.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                <span>{item.trend === 'up' ? '+5%' : '-2%'}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="w-full mt-4 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                    Xem báo cáo chi tiết
                </button>
            </div>
        </div>
    );
};