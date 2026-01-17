
import React from 'react';
import { Search, Calendar, ArrowRight, ChevronRight, X } from 'lucide-react';
import { DateRangeModal } from '../ui/DateRangeModal';

interface HistoryToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateRange: { from: string; to: string };
  onClearDate: () => void;
  isDateModalOpen: boolean;
  onToggleDateModal: () => void;
  onDateRangeApply: (from: Date, to: Date) => void;
}

export const HistoryToolbar: React.FC<HistoryToolbarProps> = ({
  searchTerm,
  onSearchChange,
  dateRange,
  onClearDate,
  isDateModalOpen,
  onToggleDateModal,
  onDateRangeApply
}) => {
  const formatDateDisplay = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear()}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
         
         {/* LEFT: Date Filter Trigger */}
         <div className="relative z-20">
            <div className="flex items-center gap-2">
                <button 
                    onClick={onToggleDateModal}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all font-bold text-sm group
                        ${dateRange.from 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white hover:shadow-sm'
                        }`}
                >
                    <Calendar size={18} className={dateRange.from ? 'text-white' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} />
                    
                    {dateRange.from ? (
                        <div className="flex items-center gap-2">
                            <span>{formatDateDisplay(dateRange.from)}</span>
                            {dateRange.to && dateRange.to !== dateRange.from && (
                                <>
                                    <ArrowRight size={14} className="opacity-40" />
                                    <span>{formatDateDisplay(dateRange.to)}</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <span>Lọc theo ngày</span>
                    )}

                    <ChevronRight size={16} className={`transition-transform duration-200 ${isDateModalOpen ? 'rotate-90' : 'rotate-0'} ${dateRange.from ? 'opacity-50' : 'text-slate-400'}`} />
                </button>

                {(dateRange.from || dateRange.to) && (
                    <button 
                        onClick={onClearDate}
                        className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                        title="Xóa lọc ngày"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <DateRangeModal 
                isOpen={isDateModalOpen}
                onClose={() => onToggleDateModal()}
                onApply={onDateRangeApply}
                initialFrom={dateRange.from}
                initialTo={dateRange.to}
            />
         </div>

         {/* RIGHT: Search Bar */}
         <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm giao dịch..." 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all focus:bg-white dark:focus:bg-slate-900 shadow-sm placeholder:text-slate-400 text-slate-800 dark:text-white font-medium" 
            />
         </div>
      </div>
    </div>
  );
};
