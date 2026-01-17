
import React from 'react';
import { Bell, Moon, Sun, Globe, ChevronRight } from 'lucide-react';

interface PreferencesSectionProps {
  notifications: boolean;
  isDarkMode: boolean;
  language: string;
  onToggleNotifications: () => void;
  onToggleTheme: () => void;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  notifications,
  isDarkMode,
  language,
  onToggleNotifications,
  onToggleTheme,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {/* Notification */}
        <div 
            onClick={onToggleNotifications}
            className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700"
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${notifications ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <Bell size={20} />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">Thông báo</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${notifications ? 'bg-slate-900' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
        </div>

        {/* Theme */}
        <div 
            onClick={onToggleTheme}
            className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white transition-colors">
                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">Giao diện</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                {isDarkMode ? 'Tối' : 'Sáng'}
                <ChevronRight size={16} />
            </div>
        </div>

        {/* Language */}
        <div className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white transition-colors">
                    <Globe size={20} />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">Ngôn ngữ</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                {language}
                <ChevronRight size={16} />
            </div>
        </div>
    </div>
  );
};
