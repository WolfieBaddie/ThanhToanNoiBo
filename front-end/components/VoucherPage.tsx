
import React, { useState } from 'react';
import { Ticket, Clock, Copy, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

const VoucherPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Generate more mock data for pagination
  const generateVouchers = () => {
    const baseVouchers = [
      { id: 1, title: 'Giảm 50% Bữa Sáng', code: 'SANGVUI50', exp: '30/06/2024', color: 'bg-primary', textColor: 'text-slate-900' },
      { id: 2, title: 'Tặng 1 Nước Ngọt', code: 'FREEWATER', exp: '15/06/2024', color: 'bg-white', textColor: 'text-slate-900' },
      { id: 3, title: 'Giảm 10K Đơn > 50K', code: 'GIAM10K', exp: '30/05/2024', color: 'bg-slate-900', textColor: 'text-white' },
      { id: 4, title: 'Combo Trưa 25K', code: 'LUNCH25', exp: '01/06/2024', color: 'bg-white', textColor: 'text-slate-900' },
      { id: 5, title: 'Free Upsize Nước', code: 'UPSIZE', exp: '10/06/2024', color: 'bg-white', textColor: 'text-slate-900' },
      { id: 6, title: 'Giảm 20% Snack', code: 'SNACK20', exp: '20/06/2024', color: 'bg-primary', textColor: 'text-slate-900' },
      { id: 7, title: 'Mua 1 Tặng 1', code: 'B1G1TEA', exp: '05/06/2024', color: 'bg-slate-900', textColor: 'text-white' },
      { id: 8, title: 'Giảm 5K Bánh Mì', code: 'BANHMI5', exp: '12/06/2024', color: 'bg-white', textColor: 'text-slate-900' },
      { id: 9, title: 'Combo Bạn Bè 50K', code: 'FRIEND50', exp: '25/06/2024', color: 'bg-white', textColor: 'text-slate-900' },
      { id: 10, title: 'Giảm 15% Tổng Bill', code: 'ALL15', exp: '30/06/2024', color: 'bg-primary', textColor: 'text-slate-900' },
    ];
    return baseVouchers;
  };

  const vouchers = generateVouchers();
  const totalPages = Math.ceil(vouchers.length / itemsPerPage);
  
  const currentVouchers = vouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Kho Voucher</h1>
        <p className="text-slate-500 font-medium">Săn ưu đãi, ăn uống thả ga!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentVouchers.map((v) => (
          <div key={v.id} className={`relative p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col min-h-[220px] justify-between group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${v.color === 'bg-slate-900' ? 'dark:border-slate-700' : ''} ${v.color}`}>
            {/* Background Pattern */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-current opacity-5 rounded-full pointer-events-none"></div>
            
            <div className={`relative z-10 flex justify-between items-start ${v.textColor}`}>
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <Ticket size={24} />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold opacity-70 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                    <Clock size={12} />
                    <span>HSD: {v.exp}</span>
                </div>
            </div>

            <div className={`relative z-10 mt-4 ${v.textColor}`}>
                <h3 className="text-2xl font-bold leading-tight mb-1">{v.title}</h3>
                <p className="text-sm opacity-70 font-medium">Áp dụng tại tất cả căng tin</p>
            </div>

            <div className="relative z-10 pt-6 mt-4 border-t border-current/10 flex items-center justify-between gap-4">
                <div className={`px-4 py-2 rounded-xl font-mono font-bold text-sm tracking-wider border border-current/20 flex items-center gap-2 ${v.textColor}`}>
                    {v.code}
                    <Copy size={14} className="cursor-pointer hover:scale-110 transition-transform"/>
                </div>
                <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${v.textColor === 'text-white' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                    <ArrowRight size={18} />
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
            <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft size={20} />
            </button>
            
            <span className="px-4 font-bold text-slate-500">
                Trang <span className="text-slate-900 dark:text-white">{currentPage}</span> / {totalPages}
            </span>

            <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      )}
    </div>
  );
};

export default VoucherPage;
