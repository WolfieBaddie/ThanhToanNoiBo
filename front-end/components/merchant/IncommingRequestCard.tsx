
import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { PaymentRequest } from './types';

interface IncomingRequestCardProps {
    request: PaymentRequest;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export const IncomingRequestCard: React.FC<IncomingRequestCardProps> = ({ request, onApprove, onReject }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border-2 border-slate-100 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            {/* Time Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
                <Clock size={12} /> {request.time}
            </div>

            <div className="flex items-start gap-4 mb-6">
                <img
                    src={request.avatar}
                    alt={request.studentName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-600"
                />
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{request.studentName}</h3>
                    <p className="text-sm font-semibold text-slate-400">{request.studentId}</p>
                    <div className="mt-2 inline-block bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                        Khách hàng thân thiết
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4 mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Đơn hàng</p>
                <ul className="space-y-1 mb-4">
                    {request.items.map((item, idx) => (
                        <li key={idx} className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {item}
                        </li>
                    ))}
                </ul>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-600 flex justify-between items-end">
                    <span className="text-sm font-medium text-slate-500">Tổng thanh toán</span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{request.amount.toLocaleString('vi-VN')}đ</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onReject(request.id)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors"
                >
                    <X size={20} /> Từ chối
                </button>
                <button
                    onClick={() => onApprove(request.id)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-slate-900 font-bold hover:bg-primary-hover shadow-lg shadow-lime-200/50 transition-all active:scale-95"
                >
                    <Check size={20} strokeWidth={3} /> Xác nhận
                </button>
            </div>
        </div>
    );
};
