import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, Copy, ArrowRight, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { useMyVouchers } from '@/hooks/useMyVoucher';
import { UserVoucherStatusEnum } from '@/types/voucher.type';
import { formatCurrency } from '../utils/format';

const VoucherPage: React.FC = () => {
    const navigate = useNavigate();

    // Sử dụng Hook
    const {
        vouchers,
        pagination,
        isLoading,
        filters,
        changePage,
        filterByStatus
    } = useMyVouchers();

    // Helper: Chọn màu sắc dựa trên trạng thái vé
    const getCardStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 hover:border-indigo-300';
            case 'USED':
                return 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75 grayscale';
            case 'EXPIRED':
                return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 opacity-75';
            default:
                return 'bg-white';
        }
    };

    // Helper: Label trạng thái
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { text: 'Có hiệu lực', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' };
            case 'USED': return { text: 'Đã sử dụng', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
            case 'EXPIRED': return { text: 'Hết hạn', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
            default: return { text: status, color: 'text-slate-500' };
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Kho Voucher</h1>
                    <p className="text-slate-500 font-medium">Quản lý vé ăn và dịch vụ của bạn</p>
                </div>

                {/* Filter Buttons */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => filterByStatus(UserVoucherStatusEnum.ACTIVE)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            filters.status === UserVoucherStatusEnum.ACTIVE
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        Khả dụng
                    </button>
                    <button
                        onClick={() => filterByStatus('')} // Truyền rỗng để lấy tất cả (Lịch sử)
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            filters.status === ''
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        Lịch sử
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-56 bg-slate-100 dark:bg-slate-800 rounded-[32px] animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Empty State */}
                    {vouchers.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Ticket size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Chưa có voucher nào</h3>
                            <p className="text-slate-500">Bạn chưa mua voucher nào hoặc chưa có giao dịch phù hợp.</p>
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
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                            <Ticket size={24} />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${statusInfo.color}`}>
                                            {statusInfo.text}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10 mt-4">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight mb-1 line-clamp-2">
                                            {v.serviceName}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Giá trị: {formatCurrency(v.priceAtPurchase)}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                            {v.voucherCode}
                                        </div>
                                        {v.expiresAt && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock size={12} />
                                                <span>{new Date(v.expiresAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-6">
                            <button
                                onClick={() => changePage(pagination.pageNumber - 1)}
                                disabled={pagination.pageNumber === 0}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Trang {pagination.pageNumber + 1} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => changePage(pagination.pageNumber + 1)}
                                disabled={pagination.pageNumber >= pagination.totalPages - 1}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
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