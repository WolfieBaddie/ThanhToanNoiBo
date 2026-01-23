
import React from 'react';
import { ArrowRight, Utensils, Zap, CreditCard, ChevronRight } from 'lucide-react';

interface QuickActionPanelProps {
    onNavigate: (tab: string) => void;
}

export const QuickActionPanel: React.FC<QuickActionPanelProps> = ({ onNavigate }) => {
  const actions = [
      { id: 'wallet', label: 'Nạp tiền', icon: <CreditCard size={18} /> },
      { id: 'services', label: 'Đặt món', icon: <Utensils size={18} /> },
      { id: 'history', label: 'Lịch sử', icon: <ArrowRight size={18} /> }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-slate-100 dark:border-slate-700 shadow-sm h-full">
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Truy cập nhanh</h3>
            <button className="text-xs font-bold text-slate-900 hover:text-slate-600 transition-colors underline">Tùy chỉnh</button>
        </div>
        <div className="space-y-3">
            {actions.map((action) => (
                <button 
                    key={action.id}
                    onClick={() => onNavigate(action.id === 'ai' ? 'dashboard' : action.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-primary dark:hover:bg-slate-700/50 transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 group-hover:bg-white/50 text-slate-900 dark:bg-slate-700 dark:text-white`}>
                            {action.icon}
                        </div>
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900">{action.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900" />
                </button>
            ))}
        </div>
    </div>
  );
};
