import type { FC } from 'react';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Search, Filter, ChevronDown, Calendar, X, Check, Loader2, User,
    ChevronLeft, ChevronRight, DollarSign, Wallet
} from 'lucide-react';
import { useAdminTransactions } from '@/hooks/admin/useAdminTransaction';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { AdminDateRangeModal } from "@/admin/page/dashboard/components/AdminDateRangeModal";
import { formatCurrency } from '@/utils/format';
import { TransactionDetailModal } from "@/admin/page/dashboard/components/TransactionDetailModal";

interface OrdersTableProps {
    limit?: number;
}

// [FIXED] Helper: Tính ngày đầu tuần và cuối tuần hiện tại CHUẨN XÁC
const getCurrentWeekRange = () => {
    const now = new Date();

    // 1. Tính ngày Thứ 2 (Start)
    const start = new Date(now);
    const day = now.getDay(); // 0 (CN) -> 6 (T7)
    const diffToMonday = day === 0 ? 6 : day - 1; // Nếu CN(0) lùi 6, T2(1) lùi 0

    start.setDate(now.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);

    // 2. Tính ngày Chủ Nhật (End)
    // [QUAN TRỌNG] Phải clone từ 'start' thay vì 'now' để tránh lỗi nhảy tháng sai
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // Format YYYY-MM-DD
    const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    };

    return {
        from: formatDate(start),
        to: formatDate(end)
    };
};

const OrdersTable: FC<OrdersTableProps> = ({ limit }) => {
    // Gọi hàm tính ngày 1 lần khi component mount
    const defaultDateRange = useMemo(() => getCurrentWeekRange(), []);

    const {
        data: transactions,
        loading,
        filters,
        totalItems,
        totalPages,
        setPage,
        setDateFilter,
        setUserFilter,
        setTypeFilter,
        refresh
    } = useAdminTransactions({
        page: 0,
        size: limit || 10,
        fromDate: defaultDateRange.from,
        toDate: defaultDateRange.to
    });

    const {
        data: userList,
        setSearch: setUserSearch,
        loading: loadingUsers
    } = useAdminUsers(20);

    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [tempSelectedUserIds, setTempSelectedUserIds] = useState<string[]>(filters.userIds || []);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        setTempSelectedUserIds(filters.userIds || []);
    }, [filters.userIds]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
                setIsTypeDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const redemptionRevenue = useMemo(() => {
        if (!transactions || transactions.length === 0) return 0;
        return transactions.reduce((acc, curr: any) => {
            if (curr.transactionType === 'REDEMPTION') {
                return acc + (curr.amount || 0);
            }
            return acc;
        }, 0);
    }, [transactions]);

    const handleRowClick = (transactionId: string) => {
        setSelectedTxId(transactionId);
        setIsDetailModalOpen(true);
    };

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

    const handleDateApply = (from: Date, to: Date) => {
        setDateFilter(from, to);
        setIsDateModalOpen(false);
    };

    const clearDateFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDateFilter(null, null);
    };

    const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(Math.abs(amount));

    const getTransactionTypeLabel = (type: string) => {
        switch (type) {
            case 'PAYMENT': return 'Thanh toán';
            case 'DEPOSIT': return 'Nạp tiền';
            case 'REFUND': return 'Hoàn tiền';
            case 'BUY_VOUCHER': return 'Mua Gói/Vé';
            case 'REDEMPTION': return 'Đổi Vé/Quà';
            default: return type;
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Check size={12} /> Thành công</span>;
            case 'PENDING': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Loader2 size={12} className="animate-spin" /> Đang xử lý</span>;
            case 'FAILED': case 'CANCELLED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20"><X size={12} /> {status === 'FAILED' ? 'Thất bại' : 'Đã hủy'}</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
        }
    };

    // [UPDATED] Hàm render cột giá trị tiền tệ
    const renderAmountColumn = (order: any) => {
        const { amount, transactionType, quantity } = order;

        // 1. Trường hợp ĐỔI QUÀ (REDEMPTION) -> Hiển thị tiền + xanh lá + dấu cộng
        if (transactionType === 'REDEMPTION') {
            const displayQty = quantity && quantity > 0 ? quantity : 1;
            return (
                <div className="flex flex-col items-end">
                    <span className="font-bold text-emerald-400 text-sm">
                        + {formatVND(amount)} VND
                    </span>
                    <span className="text-[10px] text-emerald-400/50">
                        {displayQty} Vé
                    </span>
                </div>
            );
        }

        // 2. Trường hợp NẠP TIỀN (DEPOSIT)
        if (transactionType === 'DEPOSIT') {
            return (
                <div className="flex flex-col items-end">
                    <span className="font-bold text-emerald-400 text-sm">
                        + {formatVND(amount)} VND
                    </span>
                    <span className="text-[10px] text-emerald-400/50">Nạp vào ví</span>
                </div>
            );
        }

        // 3. Trường hợp MUA VÉ/THANH TOÁN (BUY_VOUCHER)
        return (
            <div className="flex flex-col items-end">
                <span className="font-bold text-white text-sm">
                    {formatVND(amount)} VND
                </span>
                <span className="text-[10px] text-white/40">Thanh toán</span>
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-fadeIn relative z-10 flex flex-col h-full">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">{limit ? 'Giao dịch gần đây' : 'Quản lý Giao dịch'}</h3>
                        <p className="text-white/50 text-xs mt-1">Tổng cộng: {totalItems} giao dịch</p>
                    </div>

                    {!limit && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative" ref={typeDropdownRef}>
                                <button onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${filters.type ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}>
                                    <Filter size={16} /> <span>{filters.type ? getTransactionTypeLabel(filters.type) : 'Tất cả loại'}</span> <ChevronDown size={14} />
                                </button>
                                {isTypeDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
                                        <button onClick={() => { setTypeFilter(undefined); setIsTypeDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5 rounded-lg">Tất cả</button>
                                        <button onClick={() => { setTypeFilter('REDEMPTION'); setIsTypeDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-white/5 rounded-lg">Đổi Vé/Quà</button>
                                        <button onClick={() => { setTypeFilter('BUY_VOUCHER'); setIsTypeDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-white/5 rounded-lg">Mua Vé/Gói</button>
                                        <button onClick={() => { setTypeFilter('DEPOSIT'); setIsTypeDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-purple-400 hover:bg-white/5 rounded-lg">Nạp tiền</button>
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={userDropdownRef}>
                                <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${filters.userIds && filters.userIds.length > 0 ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}>
                                    <User size={16} /> <span>{filters.userIds && filters.userIds.length > 0 ? `Đã chọn (${filters.userIds.length})` : 'Lọc người dùng'}</span> <ChevronDown size={14} />
                                </button>
                                {isUserDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                                        <div className="mb-2 px-1 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                                            <input type="text" placeholder="Tìm tên hoặc email..." className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-purple-500" onChange={(e) => setUserSearch(e.target.value)} />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10 pr-1">
                                            {loadingUsers ? <div className="py-4 text-center text-white/30 text-xs"><Loader2 className="w-4 h-4 animate-spin mx-auto"/></div> : userList.length === 0 ? <div className="py-4 text-center text-white/30 text-xs">Không tìm thấy</div> : userList.map(user => {
                                                const isSelected = tempSelectedUserIds.includes(user.userId);
                                                return (
                                                    <div key={user.userId} onClick={() => toggleUserSelection(user.userId)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-sm ${isSelected ? 'bg-purple-500/20 text-purple-200' : 'hover:bg-white/5 text-white/70'}`}>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/30'}`}>{isSelected && <Check size={10} className="text-white" />}</div>
                                                        <div className="overflow-hidden"><div className="truncate font-medium">{user.fullName}</div><div className="truncate text-xs text-white/40">{user.email}</div></div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                                            <button onClick={clearUserFilterLocal} className="flex-1 py-1.5 text-xs text-white/60 hover:bg-white/5 rounded transition-colors">Xóa</button>
                                            <button onClick={applyUserFilter} className="flex-1 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors">Áp dụng</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button onClick={() => setIsDateModalOpen(!isDateModalOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${filters.fromDate && filters.toDate ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}>
                                    <Calendar size={16} />
                                    <span>{filters.fromDate && filters.toDate ? `${filters.fromDate} - ${filters.toDate}` : 'Chọn ngày'}</span>
                                    {(filters.fromDate || filters.toDate) && <div onClick={clearDateFilter} className="ml-1 p-0.5 rounded-full hover:bg-white/20 cursor-pointer"><X size={12} /></div>}
                                </button>
                                <AdminDateRangeModal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} onApply={handleDateApply} initialFrom={filters.fromDate} initialTo={filters.toDate} />
                            </div>
                            <button onClick={refresh} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"><Loader2 size={18} className={loading ? "animate-spin" : ""} /></button>
                        </div>
                    )}
                </div>

                {!limit && (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-2xl shadow-blue-900/40 animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10"><DollarSign size={32} className="text-white" /></div>
                            <div><h4 className="text-white font-bold text-lg uppercase tracking-wider">TỔNG DOANH THU</h4><p className="text-blue-100/80 text-sm mt-1">Tổng giá trị (chỉ tính loại Đổi Vé/Quà) từ danh sách</p></div>
                        </div>
                        <div className="text-right mt-4 sm:mt-0">
                            <div className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{formatVND(redemptionRevenue)} VND</div>
                            <div className="text-base text-blue-200 font-medium flex items-center justify-end gap-2 mt-2"><Wallet size={18} /><span>Đổi thực tế</span></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex-grow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-xs uppercase font-medium text-white/50">
                        <tr>
                            <th className="p-4 border-b border-white/10 w-12 text-center">#</th>
                            <th className="p-4 border-b border-white/10">Mã & Loại</th>
                            <th className="p-4 border-b border-white/10">Khách hàng / User</th>
                            <th className="p-4 border-b border-white/10">Nội dung</th>
                            <th className="p-4 border-b border-white/10 text-right">Giá trị</th>
                            <th className="p-4 border-b border-white/10">Trạng thái</th>
                            <th className="p-4 border-b border-white/10 text-right">Ngày tạo</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                        {loading && transactions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-white/50"><Loader2 className="animate-spin mx-auto mb-2" />Đang tải dữ liệu...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-white/50">Không có giao dịch nào.</td></tr>
                        ) : (
                            transactions.map((order: any, index: number) => (
                                <tr key={order.transactionId || index} onClick={() => handleRowClick(order.transactionId)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                    <td className="p-4 text-white/40 text-center">{(filters.page || 0) * (filters.size || 10) + index + 1}</td>
                                    <td className="p-4"><div className="flex flex-col"><span className="font-mono text-xs text-white/40 mb-1 group-hover:text-white/60 transition-colors">{order.transactionRef}</span><span className="font-bold text-white text-sm">{getTransactionTypeLabel(order.transactionType)}</span></div></td>
                                    <td className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-white/70 border border-white/10"><User size={14} /></div><div><div className="font-medium text-white text-sm">{order.partnerInfo?.partnerName || "Unknown"}</div><div className="text-xs text-white/40">{order.partnerInfo?.subTitle}</div></div></div></td>
                                    <td className="p-4 text-white/70 max-w-xs"><div className="line-clamp-2" title={order.description}>{order.description}</div></td>
                                    <td className="p-4 text-right">{renderAmountColumn(order)}</td>
                                    <td className="p-4">{renderStatusBadge(order.status)}</td>
                                    <td className="p-4 text-right text-white/50 text-xs">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!limit && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50">Trang <span className="font-bold text-white">{filters.page! + 1}</span> trên <span className="font-bold text-white">{totalPages}</span></p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(Math.max(0, filters.page! - 1))} disabled={filters.page === 0 || loading} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"><ChevronLeft size={18} /></button>
                        <div className="flex gap-1 hidden sm:flex">{Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let pageNum = i; if (totalPages > 5 && filters.page! > 2) { pageNum = filters.page! - 2 + i; } if (pageNum >= totalPages) return null; return (<button key={pageNum} onClick={() => setPage(pageNum)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${filters.page === pageNum ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{pageNum + 1}</button>); })}</div>
                        <button onClick={() => setPage(Math.min(totalPages - 1, filters.page! + 1))} disabled={filters.page! >= totalPages - 1 || loading} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"><ChevronRight size={18} /></button>
                    </div>
                </div>
            )}

            <TransactionDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} transactionId={selectedTxId} isUserView={false} />
        </div>
    );
};

export default OrdersTable;