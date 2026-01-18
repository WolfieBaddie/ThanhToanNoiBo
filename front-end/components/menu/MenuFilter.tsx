import React from 'react';
import { Search, X, FilterX } from 'lucide-react';
import { Category } from '@/types/menu.item';

interface MenuFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string; // Category ID (UUID) hoặc ''
    onCategoryChange: (id: string) => void;
    categories: Category[];
    onClearAll: () => void; // Hàm reset toàn bộ
}

export const MenuFilter: React.FC<MenuFilterProps> = ({
                                                          searchTerm,
                                                          onSearchChange,
                                                          selectedCategory,
                                                          onCategoryChange,
                                                          categories,
                                                          onClearAll
                                                      }) => {
    // Kiểm tra xem có đang filter gì không để hiện nút Clear All
    const isFiltering = searchTerm.trim() !== '' || selectedCategory !== '';

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 transition-colors">

            {/* Top Row: Search & Clear Button */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm món ăn, dịch vụ..."
                        className="block w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Nút Xóa bộ lọc (Chỉ hiện khi đang lọc) */}
                {isFiltering && (
                    <button
                        onClick={onClearAll}
                        className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-all border border-red-100 whitespace-nowrap"
                    >
                        <FilterX size={18} />
                        <span className="hidden sm:inline">Xóa lọc</span>
                    </button>
                )}
            </div>

            {/* Categories List */}
            <div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {/* Nút "Tất cả" */}
                    <button
                        onClick={() => onCategoryChange('')}
                        className={`snap-start flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                            selectedCategory === ''
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        Tất cả
                    </button>

                    {/* Các category từ API */}
                    {categories.map((cat) => (
                        <button
                            key={cat.categoryId}
                            onClick={() => onCategoryChange(cat.categoryId)}
                            className={`snap-start flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                                selectedCategory === cat.categoryId
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {cat.categoryName}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};