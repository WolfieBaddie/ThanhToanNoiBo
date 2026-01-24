// src/pages/merchant/MerchantDashboard.tsx

import React, { useState } from 'react';
import {
    RefreshCw, Search, Calendar, QrCode, Filter,
    ChevronRight, X, LayoutGrid, List, ChevronLeft, User as UserIcon,
    ArrowDownUp, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

// COMPONENTS
import { MerchantRevenueChart } from "@/components/merchant/MerchantRevenueChart.tsx";
import { MerchantStats } from "@/components/merchant/MerchantStats.tsx";
import { TransactionDetailModal } from "@/components/merchant/TransactionDetailModal.tsx";
import { ScanQrModal } from "@/components/merchant/ScanQrModal.tsx";
import { DateRangeModal } from "@/components/ui/DateRangeModal.tsx";

// HOOKS
import { useTransactions } from '@/hooks/useTransaction';
import { useMerchantStats } from '@/hooks/useMerchantStats'; // [MỚI] Import Hook Stats

const MerchantDashboard: React.FC = () => {
    // --- STATE UI ---
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- DATA FETCHING (LIST GIAO DỊCH) ---
    const {
        data: transactions,
        loading: txLoading, // Đổi tên biến loading để tránh trùng
        totalPages,
        filters,
        setPage,
        setDateFilter,
        setTypeFilter,
        setSearchRef,
        clearFilters: hookClearFilters,
        refetch: refetchTx
    } = useTransactions({ page: 0, size: 10 });

    // --- DATA FETCHING (STATS) [MỚI] ---
    const { stats, loading: statsLoading, refetch: refetchStats } = useMerchantStats();

    // --- HANDLERS ---
    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setSearchRef(searchTerm);
        }
    };

    const handleDateApply = (from: Date, to: Date) => {
        setDateFilter(from, to);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setTypeFilter(val === 'ALL' ? undefined : val);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        hookClearFilters();
    };

    // Hàm refresh tổng hợp
    const handleRefreshAll = () => {
        refetchTx();
        refetchStats();
    };

    // --- HELPERS (Giữ nguyên) ---
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
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

    return (
        <div className="p-4 bg-slate-50 min-h-screen font-sans text-slate-900 pb-20 space-y-8">

            {/* MODALS */}
            <TransactionDetailModal
                isOpen={!!selectedTxId}
                onClose={() => setSelectedTxId(null)}
                transactionId={selectedTxId}
            />

            <ScanQrModal
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
            />

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-extrabold text-slate-800">Bán hàng (POS)</h1>
                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium">Quản lý giao dịch và doanh thu theo thời gian thực.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsScanModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95"
                    >
                        <QrCode size={20} /> Quét mã QR
                    </button>
                </div>
            </div>

            {/* --- [CẬP NHẬT] STATS & CHART --- */}
            <MerchantStats data={stats} loading={statsLoading} />
            <MerchantRevenueChart />

            {/* --- FILTER BAR (Giữ nguyên) --- */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-30">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm mã giao dịch..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <select
                            value={filters.type || 'ALL'}
                            onChange={handleTypeChange}
                            className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:border-indigo-500 transition-all w-full sm:w-auto cursor-pointer"
                        >
                            <option value="ALL">Tất cả loại</option>
                            <option value="PAYMENT">Thanh toán</option>
                            <option value="REDEMPTION">Đổi Voucher</option>
                            <option value="DEPOSIT">Nạp tiền</option>
                        </select>
                        <ArrowDownUp size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDateModalOpen(!isDateModalOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-bold text-sm whitespace-nowrap
                            ${filters.fromDate
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            <Calendar size={18} />
                            <span className="hidden sm:inline">{filters.fromDate ? `${filters.fromDate}` : 'Thời gian'}</span>
                        </button>

                        <DateRangeModal
                            isOpen={isDateModalOpen}
                            onClose={() => setIsDateModalOpen(false)}
                            onApply={handleDateApply}
                            initialFrom={filters.fromDate}
                            initialTo={filters.toDate}
                        />
                    </div>

                    {hasFilter && (
                        <button onClick={handleClearFilters} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100 flex-shrink-0">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button onClick={handleRefreshAll} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="Làm mới">
                        <RefreshCw size={18} />
                    </button>
                    <div className="bg-slate-100 p-1 rounded-xl flex flex-shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- LIST CONTENT (Giữ nguyên code bảng) --- */}
            {txLoading ? (
                <div className="py-20 flex justify-center">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : transactions.length > 0 ? (
                <>
                    {/* --- VIEW MODE: LIST (BẢNG) --- */}
                    {viewMode === 'list' && (
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Giao dịch</th>
                                        <th className="px-6 py-4">Khách hàng</th>
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
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                            {tx.direction === 'IN' ? <ArrowDownUp size={18} /> : <RefreshCw size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{tx.title}</p>
                                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{tx.transactionRef}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {tx.partnerInfo ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                                {tx.partnerInfo.partnerImage ? (
                                                                    <img src={tx.partnerInfo.partnerImage} className="w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    <UserIcon size={12} className="text-slate-400" />
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700">{tx.partnerInfo.partnerName}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic">Khách vãng lai</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                        <span className={`text-sm font-bold ${tx.direction === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                            {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                        </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                                            <StatusIcon size={12} />
                                                            {status.text}
                                                        </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-slate-500 font-medium">
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
                        </div>
                    )}

                    {/* --- VIEW MODE: GRID (THẺ) --- */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {transactions.map(tx => {
                                const status = getStatusConfig(tx.status);
                                return (
                                    <div
                                        key={tx.transactionId}
                                        onClick={() => setSelectedTxId(tx.transactionId)}
                                        className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-lg transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                {tx.direction === 'IN' ? <ArrowDownUp size={20} /> : <RefreshCw size={20} />}
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{tx.title}</h4>
                                            <p className="text-slate-400 text-xs font-mono">{tx.transactionRef}</p>
                                        </div>

                                        <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                                            <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDateTime(tx.createdAt)}
                                            </div>
                                            <div className={`font-extrabold text-lg ${tx.direction === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* --- PAGINATION --- */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1">
                                <button
                                    onClick={() => setPage(Math.max(0, filters.page! - 1))}
                                    disabled={filters.page === 0}
                                    className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} className="text-slate-600" />
                                </button>

                                <span className="px-4 text-sm font-bold text-slate-600">
                                    Trang {filters.page! + 1} / {totalPages}
                                </span>

                                <button
                                    onClick={() => setPage(Math.min(totalPages - 1, filters.page! + 1))}
                                    disabled={filters.page! >= totalPages - 1}
                                    className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} className="text-slate-600" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Filter size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Không tìm thấy giao dịch</h3>
                    <p className="text-slate-500 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    {hasFilter && (
                        <button onClick={handleClearFilters} className="mt-4 text-indigo-600 font-bold hover:underline">
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MerchantDashboard;