import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, ChevronLeft, ChevronRight, ListFilter, ChevronDown, Check } from 'lucide-react';
import { useMyVouchers } from '@/hooks/useMyVoucher';
import { UserVoucherStatusEnum } from '@/types/voucher.type';
import { formatCurrency } from '@/utils/format';
import {ExchangeVoucherButton} from "@/components/voucher/ExchangeVoucherButton.tsx";

// --- [MỚI] Component con để xử lý ảnh/icon ---
const VoucherIcon = ({ src, alt }: { src: string | null | undefined, alt: string }) => {
    const [imageError, setImageError] = useState(false);

    // Nếu không có src hoặc ảnh bị lỗi -> Hiển thị Icon Ticket
    if (!src || imageError) {
        return (
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-600">
                <Ticket size={24} />
            </div>
        );
    }

    // Nếu có ảnh -> Hiển thị ảnh
    return (
        <img
            src={src}
            alt={alt} // Để alt rỗng hoặc mô tả ngắn để tránh hiện text dài khi đang load
            onError={() => setImageError(true)} // Bắt lỗi 404 để chuyển về icon
            className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-700 shadow-sm bg-white"
        />
    );
};

const VoucherPage: React.FC = () => {
    const navigate = useNavigate();

    const {
        vouchers,
        pagination,
        isLoading,
        filters,
        changePage,
        filterByStatus,
        changePageSize
    } = useMyVouchers();

    // --- STATE CHO CUSTOM DROPDOWN ---
    const [isSizeOpen, setIsSizeOpen] = useState(false);
    const sizeRef = useRef<HTMLDivElement>(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) {
                setIsSizeOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectSize = (size: number) => {
        changePageSize(size);
        setIsSizeOpen(false);
    };

    const pageSizeOptions = [5, 10, 20, 50];

    // Helper: Style Card
    const getCardStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10';
            case 'USED': return 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75 grayscale';
            case 'EXPIRED': return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 opacity-75';
            default: return 'bg-white';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { text: 'Có hiệu lực', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' };
            case 'USED': return { text: 'Đã sử dụng', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
            case 'EXPIRED': return { text: 'Hết hạn', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
            default: return { text: status, color: 'text-slate-500' };
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20">
            {/* --- HEADER & FILTERS --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

                {/* Title */}
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Kho Voucher</h1>
                    <p className="text-slate-500 font-medium">Quản lý vé ăn và dịch vụ của bạn</p>
                </div>

                {/* Controls Area */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-2">

                    <ExchangeVoucherButton className="w-full sm:w-auto justify-center" />

                    {/* [CUSTOM DROPDOWN] Chọn Page Size */}
                    <div className="relative w-full sm:w-48" ref={sizeRef}>
                        <button
                            onClick={() => setIsSizeOpen(!isSizeOpen)}
                            className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-all ${isSizeOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                        >
                            <span className="absolute left-3 text-slate-400">
                                <ListFilter size={18} />
                            </span>
                            <span>{pagination.size} vé / trang</span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isSizeOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isSizeOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                                <div className="py-1">
                                    {pageSizeOptions.map((size) => (
                                        <div
                                            key={size}
                                            onClick={() => handleSelectSize(size)}
                                            className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                                pagination.size === size
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold'
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <span>{size} vé / trang</span>
                                            {pagination.size === size && <Check size={16} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Filter Buttons */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                        <button
                            onClick={() => filterByStatus(UserVoucherStatusEnum.ACTIVE)}
                            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                                filters.status === UserVoucherStatusEnum.ACTIVE
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            Khả dụng
                        </button>
                        <button
                            onClick={() => filterByStatus('')}
                            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                                filters.status === ''
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            Lịch sử
                        </button>
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-56 bg-slate-100 dark:bg-slate-800 rounded-[32px] animate-pulse"></div>)}
                </div>
            ) : (
                <>
                    {/* Empty State */}
                    {vouchers.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                                <Ticket size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Chưa có voucher nào</h3>
                            <p className="text-slate-500 mt-1">Bạn chưa mua voucher nào hoặc chưa có giao dịch phù hợp.</p>
                        </div>
                    )}

                    {/* Voucher Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {vouchers.map((v) => {
                            const statusInfo = getStatusLabel(v.status);
                            return (
                                <div
                                    key={v.voucherId}
                                    onClick={() => navigate(`/vouchers/${v.voucherId}`)}
                                    className={`relative p-6 rounded-[32px] border shadow-sm flex flex-col min-h-[220px] justify-between group overflow-hidden transition-all cursor-pointer ${getCardStyle(v.status)}`}
                                >
                                    {/* Top Section */}
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {/* [SỬA]: Dùng component VoucherIcon thay vì img trần */}
                                            <VoucherIcon src={v.imageUrl} alt={v.serviceName} />

                                            {/* Quantity Badge */}
                                            {v.quantity > 1 && (
                                                <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md shadow-indigo-200">
                                                    x{v.quantity}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${statusInfo.color}`}>
                                            {statusInfo.text}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10 mt-5">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                                            {v.serviceName}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                                            Giá trị: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(v.priceAtPurchase)}</span>
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <span className="opacity-50">#</span>
                                            {v.voucherCode}
                                        </div>
                                        {v.expiresAt && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <Clock size={14} />
                                                <span>{new Date(v.expiresAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-10 pb-10">
                            <button
                                onClick={() => changePage(pagination.pageNumber - 1)}
                                disabled={pagination.pageNumber === 0}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                Trang <span className="font-bold text-indigo-600 dark:text-white mx-1">{pagination.pageNumber + 1}</span>
                                / {pagination.totalPages}
                            </span>

                            <button
                                onClick={() => changePage(pagination.pageNumber + 1)}
                                disabled={pagination.pageNumber >= pagination.totalPages - 1}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VoucherPage;