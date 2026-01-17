
import React from 'react';
import { ArrowRight, Utensils, EyeOff } from 'lucide-react';

export const AuthMarketingSection: React.FC = () => {
  // Mock Transactions for Visual Side
  const mockTransactions = [
    { name: 'Henrik Jansen', type: 'Đã nhận', amount: '+428.000', img: 'https://picsum.photos/100/100?random=1' },
    { name: 'Căng tin A', type: 'Thanh toán', amount: '-124.000', img: 'https://picsum.photos/100/100?random=2' },
    { name: 'Eva Novak', type: 'Đã nhận', amount: '+5.710.000', img: 'https://picsum.photos/100/100?random=3' },
    { name: 'Tạp hóa B', type: 'Thanh toán', amount: '-15.000', img: 'https://picsum.photos/100/100?random=4' },
  ];

  return (
    <div className="hidden lg:flex w-[55%] xl:w-[60%] p-12 flex-col relative overflow-hidden bg-app-bg">
        {/* Header Text */}
        <div className="relative z-20 mb-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Swallet</h1>
            </div>
            <h2 className="text-5xl font-bold text-slate-900 leading-[1.15]">
                Quản lý chi tiêu <br/>
                <span className="text-slate-500">thông minh & an toàn</span>
            </h2>
        </div>

        {/* DASHBOARD MOCKUP ELEMENTS - Floating Cards */}
        <div className="relative flex-1 w-full perspective-1000">
            
            {/* 1. Lime Balance Card */}
            <div className="absolute top-0 left-0 w-[340px] bg-primary rounded-[32px] p-8 shadow-xl shadow-lime-500/10 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500 z-20 animate-float">
                <div className="flex justify-between items-start mb-6">
                    <span className="font-bold text-slate-900 text-lg">VND</span>
                    <EyeOff size={20} className="text-slate-900 opacity-50" />
                </div>
                <div className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">2.101.000</div>
                <div className="text-sm font-bold text-slate-700 mb-8">+15.000 hôm nay</div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm"><ArrowRight size={20} className="-rotate-45 text-slate-900"/></div>
                            <span className="text-xs font-bold text-slate-900">Gửi</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm"><ArrowRight size={20} className="rotate-135 text-slate-900"/></div>
                            <span className="text-xs font-bold text-slate-900">Nhận</span>
                    </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-sm text-white"><Utensils size={20} /></div>
                            <span className="text-xs font-bold text-slate-900">Đặt món</span>
                    </div>
                </div>
            </div>

            {/* 2. Transaction List Card */}
            <div className="absolute top-[40px] left-[280px] w-[320px] bg-white rounded-[32px] p-6 shadow-2xl shadow-slate-200/50 transform rotate-[3deg] hover:rotate-0 transition-transform duration-500 z-10 animate-float-delayed">
                <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-slate-800">Giao dịch gần đây</span>
                    <span className="text-xs font-bold text-slate-400 cursor-pointer">Xem tất cả</span>
                </div>
                <div className="space-y-5">
                    {mockTransactions.map((t, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={t.img} className="w-10 h-10 rounded-full object-cover border border-slate-100" alt=""/>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{t.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t.type}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${t.amount.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{t.amount}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Chart Card (Abstract) */}
            <div className="absolute bottom-[20px] left-[50px] w-[500px] h-[220px] bg-white/60 backdrop-blur-md rounded-[32px] p-6 shadow-lg border border-white transform rotate-0 z-0 flex flex-col justify-end">
                <div className="flex justify-between items-end mb-2 h-[120px] gap-4 px-4">
                    {[40, 65, 30, 80, 55, 90, 45, 70, 50, 60, 35, 75, 50, 85, 60].map((h, i) => (
                        <div key={i} className="w-full bg-slate-900/5 rounded-t-sm relative group">
                            <div style={{height: `${h}%`}} className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-1000 ${i===5 ? 'bg-primary' : 'bg-slate-800'}`}></div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between px-2 text-xs font-bold text-slate-400 mt-2">
                    <span>Chi tiêu năm học 2024</span>
                    <span className="text-slate-800 bg-primary px-2 py-0.5 rounded text-[10px]">Tháng này</span>
                </div>
            </div>
        </div>
        
            <p className="absolute bottom-10 left-12 text-slate-400 text-sm font-medium">
            © 2024 Swallet School Platform.
        </p>
    </div>
  );
};
