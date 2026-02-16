import React, { useState } from 'react';
import {
    Search, Calendar, Filter, RefreshCw,
    ChevronRight, ArrowDownUp, Clock, CheckCircle2, XCircle, AlertCircle,
    User as UserIcon, ArrowLeft, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// COMPONENTS
import { TransactionDetailModal } from "@/components/merchant/TransactionDetailModal";
import { DateRangeModal } from "@/components/ui/DateRangeModal";

// HOOKS & UTILS
import { useTransactions } from '@/hooks/useTransaction';

const MerchantHistoryPage: React.FC = () => {
    const navigate = useNavigate();

    // --- STATE UI ---
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- DATA FETCHING ---
    const {
        data: transactions,
        loading,
        totalPages,
        filters,
        setPage,
        setDateFilter,
        setTypeFilter,
        setSearchRef,
        clearFilters: hookClearFilters,
        refetch
    } = useTransactions({ page: 0, size: 20 });

    // --- HANDLERS ---
    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setSearchRef(searchTerm);
        }
    };

    const handleDateApply = (from: Date, to: Date) => {
        setDateFilter(from, to);
        setIsDateModalOpen(false);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setTypeFilter(val === 'ALL' ? undefined : val);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        hookClearFilters();
    };

    // --- HELPERS FORMAT ---
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2, text: 'Thành công' };
            case 'PENDING': return { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock, text: 'Đang xử lý' };
            case 'FAILED': return { color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle, text: 'Thất bại' };
            default: return { color: 'text-slate-600 bg-slate-50 border-slate-100', icon: AlertCircle, text: status };
        }
    };

    const hasFilter = !!(filters.fromDate || filters.transactionRef || filters.type);

    // --- PAGINATION HELPER ---
    const renderPagination = () => {
        const { page: currentPage = 0 } = filters;
        const current = currentPage + 1;
        const delta = 1;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots.map((page, index) => {
            if (page === '...') {
                return <span key={`dots-${index}`} className="w-10 h-10 flex items-center justify-center text-slate-400 font-medium">...</span>;
            }
            const pNum = page as number;
            const isActive = pNum === current;
            return (
                <button
                    key={pNum}
                    onClick={() => setPage(pNum - 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${isActive
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-110'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                    {pNum}
                </button>
            );
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Modal Chi tiết */}
            <TransactionDetailModal
                isOpen={!!selectedTxId}
                onClose={() => setSelectedTxId(null)}
                transactionId={selectedTxId}
                isUserView={true}
            />

            {/* --- MAIN CONTENT --- */}
            <div className="p-4 md:p-8 space-y-6">

                {/* --- HEADER + FILTER BAR (Đã bỏ sticky/float) --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">

                    {/* Left: Title & Back Button */}
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors border border-transparent hover:border-slate-200"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900">Lịch sử giao dịch</h1>
                            <p className="text-slate-500 font-medium text-xs hidden sm:block">Biến động số dư & đơn hàng</p>
                        </div>
                    </div>

                    {/* Right: Filters & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">

                        {/* Search Input */}
                        <div className="relative min-w-[200px] flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã GD..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="relative min-w-[140px]">
                            <select
                                value={filters.type || 'ALL'}
                                onChange={handleTypeChange}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-sm font-bold text-slate-600 hover:bg-slate-50 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer h-full"
                            >
                                <option value="ALL">Tất cả loại</option>
                                <option value="PAYMENT">Thanh toán</option>
                                <option value="REDEMPTION">Đổi Voucher</option>
                                <option value="DEPOSIT">Nạp tiền</option>
                                <option value="WITHDRAW">Rút tiền</option>
                            </select>
                            <ArrowDownUp size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Date Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDateModalOpen(!isDateModalOpen)}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all font-bold text-sm whitespace-nowrap h-full min-w-[130px]
                                ${filters.fromDate
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Calendar size={16} />
                                <span>{filters.fromDate ? `${filters.fromDate} - ...` : 'Thời gian'}</span>
                            </button>

                            <DateRangeModal
                                isOpen={isDateModalOpen}
                                onClose={() => setIsDateModalOpen(false)}
                                onApply={handleDateApply}
                                initialFrom={filters.fromDate}
                                initialTo={filters.toDate}
                            />
                        </div>

                        {/* Actions: Clear & Refresh */}
                        <div className="flex items-center gap-2">
                            {hasFilter && (
                                <button onClick={handleClearFilters} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100" title="Xóa bộ lọc">
                                    <Filter size={18} />
                                </button>
                            )}
                            <button onClick={() => refetch()} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white" title="Làm mới">
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- TABLE CONTENT --- */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <span className="text-sm font-bold text-slate-500">Đang tải dữ liệu...</span>
                            </div>
                        </div>
                    )}

                    {transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Giao dịch</th>
                                    <th className="px-6 py-4">Đối tác</th>
                                    <th className="px-6 py-4 text-right">Số tiền</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thời gian</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {transactions.map((tx) => {
                                    const status = getStatusConfig(tx.status);
                                    const StatusIcon = status.icon;
                                    return (
                                        <tr
                                            key={tx.transactionId}
                                            onClick={() => setSelectedTxId(tx.transactionId)}
                                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0
                                                            ${tx.direction === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        {tx.direction === 'IN' ? <ArrowDownUp size={18} /> : <RefreshCw size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm line-clamp-1 max-w-[200px]">{tx.title}</p>
                                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{tx.transactionRef}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.partnerInfo ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                                                            {tx.partnerInfo.partnerImage ? (
                                                                <img src={tx.partnerInfo.partnerImage} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <UserIcon size={12} className="text-slate-400" />
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{tx.partnerInfo.partnerName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400 italic">Khách vãng lai</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {tx.isRedemption ? (
                                                    <span className="text-sm font-bold text-slate-700 block max-w-[150px] truncate ml-auto" title={tx.subTitle}>
                                                            {tx.displayAmount}
                                                        </span>
                                                ) : (
                                                    <span className={`text-sm font-bold ${tx.direction === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                            {tx.displayAmount}
                                                        </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.color}`}>
                                                        <StatusIcon size={12} />
                                                        {status.text}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-slate-500 font-medium whitespace-nowrap">
                                                {formatDateTime(tx.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        !loading && (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 border border-slate-100">
                                    <Filter size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Không tìm thấy dữ liệu</h3>
                                <p className="text-slate-500 text-sm mt-1">Thử thay đổi bộ lọc hoặc thời gian tìm kiếm</p>
                                {hasFilter && (
                                    <button onClick={handleClearFilters} className="mt-4 text-indigo-600 font-bold hover:underline text-sm">
                                        Xóa toàn bộ lọc
                                    </button>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* --- PAGINATION (STYLE ĐÃ SỬA GIỐNG MENU PAGE) --- */}
                {totalPages > 1 && (
                    <div className="flex justify-center pb-8">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(0, (filters.page || 0) - 1))}
                                disabled={filters.page === 0}
                                className="p-3 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors text-slate-600"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {renderPagination()}

                            <button
                                onClick={() => setPage(Math.min(totalPages - 1, (filters.page || 0) + 1))}
                                disabled={(filters.page || 0) >= totalPages - 1}
                                className="p-3 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors text-slate-600"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MerchantHistoryPage;