import React from 'react';
import { MenuEmptyState } from './MenuEmptyState';
import { MenuItemCard } from './MenuItemCard';
import { CatalogItem } from '@/types/catalog.type'; // Sử dụng type mới

interface MenuGridProps {
    items: CatalogItem[]; // <-- Cập nhật type tại đây
    onClearFilters: () => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, onClearFilters }) => {
    if (items.length === 0) {
        return <MenuEmptyState onClearFilters={onClearFilters} />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => {
                // Dùng ID phù hợp làm key
                const key = item.type === 'PACKAGE' ? item.packageId : item.serviceId;
                return <MenuItemCard key={key} item={item} />;
            })}
        </div>
    );
};