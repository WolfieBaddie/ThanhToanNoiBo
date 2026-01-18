import React from 'react';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { MenuFilter } from '@/components/menu/MenuFilter';
import { MenuGrid } from '@/components/menu/MenuGrid'; // Bạn nhớ sửa MenuGrid để dùng MenuItem mới
import { useCatalog } from '@/hooks/useCatalog';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const MenuPage: React.FC = () => {
    // Sử dụng Hook useCatalog (Đã viết ở bước trước)
    const {
        services,
        categories,
        isLoading,
        pagination,
        filters,
        handleSearch,
        filterByCategory,
        changePage,
        refresh
    } = useCatalog();

    // Hàm xử lý "Xóa bộ lọc"
    const handleClearAll = () => {
        handleSearch('');       // Reset từ khóa
        filterByCategory('');   // Reset category
    };

    // Hàm mapping data từ ServiceResponse sang MenuItem cho component hiển thị
    // (Nếu Component MenuGrid/Card dùng đúng type ServiceResponse thì không cần map)
    const mappedItems = services.map(s => ({
        serviceId: s.serviceId,
        serviceCode: s.serviceCode,
        serviceName: s.serviceName,
        unitPrice: s.unitPrice,
        categoryName: s.categoryName,
        imageUrl: s.imageUrl,
        description: s.description
    }));

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 pb-20">
            <MenuHeader />

            {/* Filter Section */}
            <MenuFilter
                searchTerm={filters.keyword || ''}
                onSearchChange={handleSearch}
                selectedCategory={filters.categoryId || ''}
                onCategoryChange={filterByCategory}
                categories={categories.map(c => ({
                    categoryId: c.categoryId,
                    categoryName: c.categoryName,
                    categoryCode: c.categoryCode
                }))} // Map đúng field
                onClearAll={handleClearAll}
            />

            {/* Grid Content */}
            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <p>Đang tải danh sách...</p>
                    </div>
                ) : (
                    <>
                        <MenuGrid
                            items={mappedItems}
                            onClearFilters={handleClearAll}
                        />

                        {/* Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 pt-10">
                                <button
                                    onClick={() => changePage(pagination.pageNumber - 1)}
                                    disabled={pagination.pageNumber === 0}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Trang <span className="font-bold text-slate-900 dark:text-white">{pagination.pageNumber + 1}</span> / {pagination.totalPages}
                        </span>

                                <button
                                    onClick={() => changePage(pagination.pageNumber + 1)}
                                    disabled={pagination.pageNumber >= pagination.totalPages - 1}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MenuPage;