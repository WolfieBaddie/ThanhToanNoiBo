
import React from 'react';

import { MenuEmptyState } from './MenuEmptyState';
import { MenuItem } from './types';
import { MenuItemCard } from './MenuItemCard';

interface MenuGridProps {
  items: MenuItem[];
  onClearFilters: () => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, onClearFilters }) => {
  if (items.length === 0) {
    return <MenuEmptyState onClearFilters={onClearFilters} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <MenuItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};
