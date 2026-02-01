import type { FC } from 'react';
import { useState } from 'react';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import {useAdminUserActions} from "@/hooks/admin/useAdminUserMutations";
import { UserStatus, UserType, UserResponse } from '@/types/user.type';
import {
    Search, Filter, ChevronLeft, ChevronRight, Loader2, RefreshCw, Calendar,
    Edit, Trash2, AlertTriangle, X // [MỚI] Import Icons
} from 'lucide-react';

import { AdminDateRangeModal } from "@/admin/page/dashboard/components/AdminDateRangeModal";

const UsersTable: FC = () => {
    // 1. DATA HOOK
    const {
        data: users,
        loading,
        totalItems,
        totalPages,
        filters,
        setPage,
        setSearch,
        setStatusFilter,
        setRoleFilter,
        setDateFilter,
        refresh
    } = useAdminUsers(10);

    // 2. ACTION HOOK (Truyền refresh vào để reload bảng sau khi xóa thành công)
    const { deleteUser, loading: actionLoading } = useAdminUserActions(refresh);

    // 3. STATE
    const [showFilters, setShowFilters] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);

    // [MỚI] State cho Modal xác nhận khóa
    const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

    // --- HANDLERS ---

    // Xử lý xác nhận khóa tài khoản
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        const success = await deleteUser(deleteTarget.userId);
        if (success) {
            setDeleteTarget(null); // Đóng modal nếu thành công
        }
    };

    const handleDateApply = (from: Date, to: Date) => {
        setDateFilter(from, to);
    };

    // --- FORMATTERS ---
    const getStatusStyle = (status: UserStatus | string) => {
        switch (status) {
            case UserStatus.ACTIVE:
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case UserStatus.LOCKED:
            case UserStatus.DELETED:
                return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case UserStatus.INACTIVE:
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            default:
                return 'bg-white/5 text-white/40 border border-white/10';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatVND = (amount: number = 0) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-fadeIn flex flex-col h-full relative">

            {/* --- HEADER & ACTIONS --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Quản lý người dùng</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Danh sách tài khoản hệ thống ({totalItems} bản ghi)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all w-48 md:w-64"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDateModal(!showDateModal)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer text-sm
                            ${filters.fromDate
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                                : 'bg-white/5 border-white/10 text-white hover:border-purple-500/50'}`}
                        >
                            <Calendar size={16} />
                            <span>
                                {filters.fromDate
                                    ? `${filters.fromDate} - ${filters.toDate?.slice(5)}`
                                    : 'Ngày tạo'}
                            </span>
                        </button>

                        <AdminDateRangeModal
                            isOpen={showDateModal}
                            onClose={() => setShowDateModal(false)}
                            onApply={handleDateApply}
                            initialFrom={filters.fromDate}
                            initialTo={filters.toDate}
                        />
                    </div>

                    {/* Advanced Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer text-sm
                            ${filters.status || filters.role
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                                : 'bg-white/5 border-white/10 text-white hover:border-purple-500/50'}`}
                        >
                            <Filter size={16} />
                            <span>Bộ lọc</span>
                        </button>

                        {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-xs text-white/40 mb-1 px-1 font-semibold uppercase">Trạng thái</div>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white mb-3 focus:outline-none focus:border-purple-500/50"
                                    value={filters.status || ''}
                                    onChange={(e) => setStatusFilter(e.target.value as UserStatus || null)}
                                >
                                    <option value="">Tất cả</option>
                                    <option value={UserStatus.ACTIVE}>Hoạt động</option>
                                    <option value={UserStatus.LOCKED}>Đã khóa</option>
                                    <option value={UserStatus.DELETED}>Đã xóa</option>
                                </select>

                                <div className="text-xs text-white/40 mb-1 px-1 font-semibold uppercase">Vai trò</div>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                    value={filters.role || ''}
                                    onChange={(e) => setRoleFilter(e.target.value || null)}
                                >
                                    <option value="">Tất cả</option>
                                    <option value={UserType.STUDENT}>Sinh viên</option>
                                    <option value={UserType.MERCHANT}>Đối tác (Merchant)</option>
                                    <option value={UserType.ADMIN}>Quản trị viên</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <button onClick={refresh} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors" title="Làm mới">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
                        + Thêm mới
                    </button>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="overflow-x-auto rounded-xl border border-white/10 flex-grow relative bg-white/[0.02]">
                {loading && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                        <Loader2 className="animate-spin text-purple-500" size={32} />
                    </div>
                )}

                <table className="w-full border-collapse">
                    <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Người dùng</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Vai trò</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Liên hệ</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Số dư ví</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Trạng thái</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Ngày tham gia</th>
                        <th className="text-right p-4 text-white/60 font-medium text-sm">Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {!loading && users.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-16 text-white/40 flex flex-col items-center justify-center">
                                <Search size={40} className="mb-2 opacity-20" />
                                <p>Không tìm thấy dữ liệu phù hợp.</p>
                            </td>
                        </tr>
                    ) : (
                        users.map((user, index) => (
                            <tr key={user.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                {/* Name & Avatar */}
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                                            {user.imageUrl ? (
                                                <img src={user.imageUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                user.fullName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm group-hover:text-purple-400 transition-colors">{user.fullName}</div>
                                            <div className="text-white/40 text-xs">@{user.username}</div>
                                        </div>
                                    </div>
                                </td>

                                <td className="text-white/80 p-4 text-sm">
                                    {Array.from(user.roles || []).map((r, i) => (
                                        <span key={i} className="inline-block bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs mr-1">
                                            {r.replace('ROLE_', '')}
                                        </span>
                                    ))}
                                </td>

                                <td className="text-white/70 p-4 text-sm">
                                    <div className="flex flex-col">
                                        <span>{user.email}</span>
                                        <span className="text-xs text-white/30 mt-0.5">{user.phoneNumber || '-'}</span>
                                    </div>
                                </td>

                                <td className="text-white p-4 font-medium text-sm tabular-nums">
                                    {user.creditBalance !== undefined ? formatVND(user.creditBalance) : '-'}
                                </td>

                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusStyle(user.status)}`}>
                                      {user.status}
                                    </span>
                                </td>

                                <td className="p-4 text-white/60 text-sm tabular-nums">
                                    {formatDate(user.createdAt)}
                                </td>

                                {/* [CẬP NHẬT] ACTIONS COLUMN */}
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="p-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 text-white/60 transition-all"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit size={16} />
                                        </button>

                                        {/* Nút Khóa/Xóa mềm */}
                                        <button
                                            onClick={() => setDeleteTarget(user)}
                                            disabled={user.status === UserStatus.DELETED || user.status === UserStatus.LOCKED}
                                            className={`p-2 rounded-lg transition-all 
                                                ${(user.status === UserStatus.DELETED || user.status === UserStatus.LOCKED)
                                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                                : 'hover:bg-red-500/20 hover:text-red-400 text-white/60'}`}
                                            title={user.status === UserStatus.ACTIVE ? "Khóa tài khoản" : "Đã khóa"}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* --- PAGINATION (Giữ nguyên logic) --- */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50">
                        Trang <span className="font-bold text-white">{filters.page + 1}</span> / <span className="font-bold text-white">{totalPages}</span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(0, filters.page - 1))}
                            disabled={filters.page === 0 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {/* Logic phân trang rút gọn */}
                        <div className="text-sm text-white/40 px-2">...</div>
                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, filters.page + 1))}
                            disabled={filters.page >= totalPages - 1 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => !actionLoading && setDeleteTarget(null)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">Xác nhận khóa tài khoản</h3>
                                <p className="text-white/60 text-sm mt-2 leading-relaxed">
                                    Bạn có chắc chắn muốn vô hiệu hóa tài khoản
                                    <span className="text-white font-semibold mx-1">@{deleteTarget.username}</span>
                                    không?
                                </p>

                                <div className="mt-3 p-3 rounded-lg bg-red-900/10 border border-red-900/20">
                                    <ul className="text-xs text-red-300 list-disc pl-4 space-y-1">
                                        <li>Tài khoản sẽ bị chuyển sang trạng thái <strong>DELETED</strong>.</li>
                                        <li>Tất cả Voucher trong ví người dùng sẽ bị <strong>KHÓA</strong>.</li>
                                        {deleteTarget.userType === UserType.MERCHANT && (
                                            <li><strong>CẢNH BÁO:</strong> Vì đây là Merchant, Quầy hàng và các sản phẩm liên quan cũng sẽ bị ngừng hoạt động.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-red-900/20"
                            >
                                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersTable;