import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, MoreHorizontal, Loader2, PackageX } from 'lucide-react';
import { useMerchantChart } from '@/hooks/useMerchantChart'; // Import Hook mới

export const MerchantRevenueChart: React.FC = () => {
    // 1. Sử dụng Hook để lấy dữ liệu
    const { chartData, topItems, loading, period, setPeriod } = useMerchantChart('Week');

    // 2. Tính toán tổng doanh thu hiển thị
    const totalRevenue = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.value, 0);
    }, [chartData]);

    // 3. Xử lý dữ liệu hiển thị cho Biểu đồ (Tính % chiều cao cột)
    const processedChartData = useMemo(() => {
        if (chartData.length === 0) return [];
        // Tìm giá trị lớn nhất để làm mốc 100%
        const maxVal = Math.max(...chartData.map(d => d.value), 1);

        return chartData.map(d => ({
            ...d,
            // Chiều cao tối thiểu 10% để cột không bị mất nếu giá trị nhỏ
            height: Math.max(10, Math.round((d.value / maxVal) * 100))
        }));
    }, [chartData]);

    // Format tiền tệ
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* --- CỘT 1: BIỂU ĐỒ DOANH THU --- */}
            <div className="lg:col-span-2 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Biểu đồ doanh thu</h3>
                        <p className="text-sm text-slate-500 font-medium">
                            Tổng thu {period === 'Week' ? 'tuần này' : 'tháng này'}:
                            <span className="text-indigo-600 font-extrabold ml-1">
                                {formatCurrency(totalRevenue)}đ
                            </span>
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-slate-50 p-1 rounded-xl flex text-xs font-bold border border-slate-100">
                        {['Week', 'Month'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg transition-all ${period === p
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                    : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {p === 'Week' ? 'Tuần' : 'Tháng'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart Bars */}
                <div className="flex-1 flex items-end justify-between gap-2 px-2 min-h-[200px]">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-slate-300" />
                        </div>
                    ) : processedChartData.length > 0 ? (
                        processedChartData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                                <div className="relative w-full h-[180px] bg-slate-50 rounded-2xl flex items-end overflow-hidden border border-slate-100">
                                    <div
                                        style={{ height: `${d.height}%` }}
                                        className={`w-full transition-all duration-1000 ease-out relative group-hover:opacity-80 
                                            ${d.value > 0 ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                    >
                                        {/* Tooltip giá tiền */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold shadow-xl">
                                            {d.value >= 1000000
                                                ? (d.value / 1000000).toFixed(1) + 'M'
                                                : (d.value / 1000).toFixed(0) + 'k'}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center">
                                    {d.dayName}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <TrendingUp size={40} className="mb-2 opacity-50"/>
                            <span className="text-xs">Chưa có dữ liệu</span>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CỘT 2: MÓN BÁN CHẠY --- */}
            <div className="lg:col-span-1 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Top Bán Chạy</h3>
                    <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300"/></div>
                    ) : topItems.length > 0 ? (
                        topItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Rank Badge */}
                                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-xs 
                                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        idx === 1 ? 'bg-slate-100 text-slate-600' :
                                            idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                                        #{idx + 1}
                                    </div>
                                    <div className="truncate">
                                        <p className="font-bold text-sm text-slate-800 truncate" title={item.itemName}>
                                            {item.itemName}
                                        </p>
                                        <p className="text-xs font-medium text-slate-500">{item.sales} lượt bán</p>
                                    </div>
                                </div>
                                {/* Trend Badge giả lập (vì Backend hiện tại hardcode "up") */}
                                <div className={`flex items-center gap-1 text-xs font-bold ${item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {item.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <PackageX size={32} className="mb-2"/>
                            <span className="text-xs">Chưa có số liệu</span>
                        </div>
                    )}
                </div>

                <button className="w-full mt-4 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                    Xem toàn bộ
                </button>
            </div>
        </div>
    );
};