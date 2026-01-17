
import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { MenuItem } from './types';


interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-slate-200 dark:hover:shadow-none transition-all group flex flex-col h-full">
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
          src={item.img} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <span className={`absolute top-3 left-3 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full ${
          item.categoryId === 'lunch' ? 'bg-orange-500/90' :
          item.categoryId === 'breakfast' ? 'bg-yellow-500/90' :
          item.categoryId === 'drink' ? 'bg-blue-500/90' :
          'bg-purple-500/90'
        }`}>
          {item.type}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <h4 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-1" title={item.name}>
            {item.name}
          </h4>
        </div>
        <p className="text-slate-400 text-sm mb-4 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
          {item.cal}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-slate-900 dark:text-white font-bold text-lg">
            {item.price.toLocaleString('vi-VN')}đ
          </span>
          <button className="w-10 h-10 rounded-full bg-primary text-slate-900 flex items-center justify-center hover:bg-primary-hover transition-colors shadow-lg shadow-lime-200/50 dark:shadow-none active:scale-90">
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
