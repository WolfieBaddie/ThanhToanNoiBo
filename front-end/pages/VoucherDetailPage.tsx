import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Copy,
    Ticket,
    Tag,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { useVoucherDetail } from '@/hooks/useVoucherDetails';
import { formatCurrency } from '@/utils/format';

const VoucherDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { voucher, isLoading, error } = useVoucherDetail(id);

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Đang tải thông tin vé...</p>
            </div>
        );
    }

    // --- Error State ---
    if (error || !voucher) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Không tìm thấy vé</h2>
                <p className="text-slate-500 mb-6">{error || "Vé không tồn tại hoặc đã bị xóa."}</p>
                <button
                    onClick={() => navigate('/wallet')}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                >
                    Quay lại ví
                </button>
            </div>
        );
    }

    // --- Logic hiển thị trạng thái ---
    const getStatusConfig = () => {
        if (voucher.expired) return {
            color: 'bg-slate-100 dark:bg-slate-800',
            text: 'text-slate-500',
            label: 'Đã hết hạn',
            icon: <XCircle size={18} />
        };
        if (voucher.status === 'USED') return {
            color: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600',
            label: 'Đã sử dụng',
            icon: <CheckCircle2 size={18} />
        };
        if (voucher.status === 'LOCKED') return {
            color: 'bg-red-50 dark:bg-red-900/20',
            text: 'text-red-600',
            label: 'Đang bị khóa',
            icon: <AlertCircle size={18} />
        };
        return {
            color: 'bg-indigo-50 dark:bg-indigo-900/20',
            text: 'text-indigo-600',
            label: 'Đang hiệu lực',
            icon: <Ticket size={18} />
        };
    };

    const statusConfig = getStatusConfig();

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header Navigation */}
            <button
                onClick={() => navigate(-1)}
                className="group flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium"
            >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mr-3 group-hover:border-indigo-500 transition-colors shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                Quay lại
            </button>

            {/* Main Ticket Card */}
            <div className="relative bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                {/* Decorative Pattern Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                {/* Ticket Header (Service Info) */}
                <div className="p-8 pb-10 bg-slate-50/50 dark:bg-slate-900/50 border-b border-dashed border-slate-200 dark:border-slate-700 relative">
                    {/* Cutout Circles for Ticket Effect */}
                    <div className="absolute -left-4 bottom-[-16px] w-8 h-8 bg-[#F3F4F6] dark:bg-[#0f172a] rounded-full border border-slate-200 dark:border-slate-700 z-10"></div>
                    <div className="absolute -right-4 bottom-[-16px] w-8 h-8 bg-[#F3F4F6] dark:bg-[#0f172a] rounded-full border border-slate-200 dark:border-slate-700 z-10"></div>

                    <div className="flex justify-between items-start mb-6">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.color} ${statusConfig.text}`}>
                            {statusConfig.icon}
                            <span>{statusConfig.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-mono">
                            <span>#{voucher.voucherCode.split('-')[0]}</span>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white leading-tight mb-4">
                        {voucher.serviceName}
                    </h1>

                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Tag size={12} /> {voucher.categoryName}
                        </span>
                        <span className="text-slate-400 text-sm">•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                            {formatCurrency(voucher.priceAtPurchase)}
                        </span>
                    </div>
                </div>

                {/* Ticket Body (Details) */}
                <div className="p-8 pt-10 space-y-6">
                    {/* Voucher Code Block */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2 group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mã sử dụng</span>
                        <div
                            className="flex items-center gap-3 text-xl md:text-2xl font-mono font-bold text-slate-800 dark:text-white"
                            onClick={() => {
                                navigator.clipboard.writeText(voucher.voucherCode);
                                // Optional: Show toast
                            }}
                        >
                            {voucher.voucherCode}
                            <Copy size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Calendar size={12} /> Ngày mua
                            </p>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                                {new Date(voucher.createdAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Clock size={12} /> Hết hạn
                            </p>
                            <p className={`font-semibold ${voucher.expired ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                {new Date(voucher.expiresAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Description / Note */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">Lưu ý sử dụng</h4>
                        <ul className="list-disc list-inside text-sm text-slate-500 space-y-1 pl-1">
                            <li>Vui lòng đưa mã này cho nhân viên thu ngân để sử dụng.</li>
                            <li>Vé chỉ có giá trị sử dụng 01 lần.</li>
                            <li>Không quy đổi thành tiền mặt.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherDetailPage;