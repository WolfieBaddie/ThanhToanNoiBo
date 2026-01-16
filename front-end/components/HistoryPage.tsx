import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, ChevronLeft, ChevronRight, Calendar, ArrowRight, X } from 'lucide-react';
import { DateRangeModal } from './ui/DateRangeModal';

// --- Types & Mock Data Generation ---
interface Transaction {
  id: number;
  title: string;
  date: string; // ISO String for easier sorting/filtering
  displayDate: string;
  amount: number;
  type: 'in' | 'out';
  status: string;
  ref: string;
}

const generateMockData = (): Transaction[] => {
  const data: Transaction[] = [];
  const titlesOut = ['Cơm trưa (Combo 1)', 'Sữa tươi Vinamilk', 'Bánh mì sandwich', 'Mua dụng cụ học tập', 'Nước cam ép', 'Phở bò', 'Snack khoai tây', 'Trà đào cam sả'];
  const titlesIn = ['Nạp tiền vào ví', 'Nạp tiền tự động', 'Hoàn tiền', 'Thưởng học tập'];
  const now = new Date();

  for (let i = 0; i < 45; i++) {
    const isIncome = Math.random() > 0.7;
    const date = new Date(now);
    // Randomize date back to 100 days
    date.setDate(date.getDate() - Math.floor(Math.random() * 100)); 
    // Randomize time
    date.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 60));

    data.push({
      id: i + 1,
      title: isIncome 
        ? titlesIn[Math.floor(Math.random() * titlesIn.length)] 
        : titlesOut[Math.floor(Math.random() * titlesOut.length)],
      date: date.toISOString(),
      displayDate: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      amount: isIncome ? (Math.floor(Math.random() * 5) + 1) * 100000 : (Math.floor(Math.random() * 10) + 1) * 5000 * -1,
      type: isIncome ? 'in' : 'out',
      status: 'Thành công',
      ref: isIncome ? `Momo-${10000 + i}` : `POS-${20000 + i}`
    });
  }
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const HistoryPage: React.FC = () => {
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
      
      // 1. Text Search
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.ref.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Date Range Filter
      if (dateRange.from && dateRange.to) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        if (itemDate < fromDate || itemDate > toDate) return false;
      } else if (dateRange.from) {
         // Single date filter
         const fromDate = new Date(dateRange.from);
         fromDate.setHours(0, 0, 0, 0);
         const endOfDay = new Date(dateRange.from);
         endOfDay.setHours(23, 59, 59, 999);
         if (itemDate < fromDate || itemDate > endOfDay) return false;
      }

      return true;
    });
  }, [allTransactions, searchTerm, dateRange]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentItems = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
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

  const formatDateDisplay = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lịch sử giao dịch</h1>
          <p className="text-slate-500 dark:text-slate-400">Kiểm soát chi tiêu chi tiết theo thời gian thực.</p>
        </div>

        {/* Toolbar Container */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
             
             {/* LEFT: Date Filter Trigger */}
             <div className="relative z-20">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsDateModalOpen(!isDateModalOpen)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all font-bold text-sm group
                            ${dateRange.from 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-slate-500 hover:text-indigo-600 dark:hover:text-white hover:shadow-sm'
                            }`}
                    >
                        <Calendar size={18} className={dateRange.from ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-white'} />
                        
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

                        {/* Chevron indicator */}
                        <ChevronRight size={16} className={`transition-transform duration-200 ${isDateModalOpen ? 'rotate-90' : 'rotate-0'} ${dateRange.from ? 'opacity-50' : 'text-slate-400'}`} />
                    </button>

                    {/* Clear Button */}
                    {(dateRange.from || dateRange.to) && (
                        <button 
                            onClick={() => setDateRange({from: '', to: ''})}
                            className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                            title="Xóa lọc ngày"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Dropdown Modal */}
                <DateRangeModal 
                    isOpen={isDateModalOpen}
                    onClose={() => setIsDateModalOpen(false)}
                    onApply={handleDateRangeApply}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all focus:bg-white dark:focus:bg-slate-900 shadow-sm placeholder:text-slate-400 text-slate-800 dark:text-white font-medium" 
                />
             </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[400px] transition-colors">
        <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        <th className="p-4 font-semibold whitespace-nowrap">Giao dịch</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Thời gian</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Mã GD</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Trạng thái</th>
                        <th className="p-4 font-semibold text-right whitespace-nowrap">Số tiền</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'in' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                        {item.type === 'in' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</span>
                                </div>
                            </td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.displayDate}</td>
                            <td className="p-4 font-mono text-slate-400 text-xs">{item.ref}</td>
                            <td className="p-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                                    {item.status}
                                </span>
                            </td>
                            <td className={`p-4 text-right font-bold whitespace-nowrap ${item.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {item.type === 'in' ? '+' : ''}{item.amount.toLocaleString('vi-VN')}đ
                            </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                                  <Search size={32} className="text-slate-300 dark:text-slate-500" />
                              </div>
                              <p className="font-medium text-slate-600 dark:text-slate-400">Không tìm thấy giao dịch nào</p>
                              <p className="text-sm text-slate-400 dark:text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                              <button onClick={() => {setSearchTerm(''); setDateRange({from: '', to: ''})}} className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                                Xóa toàn bộ lọc
                              </button>
                           </div>
                        </td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800">
             <div className="text-sm text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-bold text-slate-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> trong tổng số <span className="font-bold text-slate-800 dark:text-white">{filteredTransactions.length}</span> kết quả
             </div>
             
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      onClick={() => setCurrentPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === p 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-slate-500 hover:text-indigo-600 dark:hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                   );
                })}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;