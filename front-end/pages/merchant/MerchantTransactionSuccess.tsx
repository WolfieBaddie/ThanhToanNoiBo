// src/pages/merchant/MerchantTransactionSuccess.tsx

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    CheckCircle2, Home, QrCode, Copy, Share2,
    Calendar, ArrowRight, Receipt
} from 'lucide-react';
import { ProcessQrResponse } from '@/types/qr.type';
import { formatCurrency } from '@/utils/format';

const MerchantTransactionSuccess: React.FC = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    // Lấy dữ liệu kết quả từ trang trước truyền sang
    const result = state?.result as ProcessQrResponse;

    // Nếu vào thẳng link này mà không có data -> đá về dashboard
    if (!result) {
        navigate('/merchant/dashboard');
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">

            <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl overflow-hidden animate-in zoom-in-95 duration-300 relative">

                {/* Decoration Top */}
                <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                <div className="p-8 pt-10 text-center">

                    {/* Icon Success */}
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm animate-in bounce-in duration-500 delay-100">
                        <CheckCircle2 size={48} className="text-emerald-500" strokeWidth={3} />
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 mb-2">Thanh toán thành công!</h1>
                    <p className="text-slate-500 font-medium text-sm mb-8">
                        Giao dịch đã được ghi nhận vào hệ thống.
                    </p>

                    {/* Receipt Card */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative">
                        {/* Răng cưa receipt (CSS trick đơn giản hoặc để trơn) */}
                        <div className="space-y-4">

                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 border-dashed">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã giao dịch</span>
                                <span className="text-sm font-bold text-slate-800 font-mono flex items-center gap-2">
                                    {result.transactionRef}
                                    <Copy size={14} className="text-slate-400 cursor-pointer hover:text-indigo-600" />
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 border-dashed">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian</span>
                                <span className="text-sm font-bold text-slate-800">
                                    {new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}
                                </span>
                            </div>

                            <div className="pt-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Tổng giá trị / Số lượng</p>
                                <div className="flex justify-between items-end">
                                    <p className="text-3xl font-black text-emerald-600">
                                        {formatCurrency(result.paidAmount)}
                                    </p>
                                    <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                                        Hoàn tất
                                    </div>
                                </div>
                            </div>

                            {result.message && (
                                <div className="mt-4 bg-white p-3 rounded-xl border border-slate-100 text-xs font-medium text-slate-500 text-left">
                                    <span className="font-bold text-slate-700">Ghi chú:</span> {result.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/merchant/dashboard')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all group"
                    >
                        <Home size={24} className="text-slate-400 group-hover:text-slate-600" />
                        <span className="text-xs font-bold text-slate-600">Trang chủ</span>
                    </button>

                    <button
                        onClick={() => navigate('/merchant/dashboard', { state: { openScan: true } })} // Logic mở lại modal scan nếu cần
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95"
                    >
                        <QrCode size={24} />
                        <span className="text-xs font-bold">Quét tiếp</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MerchantTransactionSuccess;