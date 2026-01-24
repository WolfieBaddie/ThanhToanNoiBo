import React from 'react';
import { Search, X } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/types/merchant.types';

interface ServiceFilterProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    onClear: () => void;
}

export const ServiceFilter: React.FC<ServiceFilterProps> = ({
                                                                searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, onClear
                                                            }) => {
    const hasFilter = searchTerm || selectedCategory !== 'all';

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 w-full md:w-auto flex-1">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm tên món ăn..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all font-medium text-slate-900 dark:text-white"
                    />
                </div>
                {hasFilter && (
                    <button
                        onClick={onClear}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-bold text-xs whitespace-nowrap flex items-center gap-1"
                    >
                        <X size={16} />
                        <span className="hidden sm:inline">Xóa lọc</span>
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                {SERVICE_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                            selectedCategory === cat.id
                                ? 'bg-primary border-primary text-slate-900 shadow-md shadow-lime-200/50'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    );
};