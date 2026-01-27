// src/pages/voucher/VoucherDetailPage.tsx

import React, { useState } from 'react';
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
    AlertCircle,
    QrCode,
    Layers,
    Utensils,
    Package
} from 'lucide-react';
import { useVoucherDetail } from '@/hooks/useVoucherDetails';
import { formatCurrency } from '@/utils/format';
import { VoucherQrModal } from '@/components/ui/VoucherQrModal';

const VoucherDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Hook lấy dữ liệu
    const { voucher, isLoading, error } = useVoucherDetail(id);
    const [showQrModal, setShowQrModal] = useState(false);

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
                    onClick={() => navigate('/vouchers')}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                >
                    Quay lại kho vé
                </button>
            </div>
        );
    }

    // --- Logic hiển thị trạng thái ---
    const getStatusConfig = () => {
        if (voucher.isExpired) return {
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
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 pb-20">
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

                {/* IMAGE BANNER */}
                {voucher.imageUrl && (
                    <div className="relative h-48 sm:h-64 w-full bg-slate-100 dark:bg-slate-900">
                        <img
                            src={voucher.imageUrl}
                            alt={voucher.serviceName}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target as HTMLImageElement).src = '/images/placeholder.png'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                )}

                {!voucher.imageUrl && (
                    <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    </div>
                )}

                {/* Ticket Header */}
                <div className="p-8 pb-8 bg-slate-50/50 dark:bg-slate-900/50 border-b border-dashed border-slate-200 dark:border-slate-700 relative">
                    {/* Cutout Circles */}
                    <div className="absolute -left-4 bottom-[-16px] w-8 h-8 bg-[#F3F4F6] dark:bg-[#0f172a] rounded-full border border-slate-200 dark:border-slate-700 z-10"></div>
                    <div className="absolute -right-4 bottom-[-16px] w-8 h-8 bg-[#F3F4F6] dark:bg-[#0f172a] rounded-full border border-slate-200 dark:border-slate-700 z-10"></div>

                    <div className="flex justify-between items-start mb-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.color} ${statusConfig.text}`}>
                            {statusConfig.icon}
                            <span>{statusConfig.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-mono">
                            <span>#{voucher.voucherCode.split('-')[1] || voucher.voucherCode.substring(0, 8)}</span>
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight mb-3">
                        {voucher.serviceName}
                    </h1>

                    <div className="flex items-center gap-3 flex-wrap">
                        {voucher.categoryName && (
                            <span className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Tag size={12} /> {voucher.categoryName}
                            </span>
                        )}

                        <span className="text-slate-300">•</span>

                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                            {formatCurrency(voucher.priceAtPurchase)}
                        </span>

                        {voucher.quantity > 1 && (
                            <div className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none">
                                <Layers size={12} />
                                <span>x{voucher.quantity}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticket Body */}
                <div className="p-8 pt-10 space-y-6">

                    {/* [UPDATED SECTION] Hiển thị danh sách items từ JSON mới */}
                    {voucher.items && voucher.items.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                    <Utensils size={16} className="text-indigo-500" />
                                    Người dùng có thể chọn mua 1 trong các dịch vụ sau:
                                </h4>
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {voucher.items.length} món
                                </span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                                {voucher.items.map((item) => {
                                    // Kiểm tra xem món này đã dùng hết chưa
                                    const isFinished = item.remainingQuantity === 0;

                                    return (
                                        <div
                                            key={item.detailId}
                                            className={`p-3 flex items-center gap-3 transition-colors ${
                                                isFinished ? 'opacity-60 bg-slate-100/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            {/* Ảnh món ăn */}
                                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0 relative">
                                                {item.imageUrl ? (
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.serviceName}
                                                        className={`w-full h-full object-cover ${isFinished ? 'grayscale' : ''}`}
                                                        onError={(e) => (e.target as HTMLImageElement).src = '/images/placeholder.png'}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Utensils size={16} />
                                                    </div>
                                                )}
                                                {isFinished && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                        <CheckCircle2 size={16} className="text-slate-600" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Thông tin món */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${isFinished ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {item.serviceName}
                                                </p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                            <Package size={10} />
                                                            Tiêu chuẩn: {item.initialQuantity}
                                                        </span>
                                                    </div>

                                                    {/* Hiển thị số lượng còn lại */}
                                                    {isFinished ? (
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                                                            Đã dùng
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                            Còn lại: {item.remainingQuantity}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* NÚT SỬ DỤNG VÉ (Giữ nguyên logic mở Modal) */}
                    {!voucher.isExpired && voucher.status === 'ACTIVE' && (
                        <button
                            onClick={() => setShowQrModal(true)}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <QrCode size={24} />
                            Sử dụng ngay
                        </button>
                    )}

                    {/* Voucher Code */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2 group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mã định danh</span>
                        <div
                            className="flex items-center gap-3 text-xl md:text-2xl font-mono font-bold text-slate-800 dark:text-white"
                            onClick={() => navigator.clipboard.writeText(voucher.voucherCode)}
                        >
                            {voucher.voucherCode}
                            <Copy size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-700 pt-6">
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
                            <p className={`font-semibold ${voucher.isExpired ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                {new Date(voucher.expiresAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2 text-xs uppercase flex items-center gap-1">
                            <AlertCircle size={14} /> Lưu ý sử dụng
                        </h4>
                        <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-300 space-y-1 pl-1">
                            <li>Vui lòng đưa mã QR cho nhân viên thu ngân để quét.</li>
                            <li>Vé có giá trị sử dụng theo số lượng còn lại của từng món.</li>
                            {voucher.items && voucher.items.length > 0 && (
                                <li>Với gói combo, bạn có thể sử dụng từng món lẻ vào các thời điểm khác nhau.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal QR Code */}
            {voucher && (
                <VoucherQrModal
                    isOpen={showQrModal}
                    onClose={() => setShowQrModal(false)}
                    voucherId={voucher.voucherId}
                    voucherName={voucher.serviceName}
                    unitPrice={voucher.priceAtPurchase}
                    maxQuantity={voucher.quantity}
                />
            )}
        </div>
    );
};

export default VoucherDetailPage;