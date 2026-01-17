
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const HistoryPagination: React.FC<HistoryPaginationProps> = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800">
       <div className="text-sm text-slate-500 dark:text-slate-400">
          Hiển thị <span className="font-bold text-slate-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> trong tổng số <span className="font-bold text-slate-800 dark:text-white">{totalItems}</span> kết quả
       </div>
       
       <div className="flex items-center gap-2">
          <button 
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
             let p = i + 1;
             if (totalPages > 5 && currentPage > 3) {
                p = currentPage - 2 + i;
                if (p > totalPages) p = totalPages - (4 - i); 
             }
             if (p <= 0) p = 1;
             
             return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === p 
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-200 dark:shadow-none' 
                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
             );
          })}

          <button 
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
       </div>
    </div>
  );
};
