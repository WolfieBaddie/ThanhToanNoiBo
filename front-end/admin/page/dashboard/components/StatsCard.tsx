import type { FC } from 'react';

type TrendType = 'up' | 'down';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  borderColor: string;
  trend: TrendType;
  delay?: number;
}

const StatsCard: FC<StatsCardProps> = ({ 
  title, value, change, icon, color, borderColor, trend, delay = 0 
}) => {
  return (
    <div 
      className={`cursor-pointer  group relative overflow-hidden rounded-2xl border ${borderColor} bg-linear-to-br ${color} backdrop-blur-sm py-6 px-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 animate-fadeInUp`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-white/60 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-3">{value}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
              trend === 'up' 
                ? 'bg-linear-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                : 'bg-linear-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30'
            }`}>
              {trend === 'up' ? '↗' : '↘'} {change}
            </span>
            <span className="text-white/40 text-sm">from last month</span>
          </div>
        </div>
        
        <div className={`absolute -right-3 bottom-18 p-2 rounded-xl bg-linear-to-br ${color.replace('/20', '/30')} border ${borderColor} group-hover:scale-110 transition-transform duration-300`}>
          {icon.startsWith('/') ? (
            <img src={icon} alt="" className="w-8 h-8" />
          ) : (
            <span className="text-2xl">{icon}</span>
          )}
        </div>
      </div>

      <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${
            trend === 'up' 
              ? 'bg-linear-to-r from-green-400 to-emerald-400 animate-progress'
              : 'bg-linear-to-r from-red-400 to-pink-400 animate-progress'
          }`}
          style={{ width: trend === 'up' ? '75%' : '40%' }}
        ></div>
      </div>
    </div>
  );
};

export default StatsCard;