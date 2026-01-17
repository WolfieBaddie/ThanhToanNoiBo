
import React from 'react';
import { Search } from 'lucide-react';

interface MenuEmptyStateProps {
  onClearFilters: () => void;
}

export const MenuEmptyState: React.FC<MenuEmptyStateProps> = ({ onClearFilters }) => {
  return (
    <div className="col-span-full py-12 text-center text-slate-400">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search size={32} className="text-slate-300 dark:text-slate-500" />
      </div>
      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Không tìm thấy dịch vụ nào</p>
      <button 
        onClick={onClearFilters} 
        className="mt-4 text-slate-900 dark:text-white font-bold hover:underline"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
};
