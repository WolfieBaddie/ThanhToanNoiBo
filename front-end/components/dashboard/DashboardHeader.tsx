import React from 'react';
import { Search, Bell, Plus } from 'lucide-react';

interface HeaderProps {
    onNavigate: (tab: string) => void;
    userName?: string;
}

export const DashboardHeader: React.FC<HeaderProps> = ({ onNavigate, userName = "Student" }) => {
    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">Tổng quan</h1>
                <p className="text-slate-400 text-sm">Chào {userName}, đây là tình hình tài chính của bạn.</p>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-dark-input border border-slate-700/50 rounded-xl px-4 py-2.5 w-64 focus-within:border-brand-primary transition-colors">
                    <Search size={18} className="text-slate-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600"
                    />
                </div>

                {/* Notification Bell */}
                <button className="p-2.5 bg-dark-surface hover:bg-dark-hover text-slate-400 rounded-xl border border-dark-border transition-colors relative group">
                    <Bell size={20} className="group-hover:text-white transition-colors"/>
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-dark-surface"></span>
                </button>

                {/* Primary Action */}
                <button
                    onClick={() => onNavigate('wallet')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    <span>Nạp tiền</span>
                </button>
            </div>
        </header>
    );
};