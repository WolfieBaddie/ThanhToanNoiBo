import type { FC } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import {
    Search, Filter, ChevronDown, Calendar, X, Check, Loader2, User,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAdminTransactions } from '@/hooks/admin/useAdminTransaction';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
// [MỚI] Import Component Date Modal
import {AdminDateRangeModal} from "@/admin/page/dashboard/components/AdminDateRangeModal";

interface OrdersTableProps {
    limit?: number;
}

const OrdersTable: FC<OrdersTableProps> = ({ limit }) => {
    // --- 1. DỮ LIỆU GIAO DỊCH (MAIN TABLE) ---
    const {
        data: transactions,
        loading,
        filters,
        totalItems,
        totalPages,
        setPage,
        setDateFilter,
        setUserFilter,
        refresh
    } = useAdminTransactions({
        page: 0,
        size: limit || 10
    });

    // --- 2. DỮ LIỆU USER (CHO DROPDOWN FILTER) ---
    const {
        data: userList,
        setSearch: setUserSearch,
        loading: loadingUsers
    } = useAdminUsers(20);

    // --- STATE UI LOCAL ---
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // [CẬP NHẬT] Thay state manual dropdown bằng state cho Modal
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);

    const [tempSelectedUserIds, setTempSelectedUserIds] = useState<string[]>(filters.userIds || []);
    const userDropdownRef = useRef<HTMLDivElement>(null);

    // Sync state khi filters thay đổi
    useEffect(() => {
        setTempSelectedUserIds(filters.userIds || []);
    }, [filters.userIds]);

    // Click outside handler (Chỉ còn dùng cho User Dropdown)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
            // Date Modal đã tự xử lý click outside bên trong component của nó
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- HANDLERS: USER FILTER ---
    const toggleUserSelection = (userId: string) => {
        setTempSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const applyUserFilter = () => {
        setUserFilter(tempSelectedUserIds);
        setIsUserDropdownOpen(false);
    };

    const clearUserFilterLocal = () => {
        setTempSelectedUserIds([]);
        setUserFilter([]);
    };

    // --- HANDLERS: DATE FILTER [CẬP NHẬT] ---
    const handleDateApply = (from: Date, to: Date) => {
        setDateFilter(from, to);
        setIsDateModalOpen(false);
    };

    const clearDateFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDateFilter(null, null);
    };

    // --- HELPERS ---
    const getPaymentIcon = (type: string) => {
        switch (type) {
            case 'PAYMENT': return '💸';
            case 'DEPOSIT': return '🏦';
            case 'REFUND': return '↩️';
            case 'BUY_VOUCHER': return '🎟️';
            case 'REDEMPTION': return '🎁';
            default: return '📜';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'PENDING': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'FAILED':
            case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-fadeIn relative z-10 flex flex-col h-full">

            {/* HEADER & FILTERS */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">
                        {limit ? 'Giao dịch gần đây' : 'Quản lý Giao dịch'}
                    </h3>
                    <p className="text-white/50 text-xs mt-1">
                        Tổng cộng: {totalItems} giao dịch
                    </p>
                </div>

                {!limit && (
                    <div className="flex flex-wrap items-center gap-3">

                        {/* 1. USER FILTER */}
                        <div className="relative" ref={userDropdownRef}>
                            <button
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium
                                ${filters.userIds && filters.userIds.length > 0
                                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                            >
                                <User size={16} />
                                <span>
                                    {filters.userIds && filters.userIds.length > 0
                                        ? `Đã chọn (${filters.userIds.length})`
                                        : 'Lọc Người dùng'}
                                </span>
                                <ChevronDown size={14} className={`transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isUserDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                                    <div className="mb-2 px-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Tìm tên hoặc email..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10 pr-1">
                                        {loadingUsers ? (
                                            <div className="py-4 text-center text-white/30 text-xs"><Loader2 className="w-4 h-4 animate-spin mx-auto"/></div>
                                        ) : userList.length === 0 ? (
                                            <div className="py-4 text-center text-white/30 text-xs">Không tìm thấy user nào</div>
                                        ) : (
                                            userList.map(user => {
                                                const isSelected = tempSelectedUserIds.includes(user.userId);
                                                return (
                                                    <div key={user.userId} onClick={() => toggleUserSelection(user.userId)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-sm ${isSelected ? 'bg-purple-500/20 text-purple-200' : 'hover:bg-white/5 text-white/70'}`}>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/30'}`}>
                                                            {isSelected && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <div className="truncate font-medium">{user.fullName}</div>
                                                            <div className="truncate text-xs text-white/40">{user.email}</div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                                        <button onClick={clearUserFilterLocal} className="flex-1 py-1.5 text-xs text-white/60 hover:bg-white/5 rounded transition-colors">Xóa</button>
                                        <button onClick={applyUserFilter} className="flex-1 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors">Áp dụng</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. DATE FILTER [CẬP NHẬT] */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDateModalOpen(!isDateModalOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium 
                                ${filters.fromDate && filters.toDate
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                            >
                                <Calendar size={16} />
                                <span>{filters.fromDate && filters.toDate ? `${filters.fromDate} - ${filters.toDate}` : 'Chọn ngày'}</span>
                                {(filters.fromDate || filters.toDate) && (
                                    <div onClick={clearDateFilter} className="ml-1 p-0.5 rounded-full hover:bg-white/20 cursor-pointer"><X size={12} /></div>
                                )}
                            </button>

                            {/* Tích hợp component AdminDateRangeModal */}
                            <AdminDateRangeModal
                                isOpen={isDateModalOpen}
                                onClose={() => setIsDateModalOpen(false)}
                                onApply={handleDateApply}
                                initialFrom={filters.fromDate}
                                initialTo={filters.toDate}
                            />
                        </div>

                        {/* REFRESH BUTTON */}
                        <button
                            onClick={refresh}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                            title="Làm mới"
                        >
                            <Loader2 size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                )}
            </div>

            {/* TABLE LIST (MAIN DATA) */}
            <div className="space-y-3 flex-grow">
                {loading && transactions.length === 0 ? (
                    <div className="py-12 text-center text-white/50 flex flex-col items-center">
                        <Loader2 className="animate-spin mb-2" />
                        Đang tải dữ liệu...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-12 text-center text-white/50 border border-white/5 rounded-xl border-dashed">
                        Không có giao dịch nào phù hợp.
                    </div>
                ) : (
                    transactions.map((order: any, index) => (
                        <div
                            key={order.transactionId || index}
                            className="group flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-purple-500/30 bg-gradient-to-r from-white/5 to-transparent hover:from-purple-500/10 transition-all duration-300"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
                                    <span className="text-xl">{getPaymentIcon(order.transactionType)}</span>
                                </div>

                                <div>
                                    <div className="flex items-center space-x-3">
                                        <h4 className="font-bold text-white text-sm">
                                            {order.title || order.transactionType}
                                        </h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <p className="text-white/80 text-sm mt-0.5">
                                        {order.description}
                                    </p>

                                    <div className="flex items-center gap-1 mt-1 text-white/40 text-xs font-mono">
                                        <User size={10} />
                                        <span>
                                            {order.partnerInfo?.partnerName || "Khách vãng lai"}
                                            {order.partnerInfo?.subTitle ? ` - ${order.partnerInfo.subTitle}` : ''}
                                        </span>
                                        <span className="mx-1">•</span>
                                        <span>Ref: {order.transactionRef}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right min-w-[120px]">
                                <p className={`font-bold text-lg ${order.direction === 'IN' ? 'text-emerald-400' : 'text-white'}`}>
                                    {order.direction === 'IN' ? '+' : ''}
                                    {order.amount < 0 ? formatCurrency(order.amount) : formatCurrency(order.amount)}
                                </p>
                                <p className="text-white/40 text-xs mt-1">
                                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* PAGINATION */}
            {!limit && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50">
                        Trang <span className="font-bold text-white">{filters.page! + 1}</span> / <span className="font-bold text-white">{totalPages}</span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(0, filters.page! - 1))}
                            disabled={filters.page === 0 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i;
                                if (totalPages > 5 && filters.page! > 2) {
                                    pageNum = filters.page! - 2 + i;
                                }
                                if (pageNum >= totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all
                                            ${filters.page === pageNum
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, filters.page! + 1))}
                            disabled={filters.page! >= totalPages - 1 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersTable;