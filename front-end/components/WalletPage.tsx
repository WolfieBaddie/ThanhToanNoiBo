
import React from 'react';
import { Smartphone, PlusCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { WalletCard } from './dashboard/WalletCard';
import { Button } from './ui/Button';

const WalletPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Ví & Nạp tiền</h1>
            <p className="text-slate-500 font-medium mt-1">Quản lý nguồn tiền an toàn.</p>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            <ShieldCheck size={16} />
            Bảo mật SSL
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Card & Limit */}
        <div className="space-y-8">
          <WalletCard 
            balance={1250000} 
            studentName="NGUYEN VAN B" 
            studentId="HS2024-0058"
          />

          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 p-8 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-6 flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <AlertCircle size={20} className="text-slate-900 dark:text-white" />
              </div>
              Cài đặt hạn mức
            </h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-6 border-b border-slate-50 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Giới hạn theo ngày</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">Số tiền tối đa bé có thể dùng trong 1 ngày</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl">
                  <input type="text" value="50.000" className="w-16 bg-transparent font-bold text-right outline-none text-slate-900 dark:text-white" readOnly />
                  <span className="text-xs font-bold text-slate-400">VND</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                   <p className="font-bold text-slate-800 dark:text-slate-200">Tự động nạp tiền</p>
                   <p className="text-xs font-medium text-slate-400 mt-1">Khi số dư dưới 20.000đ</p>
                </div>
                <div className="w-14 h-8 bg-primary rounded-full relative cursor-pointer shadow-sm transition-all hover:scale-105">
                    <div className="absolute right-1 top-1 w-6 h-6 bg-slate-900 rounded-full transition-all"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Top Up Methods - ONLY MOMO */}
        <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 p-8 shadow-sm h-full transition-colors flex flex-col">
           <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-6">Nạp tiền vào ví</h3>
           
           <div className="space-y-4 flex-1">
              <button className="w-full flex items-center gap-5 p-6 border-2 border-primary bg-primary/10 rounded-3xl transition-all group text-left relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-brand-momo text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform z-10">
                    <Smartphone size={32} />
                  </div>
                  <div className="flex-1 z-10">
                    <p className="font-bold text-xl text-slate-900 dark:text-white">Ví MoMo</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">Liên kết & Nạp ngay</p>
                  </div>
                  <div className="absolute right-6 bg-primary text-slate-900 p-2 rounded-full">
                      <PlusCircle size={24} />
                  </div>
              </button>
           </div>

           <div className="mt-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl mb-6">
                 <div className="flex justify-between mb-2">
                     <span className="text-sm font-bold text-slate-500">Số tiền nạp</span>
                     <span className="text-sm font-bold text-slate-900 dark:text-white">100.000đ</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-sm font-bold text-slate-500">Phí giao dịch</span>
                     <span className="text-sm font-bold text-emerald-500">Miễn phí</span>
                 </div>
              </div>
              <Button fullWidth className="py-4 text-lg bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/10">Xác nhận nạp tiền</Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
