import React, { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransaction';
import { formatCurrency } from '@/utils/format';

export const SpendingChart: React.FC = () => {
    const [period, setPeriod] = useState<'Week' | 'Month'>('Week');

    // 1. Tính toán ngày bắt đầu và kết thúc dựa trên Period
    const { fromDate, toDate } = useMemo(() => {
        const end = new Date();
        const start = new Date();
        if (period === 'Week') {
            start.setDate(end.getDate() - 6); // 7 ngày gần nhất (tính cả hôm nay)
        } else {
            start.setDate(end.getDate() - 29); // 30 ngày gần nhất
        }
        return { fromDate: start, toDate: end };
    }, [period]);

    // 2. Gọi Hook lấy dữ liệu
    // size: 100 để đảm bảo lấy đủ giao dịch trong khoảng thời gian này
    const { data, loading, setFilters } = useTransactions({
        page: 0,
        size: 100,
        type: 'REDEMPTION'
    });

    // 3. Cập nhật bộ lọc khi đổi Period
    useEffect(() => {
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        setFilters(prev => ({
            ...prev,
            page: 0,
            size: 100,
            type: 'REDEMPTION',
            fromDate: formatDate(fromDate),
            toDate: formatDate(toDate)
        }));
    }, [period, fromDate, toDate, setFilters]);

    // 4. Xử lý dữ liệu để vẽ biểu đồ
    const chartData = useMemo(() => {
        // Tạo khung dữ liệu cho tất cả các ngày trong khoảng thời gian (Bucket)
        const buckets: { dateStr: string; label: string; value: number }[] = [];
        const current = new Date(fromDate);
        const end = new Date(toDate);

        // Khởi tạo bucket rỗng cho từng ngày
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const day = current.getDate();
            const month = current.getMonth() + 1;
            buckets.push({
                dateStr: dateStr,
                label: `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`,
                value: 0
            });
            current.setDate(current.getDate() + 1);
        }

        // Cộng dồn Amount từ transaction vào các ngày tương ứng
        if (data && data.length > 0) {
            data.forEach(txn => {
                if (txn.status === 'COMPLETED') {
                    // Cắt chuỗi ngày từ createdAt (YYYY-MM-DD)
                    const txnDateStr = new Date(txn.createdAt).toISOString().split('T')[0];
                    const bucket = buckets.find(b => b.dateStr === txnDateStr);
                    if (bucket) {
                        // Lấy giá trị tuyệt đối của amount để hiển thị chi tiêu (dương)
                        bucket.value += Math.abs(txn.amount);
                    }
                }
            });
        }

        // Tìm giá trị lớn nhất để tính chiều cao % (scale biểu đồ)
        const maxValue = Math.max(...buckets.map(b => b.value));
        const safeMax = maxValue === 0 ? 1 : maxValue; // Tránh chia cho 0

        return buckets.map(b => ({
            ...b,
            heightPercent: (b.value / safeMax) * 100,
            displayValue: formatCurrency(b.value)
        }));
    }, [data, fromDate, toDate]);

    // Lọc labels hiển thị trục X (để không bị dày đặc quá nếu chọn Tháng)
    const xLabels = useMemo(() => {
        if (period === 'Week') return chartData;
        // Nếu là Month, lấy khoảng 5-6 mốc đại diện
        const step = Math.ceil(chartData.length / 5);
        return chartData.filter((_, index) => index % step === 0 || index === chartData.length - 1);
    }, [chartData, period]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full min-h-[350px]">
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Biểu đồ chi tiêu</h3>
                <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex text-xs font-bold">
                    <button
                        onClick={() => setPeriod('Week')}
                        className={`px-4 py-2 rounded-lg transition-all ${period === 'Week' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Tuần
                    </button>
                    <button
                        onClick={() => setPeriod('Month')}
                        className={`px-4 py-2 rounded-lg transition-all ${period === 'Month' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Tháng
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-2 pt-4 px-2 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 z-10 backdrop-blur-[1px]">
                        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                    </div>
                )}

                {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                        <div className="w-full relative h-full flex items-end overflow-visible">
                            {/* Bar */}
                            <div
                                style={{height: `${d.heightPercent}%`}}
                                className={`w-full rounded-t-md transition-all duration-700 ease-out relative min-h-[4px]
                                    ${d.value > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-slate-100 dark:bg-slate-700'}
                                `}
                            >
                                {/* Tooltip Value */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold shadow-lg pointer-events-none transform translate-y-2 group-hover:translate-y-0 duration-200">
                                    {d.displayValue}
                                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between mt-4 px-1 border-t border-slate-100 dark:border-slate-700 pt-4">
                {xLabels.map((item, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
};