import React from 'react';
import { Wifi, Copy, CreditCard, ArrowUpRight, ArrowDownLeft, History, Loader2 } from 'lucide-react';
import { formatCurrency } from "@/utils/format";

interface WalletCardProps {
    balance: number;
    studentName: string;
    studentId: string;
    isLoading?: boolean;
    className?: string;
    onAction?: (action: 'send' | 'receive' | 'history') => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
                                                          balance,
                                                          studentName,
                                                          studentId,
                                                          isLoading = false,
                                                          className = '',
                                                          onAction
                                                      }) => {
    return (
        <div className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white p-6 sm:p-8 shadow-2xl border border-white/10 ${className}`}>

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">

                {/* Header: Chip & Wifi */}
                <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-10 rounded-lg border border-white/20 relative flex items-center justify-center bg-gradient-to-br from-yellow-200/20 to-yellow-500/20 backdrop-blur-md shadow-inner">
                        <div className="w-10 h-6 border border-white/30 rounded flex gap-1 items-center justify-center">
                            <div className="w-[1px] h-full bg-white/20"></div>
                            <div className="w-[1px] h-full bg-white/20"></div>
                        </div>
                    </div>
                    <Wifi className="text-white/40 rotate-90 drop-shadow-md" size={32} />
                </div>

                {/* Balance Area */}
                <div className="mb-8">
                    <p className="text-indigo-200 text-sm font-medium mb-2 flex items-center gap-2">
                        Số dư khả dụng
                        {isLoading && <Loader2 size={14} className="animate-spin" />}
                    </p>
                    <h3 className="text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                        {isLoading ? "---" : formatCurrency(balance)}
                    </h3>
                </div>

                {/* Footer: Info & Actions */}
                <div className="flex flex-col sm:flex-row items-end justify-between gap-6">
                    {/* User Info */}
                    <div className="w-full sm:w-auto">
                        <div className="flex items-center gap-3 mb-1 group cursor-pointer">
                            <p className="font-mono text-xl text-indigo-100 tracking-wider font-bold group-hover:text-white transition-colors">
                                {studentId}
                            </p>
                            <Copy size={16} className="text-indigo-400 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-sm font-medium uppercase tracking-wide opacity-60">{studentName}</p>
                    </div>

                    {/* Quick Actions (Nút chức năng) */}
                    {onAction && (
                        <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                            <button
                                onClick={() => onAction('receive')}
                                className="flex-1 sm:flex-none flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10 transition-all backdrop-blur-sm group"
                                title="Nạp tiền"
                            >
                                <ArrowDownLeft size={20} className="group-hover:scale-110 transition-transform"/>
                            </button>
                            <button
                                onClick={() => onAction('send')}
                                className="flex-1 sm:flex-none flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-orange-500/20 hover:text-orange-400 border border-white/10 transition-all backdrop-blur-sm group"
                                title="Chuyển tiền"
                            >
                                <ArrowUpRight size={20} className="group-hover:scale-110 transition-transform"/>
                            </button>
                            <button
                                onClick={() => onAction('history')}
                                className="flex-1 sm:flex-none flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-blue-500/20 hover:text-blue-400 border border-white/10 transition-all backdrop-blur-sm group"
                                title="Lịch sử"
                            >
                                <History size={20} className="group-hover:scale-110 transition-transform"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};