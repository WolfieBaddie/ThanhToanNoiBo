import React from 'react';
import { MenuEmptyState } from './MenuEmptyState';
import { MenuItemCard } from './MenuItemCard';
import { CatalogItem } from '@/types/catalog.type';

interface MenuGridProps {
    items: CatalogItem[];
    isLoading?: boolean; // Thêm prop loading để hiện skeleton nếu cần
    onClearFilters?: () => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, isLoading, onClearFilters }) => {

    // Skeleton Loading (Giữ layout grid cũ)
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-slate-100 rounded-[24px] h-[320px] animate-pulse" />
                ))}
            </div>
        );
    }

    // Empty State
    if (items.length === 0) {
        return <MenuEmptyState onClearFilters={onClearFilters || (() => {})} />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => {
                // [SỬA LOGIC KEY]:
                // - Package dùng packageId
                // - Service dùng masterServiceCode (vì serviceId giờ nằm trong options)
                // - Fallback dùng serviceName + index nếu cần
                const key = item.type === 'PACKAGE'
                    ? item.packageId
                    : (item.masterServiceCode || item.serviceName);

                return <MenuItemCard key={key} item={item} />;
            })}
        </div>
    );
};