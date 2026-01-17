import React from 'react';
import { MoreHorizontal, LucideIcon } from 'lucide-react';

export interface StatItem {
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: LucideIcon;
    colorClass: string;
}

interface StatsGridProps {
    stats: StatItem[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-dark-surface p-5 rounded-2xl border border-dark-border hover:border-slate-600 transition-colors group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                            <stat.icon size={18} className={stat.colorClass} />
                            {stat.label}
                        </div>
                        <button className="text-slate-600 hover:text-white transition-colors">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                                {stat.value}
                            </h3>
                            <p className="text-xs text-slate-500">Last 30 days</p>
                        </div>
                        <div
                            className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${
                                stat.isPositive
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-orange-500/10 text-orange-400'
                            }`}
                        >
                            {stat.isPositive ? '↑' : '↓'} {stat.change}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
