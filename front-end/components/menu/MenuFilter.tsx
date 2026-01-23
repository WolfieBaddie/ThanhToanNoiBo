import React from 'react';
import { Search, X, FilterX, Layers, Package, Coffee } from 'lucide-react';
import { ServiceCategory, CatalogItemType } from '@/types/catalog.type'; // Import đúng type

interface MenuFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;

    selectedCategory: string;
    onCategoryChange: (id: string) => void;
    categories: ServiceCategory[]; // Sửa type cho đúng

    // [MỚI] Props cho Filter Type
    viewFilter: CatalogItemType | 'ALL';
    onViewFilterChange: (type: CatalogItemType | 'ALL') => void;

    onClearAll: () => void;
}

export const MenuFilter: React.FC<MenuFilterProps> = ({
                                                          searchTerm,
                                                          onSearchChange,
                                                          selectedCategory,
                                                          onCategoryChange,
                                                          categories,
                                                          viewFilter,
                                                          onViewFilterChange,
                                                          onClearAll
                                                      }) => {
    const isFiltering = searchTerm.trim() !== '' || selectedCategory !== '';

    return (
        <div className="space-y-4">
            {/* 1. [MỚI] Type Toggle Tabs (Combo / Service) */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                <button
                    onClick={() => onViewFilterChange('ALL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        viewFilter === 'ALL'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <Layers size={16} />
                    Tất cả
                </button>
                <button
                    onClick={() => onViewFilterChange('PACKAGE')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        viewFilter === 'PACKAGE'
                            ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <Package size={16} />
                    Combo
                </button>
                <button
                    onClick={() => onViewFilterChange('SERVICE')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        viewFilter === 'SERVICE'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <Coffee size={16} />
                    Dịch vụ
                </button>
            </div>

            {/* 2. Main Filter Box */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 transition-colors">

                {/* Search & Clear Row */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm món ăn, combo..."
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

                {/* Categories List (Chỉ hiện khi không chọn xem Combo - vì Combo thường không chia Category nhỏ) */}
                {viewFilter !== 'PACKAGE' && (
                    <div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
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
                )}
            </div>
        </div>
    );
};