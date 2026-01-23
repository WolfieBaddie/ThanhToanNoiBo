import type { FC } from 'react';
import { useState } from 'react';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { UserStatus, UserType } from '@/types/user.type'; // Import Enum từ file type đã tạo
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const UsersTable: FC = () => {
    // 1. GỌI HOOK LOGIC
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
        refresh
    } = useAdminUsers(10); // Page size = 10

    // State local cho UI filter dropdown (nếu cần mở rộng sau này)
    const [showFilters, setShowFilters] = useState(false);

    // Helper function để map màu status (Giữ nguyên style của bạn)
    const getStatusStyle = (status: UserStatus | string) => {
        switch (status) {
            case UserStatus.ACTIVE:
                return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30';
            case UserStatus.LOCKED:
            case UserStatus.INACTIVE:
                return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30';
            default:
                return 'bg-white/10 text-white/60 border border-white/10';
        }
    };

    // Helper format tiền tệ (nếu UserResponse chưa có field balance thì tạm để 0 hoặc map từ field khác)
    const formatCurrency = (amount: number = 0) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    // Helper format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('vi-VN'); // Hoặc logic '2 hours ago' tùy ý
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-fadeIn flex flex-col h-full">
            {/* HEADER & ACTIONS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Users Management</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Manage student accounts ({totalItems} records)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* SEARCH BOX */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search user..."
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all w-48 md:w-64"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* FILTER BUTTON & DROPDOWN */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer
                ${filters.status || filters.role
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                                : 'bg-white/5 border-white/10 text-white hover:border-purple-500/50'}`}
                        >
                            <Filter size={16} />
                            <span>Filter</span>
                        </button>

                        {/* Quick Filter Popup */}
                        {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl p-2 z-50">
                                <div className="text-xs text-white/40 mb-1 px-2">Status</div>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-1 text-sm text-white mb-2"
                                    value={filters.status || ''}
                                    onChange={(e) => setStatusFilter(e.target.value as UserStatus || null)}
                                >
                                    <option value="">All Status</option>
                                    <option value={UserStatus.ACTIVE}>Active</option>
                                    <option value={UserStatus.LOCKED}>Locked</option>
                                </select>

                                <div className="text-xs text-white/40 mb-1 px-2">Role</div>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-1 text-sm text-white"
                                    value={filters.role || ''}
                                    onChange={(e) => setRoleFilter(e.target.value || null)}
                                >
                                    <option value="">All Roles</option>
                                    <option value={UserType.STUDENT}>Student</option>
                                    <option value={UserType.LECTURER}>Lecturer</option>
                                    <option value={UserType.MERCHANT}>Merchant</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <button onClick={refresh} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors" title="Refresh">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity">
                        + Add User
                    </button>
                </div>
            </div>

            {/* TABLE CONTENT */}
            <div className="overflow-x-auto rounded-xl border border-white/10 flex-grow relative">
                {loading && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <Loader2 className="animate-spin text-purple-500" size={32} />
                    </div>
                )}

                <table className="w-full">
                    <thead className="bg-white/5">
                    <tr>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">User Info</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Role</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Contact</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Balance (Demo)</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Status</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Last Login</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {!loading && users.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-12 text-white/40">
                                No users found matching your criteria.
                            </td>
                        </tr>
                    ) : (
                        users.map((user, index) => (
                            <tr key={user.userId} className="border-t border-white/5 hover:bg-white/5 transition-colors animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                                {/* Name & Avatar */}
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        {user.imageUrl ? (
                                            <img src={user.imageUrl} alt={user.fullName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                                                {user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-white font-medium text-sm">{user.fullName}</div>
                                            <div className="text-white/40 text-xs">@{user.username}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Role */}
                                <td className="text-white/80 p-4 text-sm">
                                    {Array.from(user.roles || []).map((r: string) => r.replace('ROLE_', '')).join(', ')}
                                </td>
                                {/* Email/Contact */}
                                <td className="text-white/70 p-4 text-sm">
                                    <div>{user.email}</div>
                                    <div className="text-xs text-white/30">{user.phoneNumber}</div>
                                </td>

                                {/* Balance (Giả định, vì API UserResponse chưa có balance) */}
                                <td className="text-white p-4 font-bold text-sm">
                                    {formatCurrency(0)}
                                </td>

                                {/* Status */}
                                <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(user.status)}`}>
                      {user.status}
                    </span>
                                </td>

                                {/* Last Login */}
                                <td className="p-4 text-white/60 text-sm">
                                    {formatDate(user.lastLoginAt)}
                                </td>

                                {/* Actions */}
                                <td className="p-4">
                                    <div className="flex space-x-2">
                                        <button className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-colors text-blue-400" title="Edit">
                                            ✏️
                                        </button>
                                        <button className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors text-red-400" title="Lock/Delete">
                                            🔒
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION FOOTER */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50">
                        Page <span className="font-bold text-white">{filters.page + 1}</span> of <span className="font-bold text-white">{totalPages}</span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(0, filters.page - 1))}
                            disabled={filters.page === 0 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {/* Simple Pagination Numbers */}
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i;
                                if (totalPages > 5 && filters.page > 2) pageNum = filters.page - 2 + i;
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
                            onClick={() => setPage(Math.min(totalPages - 1, filters.page + 1))}
                            disabled={filters.page >= totalPages - 1 || loading}
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

export default UsersTable;