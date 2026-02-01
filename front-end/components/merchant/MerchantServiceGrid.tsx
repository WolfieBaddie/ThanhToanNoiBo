import React from 'react';
import { MerchantEmptyState } from "@/components/merchant/MerchantEmtpyState";
import { MerchantServiceCard } from './MerchantServiceCard';
import { ServiceItem } from '@/types/merchant.types';
import { Loader2 } from 'lucide-react'; // Import icon loading đẹp hơn nếu muốn

interface MerchantServiceGridProps {
    items: ServiceItem[];
    isLoading: boolean;
    isSystemMode: boolean; // Prop quan trọng để xác định chế độ View
    viewMode: 'list' | 'card'; // [QUAN TRỌNG] Nhận chế độ hiển thị từ Page

    // Actions
    onEdit: (item: ServiceItem) => void;
    onDelete: (id: number | string) => void;
    onToggleStatus: (id: number | string) => void;
    onClearFilters?: () => void;
    onOpenCreate?: () => void;
}

export const MerchantServiceGrid: React.FC<MerchantServiceGridProps> = ({
                                                                            items,
                                                                            isLoading,
                                                                            isSystemMode,
                                                                            viewMode, // [MỚI]
                                                                            onEdit,
                                                                            onDelete,
                                                                            onToggleStatus,
                                                                            onClearFilters,
                                                                            onOpenCreate
                                                                        }) => {

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 dark:border-white mb-4"></div>
                <p className="text-sm font-medium">Đang tải dữ liệu...</p>
            </div>
        );
    }

    // 2. Empty State
    if (items.length === 0) {
        return (
            <MerchantEmptyState
                isSystemMode={isSystemMode}
                onClearFilters={onClearFilters}
                onCreate={onOpenCreate}
            />
        );
    }

    // 3. Grid Layout
    return (
        <div className={`grid gap-6 animate-in fade-in duration-500 ${
            viewMode === 'list'
                ? 'grid-cols-1' // List View: Luôn là 1 cột
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' // Card View: Responsive nhiều cột
        }`}>
            {items.map((item) => (
                <MerchantServiceCard
                    key={item.id}
                    item={item}

                    // Truyền flag readOnly nếu đang ở chế độ System
                    readOnly={isSystemMode}

                    // [QUAN TRỌNG] Truyền xuống Card để đổi layout Flexbox bên trong
                    isListView={viewMode === 'list'}

                    // Logic Action
                    onEdit={onEdit} // System: Gọi form Register, MyStore: Gọi form Edit

                    // Các hàm dưới chỉ có tác dụng nếu !readOnly (đã xử lý trong Card)
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                />
            ))}
        </div>
    );
};