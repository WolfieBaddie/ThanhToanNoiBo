import React from 'react';

interface ChartProps {
    data: number[]; // Mảng chiều cao phần trăm (0-100)
}

export const SpendingChart: React.FC<ChartProps> = ({ data }) => {
    return (
        <div className="lg:col-span-2 bg-dark-surface p-6 rounded-2xl border border-dark-border flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-lg font-bold text-white">Biểu đồ chi tiêu</h3>
                    <p className="text-slate-500 text-sm mt-1">Biến động số dư tuần qua</p>
                </div>
                <select className="bg-dark-bg border border-dark-border text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-brand-primary">
                    <option>7 ngày qua</option>
                    <option>Tháng này</option>
                </select>
            </div>

            {/* CSS Bar Chart */}
            <div className="flex-1 flex items-end justify-between gap-4 px-2 h-48 md:h-64 pb-4">
                {data.map((height, idx) => (
                    <div key={idx} className="w-full flex flex-col items-center gap-2 group cursor-default">
                        <div className="relative w-full h-full flex items-end">
                            <div
                                style={{ height: `${height}%` }}
                                className={`w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80 ${
                                    idx === 3
                                        ? 'bg-brand-primary shadow-glow-blue' // Dùng shadow từ config
                                        : 'bg-slate-700/50'
                                }`}
                            ></div>
                        </div>
                        <span className="text-xs text-slate-500 font-medium group-hover:text-slate-300 transition-colors">
                T{idx + 2}
            </span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-dark-border">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand-primary"></div>
                    <span className="text-xs text-slate-400">Chi tiêu cao nhất</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-700/50"></div>
                    <span className="text-xs text-slate-400">Trung bình</span>
                </div>
            </div>
        </div>
    );
};