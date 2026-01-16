import React, { useState } from 'react';
import { Plus, QrCode, ArrowRightLeft, Utensils, History, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { WalletCard } from './dashboard/WalletCard';
import { QRScannerModal } from './dashboard/QRScannerModal';
import { Notification } from './ui/Notification';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [showQR, setShowQR] = useState(false);
  const [notification, setNotification] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });

  // Mock Data
  const recentTransactions = [
    { id: 1, title: 'Nạp tiền vào ví', time: '10:30 AM', date: 'Hôm nay', amount: 500000, type: 'in', method: 'Momo' },
    { id: 2, title: 'Cơm trưa (Combo 1)', time: '11:45 AM', date: 'Hôm qua', amount: -35000, type: 'out', location: 'Căng tin A' },
    { id: 3, title: 'Sữa tươi Vinamilk', time: '09:15 AM', date: 'Hôm qua', amount: -12000, type: 'out', location: 'Máy bán hàng' },
    { id: 4, title: 'Bánh mì sandwich', time: '04:00 PM', date: '20/05/2024', amount: -15000, type: 'out', location: 'Căng tin B' },
  ];

  const handleQRScanComplete = (data: string) => {
    setShowQR(false);
    setNotification({ isOpen: true, message: 'Thanh toán thành công: -35.000đ' });
  };

  return (
    <div className="space-y-8">
      <QRScannerModal 
        isOpen={showQR} 
        onClose={() => setShowQR(false)} 
        onScanComplete={handleQRScanComplete}
      />

      <Notification 
        type="success"
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        message={notification.message}
      />

      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan</h1>
          <p className="text-slate-500 dark:text-slate-400">Chào buổi sáng! Cùng xem tình hình chi tiêu của bé.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('wallet')}
            className="bg-slate-900 dark:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-lg shadow-slate-900/20 active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nạp tiền nhanh</span>
            <span className="sm:hidden">Nạp tiền</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Wallet Card */}
          <WalletCard 
            balance={1250000} 
            studentName="NGUYEN VAN B" 
            studentId="HS2024-0058" 
          />

          {/* Quick Actions Grid */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tiện ích nhanh</h3>
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => onNavigate('wallet')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-slate-800 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nạp tiền</span>
              </button>

              <button 
                onClick={() => setShowQR(true)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-slate-800 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <QrCode size={24} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quét QR</span>
              </button>

              <button 
                onClick={() => onNavigate('menu')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-white dark:bg-slate-800 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Utensils size={24} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Đặt món</span>
              </button>
            </div>
          </div>

          {/* Today's Menu Highlight */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-3xl p-6 border border-orange-100 dark:border-orange-900/30 flex items-center justify-between">
             <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                   🍱
                </div>
                <div>
                   <h4 className="font-bold text-slate-800 dark:text-white text-lg">Thực đơn hôm nay</h4>
                   <p className="text-slate-600 dark:text-slate-400 text-sm">Đã đặt: Cơm sườn bì chả + Canh chua</p>
                </div>
             </div>
             <button 
               onClick={() => onNavigate('menu')}
               className="hidden sm:flex text-orange-600 dark:text-orange-400 font-bold text-sm bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm items-center gap-1 hover:bg-orange-50 dark:hover:bg-slate-700"
             >
                Xem chi tiết <ChevronRight size={16} />
             </button>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm p-6 h-full transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Giao dịch gần đây</h3>
              <button 
                onClick={() => onNavigate('history')}
                className="text-indigo-600 dark:text-indigo-400 p-2 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <History size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'in' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {tx.type === 'in' ? <TrendingUp size={20} /> : <Utensils size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{tx.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tx.date} • {tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${tx.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {tx.type === 'in' ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                    </p>
                    {tx.location && <p className="text-xs text-slate-400 mt-0.5">{tx.location}</p>}
                    {tx.method && <p className="text-xs text-slate-400 mt-0.5">{tx.method}</p>}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onNavigate('history')}
              className="w-full mt-8 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Xem tất cả giao dịch <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;