import React, { useState } from 'react';
import {
    RefreshCw, Search, Calendar, QrCode, Filter,
    ChevronRight, X, LayoutGrid, List, ChevronLeft, User as UserIcon,
    ArrowDownUp
} from 'lucide-react';

// COMPONENTS
import { MerchantRevenueChart } from "@/components/merchant/MerchantRevenueChart.tsx";
import { MerchantStats } from "@/components/merchant/MerchantStats.tsx";
import { TransactionDetailModal } from "@/components/merchant/TransactionDetailModal.tsx";
import { ScanQrModal } from "@/components/merchant/ScanQrModal.tsx";
import { DateRangeModal } from "@/components/ui/DateRangeModal.tsx"; // Đảm bảo import đúng

// HOOKS
import { useTransactions } from '@/hooks/useTransaction';

const MerchantDashboard: React.FC = () => {
    // --- STATE UI ---
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
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
    } = useTransactions({ page: 0, size: 6 });

    // Mock Stats
    const statsData = {
        todayRevenue: transactions.reduce((acc, curr) => acc + (curr.direction === 'IN' ? curr.amount : 0), 0),
        orderCount: transactions.length,
        avgOrderValue: 0
    };

    // --- HANDLERS ---
    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setSearchRef(searchTerm);
        }
    };

    const handleDateApply = (from: Date, to: Date) => {
        setDateFilter(from, to);
        // Modal sẽ tự đóng trong component DateRangeModal khi gọi onClose
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setTypeFilter(val === 'ALL' ? undefined : val);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        hookClearFilters();
    };

    // Helper display
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };

    const hasFilter = !!(filters.fromDate || filters.transactionRef || filters.type);

    return (
        <div className="p-4 bg-slate-50 min-h-screen font-sans text-slate-900 pb-20 space-y-8">

            {/* MODALS GLOBAL (Những modal phủ toàn màn hình thì để ở ngoài) */}
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

            <MerchantStats data={statsData} />
            <MerchantRevenueChart />

            {/* --- FILTER BAR --- */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 z-20">
                    {/* z-20 để đảm bảo dropdown đè lên các content bên dưới */}

                    {/* 1. Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Mã giao dịch..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    {/* 2. Type Filter */}
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

                    {/* 3. Date Filter - [FIX QUAN TRỌNG: GỘP MODAL VÀO ĐÂY] */}
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
                            <span className="hidden sm:inline">{filters.fromDate ? `${filters.fromDate}` : 'Ngày'}</span>
                        </button>

                        {/* Modal nằm ngay trong thẻ cha Relative để định vị Absolute chính xác */}
                        <DateRangeModal
                            isOpen={isDateModalOpen}
                            onClose={() => setIsDateModalOpen(false)}
                            onApply={handleDateApply}
                            initialFrom={filters.fromDate}
                            initialTo={filters.toDate}
                        />
                    </div>

                    {/* 4. Clear Button */}
                    {hasFilter && (
                        <button
                            onClick={handleClearFilters}
                            className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100 flex-shrink-0"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button onClick={() => refetch()} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="Làm mới">
                        <RefreshCw size={18} />
                    </button>
                    <div className="bg-slate-100 p-1 rounded-xl flex flex-shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
                    </div>
                </div>
            </div>

            {/* --- LIST CONTENT (Giữ nguyên) --- */}
            {loading ? (
                <div className="py-20 flex justify-center">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : transactions.length > 0 ? (
                // ... (Phần hiển thị list giữ nguyên như cũ)
                <>
                    {/* Code hiển thị Grid/List giữ nguyên */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {transactions.map(tx => (
                                <div key={tx.transactionId} onClick={() => setSelectedTxId(tx.transactionId)} className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-800">{tx.title}</div>
                                        <div className={`font-extrabold ${tx.direction === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-500">{formatDateTime(tx.createdAt)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* ... Pagination giữ nguyên ... */}
                </>
            ) : (
                <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Filter size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Không tìm thấy giao dịch</h3>
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