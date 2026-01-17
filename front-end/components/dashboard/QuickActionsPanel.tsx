import React from 'react';
import { ChevronRight, QrCode, Utensils, CreditCard } from 'lucide-react';

interface QuickActionsProps {
    onScanQR: () => void;
    onNavigate: (tab: string) => void;
}

export const QuickActionsPanel: React.FC<QuickActionsProps> = ({ onScanQR, onNavigate }) => {
    return (
        <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Tiện ích nhanh</h3>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-medium">Phổ biến</span>
            </div>

            <div className="space-y-4 flex-1">
                {/* Action Item: Scan QR */}
                <button
                    onClick={onScanQR}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-indigo-800/40 border border-indigo-500/20 hover:border-indigo-500/50 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-secondary flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            <QrCode size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Quét QR</p>
                            <p className="text-xs text-indigo-200">Thanh toán tại quầy</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-indigo-400" />
                </button>

                {/* Action Item: Menu */}
                <button
                    onClick={() => onNavigate('menu')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-900/40 to-orange-800/40 border border-orange-500/20 hover:border-orange-500/50 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                            <Utensils size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Đặt món</p>
                            <p className="text-xs text-orange-200">Xem thực đơn</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-orange-400" />
                </button>

                {/* Action Item: History */}
                <button
                    onClick={() => onNavigate('wallet')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-dark-bg border border-slate-700 hover:border-slate-500 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                            <CreditCard size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-300 group-hover:text-white">Lịch sử</p>
                            <p className="text-xs text-slate-500">Biến động số dư</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};