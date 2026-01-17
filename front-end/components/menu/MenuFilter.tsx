
import React from 'react';
import { Search } from 'lucide-react';
import { Category } from './types';


interface MenuFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  categories: Category[];
}

export const MenuFilter: React.FC<MenuFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 transition-colors">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm dịch vụ..."
          className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Categories Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
              selectedCategory === cat.id
                ? 'bg-primary border-primary text-slate-900 shadow-md shadow-lime-200/50'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
