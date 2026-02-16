import React, { useState, useRef, useEffect } from 'react';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { MenuFilter } from '@/components/menu/MenuFilter';
import { MenuGrid } from '@/components/menu/MenuGrid';
import { useCatalog } from '@/hooks/useCatalog';
import { ChevronLeft, ChevronRight, RefreshCw, ChevronDown, Check, ListFilter } from 'lucide-react';

const MenuPage: React.FC = () => {
    // 1. Kết nối với Hook useCatalog (đã cập nhật)
    const {
        displayedItems,
        categories,
        isLoading,
        isServicesLoading,
        pagination,

        // Filter States
        currentFilters,
        viewFilter,

        // Actions
        handleSearch,
        filterByCategory,
        filterByType,
        changePage,
        changePageSize, // [MỚI] Hàm đổi số lượng item/trang
        refresh
    } = useCatalog();

    // 2. State cho Dropdown chọn Size
    const [isSizeOpen, setIsSizeOpen] = useState(false);
    const sizeRef = useRef<HTMLDivElement>(null);
    const pageSizeOptions = [8, 12, 24, 48];

    // Xử lý click ra ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) {
                setIsSizeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClearAll = () => {
        handleSearch('');
        filterByCategory('');
        filterByType('ALL');
    };

    // 3. Helper render số trang (1, 2, ..., 10)
    const renderPageNumbers = () => {
        const { pageNumber, totalPages } = pagination;
        const current = pageNumber + 1;
        const delta = 1; // Số trang hiển thị cạnh trang hiện tại
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots.map((page, index) => {
            if (page === '...') {
                return <span key={`dots-${index}`} className="w-10 h-10 flex items-center justify-center text-slate-400 font-medium">...</span>;
            }
            const pNum = page as number;
            const isActive = pNum === current;
            return (
                <button
                    key={pNum}
                    onClick={() => changePage(pNum - 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        isActive
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-110'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                >
                    {pNum}
                </button>
            );
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 pb-20 pt-6">
            <MenuHeader />

            {/* Filter Bar */}
            <MenuFilter
                searchTerm={currentFilters.keyword || ''}
                onSearchChange={handleSearch}
                selectedCategory={currentFilters.categoryId || ''}
                onCategoryChange={filterByCategory}
                categories={categories}
                viewFilter={viewFilter}
                onViewFilterChange={filterByType}
                onClearAll={handleClearAll}
            />

            {/* [MỚI] Toolbar: Hiển thị kết quả & Chọn Size & Refresh */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm font-bold text-slate-500">
                    Hiển thị {displayedItems.length} kết quả
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Page Size Selector */}
                    <div className="relative z-20" ref={sizeRef}>
                        <button
                            onClick={() => setIsSizeOpen(!isSizeOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-indigo-300 transition-all shadow-sm"
                        >
                            <ListFilter size={16} className="text-slate-400" />
                            <span>{pagination.size || 12} / trang</span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isSizeOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSizeOpen && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {pageSizeOptions.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => { changePageSize(size); setIsSizeOpen(false); }}
                                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 text-left transition-colors"
                                    >
                                        <span>{size} sản phẩm</span>
                                        {pagination.size === size && <Check size={16} className="text-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={refresh}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Grid hiển thị */}
            <div className="min-h-[400px]">
                <MenuGrid
                    items={displayedItems}
                    isLoading={isLoading || isServicesLoading}
                />

                {/* [MỚI] Pagination dạng số */}
                {!isLoading && pagination.totalPages > 1 && viewFilter !== 'PACKAGE' && (
                    <div className="flex flex-col items-center gap-4 pt-12 pb-8">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => changePage(pagination.pageNumber - 1)}
                                disabled={pagination.pageNumber === 0}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {renderPageNumbers()}

                            <button
                                onClick={() => changePage(pagination.pageNumber + 1)}
                                disabled={pagination.pageNumber >= pagination.totalPages - 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                            Đang xem trang {pagination.pageNumber + 1} trên tổng số {pagination.totalPages}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;