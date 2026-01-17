
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from './history/types';
import { generateMockData } from './history/mockData';
import { HistoryHeader } from './history/HistoryHeader';
import { HistoryToolbar } from './history/HistoryToolbar';
import { HistoryTable } from './history/HistoryTable';
import { HistoryPagination } from './history/HistoryPagination';

interface HistoryPageProps {
  onViewDetail?: (id: number) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onViewDetail }) => {
  // State
  const [allTransactions] = useState<Transaction[]>(generateMockData());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({ from: '', to: '' });
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(item => {
      const itemDate = new Date(item.date);
      
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.ref.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (dateRange.from && dateRange.to) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        if (itemDate < fromDate || itemDate > toDate) return false;
      } else if (dateRange.from) {
         const fromDate = new Date(dateRange.from);
         fromDate.setHours(0, 0, 0, 0);
         const endOfDay = new Date(dateRange.from);
         endOfDay.setHours(23, 59, 59, 999);
         if (itemDate < fromDate || itemDate > endOfDay) return false;
      }

      return true;
    });
  }, [allTransactions, searchTerm, dateRange]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentItems = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange]);

  const handleDateRangeApply = (from: Date, to: Date) => {
     setDateRange({
         from: from.toISOString(),
         to: to.toISOString()
     });
     setIsDateModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateRange({from: '', to: ''});
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <HistoryHeader />

        <HistoryToolbar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateRange={dateRange}
          onClearDate={() => setDateRange({from: '', to: ''})}
          isDateModalOpen={isDateModalOpen}
          onToggleDateModal={() => setIsDateModalOpen(!isDateModalOpen)}
          onDateRangeApply={handleDateRangeApply}
        />
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[400px] transition-colors">
        <HistoryTable 
          transactions={currentItems} 
          onViewDetail={onViewDetail}
          onClearFilters={handleClearFilters}
        />

        {filteredTransactions.length > 0 && (
          <HistoryPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTransactions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
