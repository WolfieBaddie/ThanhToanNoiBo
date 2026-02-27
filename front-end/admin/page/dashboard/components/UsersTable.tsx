import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import {useAdminUserMutations} from "@/hooks/admin/useAdminUserMutations";
import { useAdminRoles } from "@/hooks/admin/useAdminRole";
import { UserStatus, UserResponse, CreateUserRequest, UpdateUserRequest } from '@/types/user.type';
import {
    Search, Filter, ChevronLeft, ChevronRight, Loader2, RefreshCw, Calendar,
    Trash2, AlertTriangle, X, ChevronDown, Check, Shield, Activity, FilterX, Edit
} from 'lucide-react';

import { AdminDateRangeModal } from "@/admin/page/dashboard/components/AdminDateRangeModal";
import {AdminUserForm} from "@/admin/components/user/AdminUserForm";

// Helper: Config hiển thị cho Status
const getStatusConfig = (status: string) => {
    switch (status) {
        case UserStatus.ACTIVE:
            return { label: 'Hoạt động', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <Check size={14} /> };
        case UserStatus.LOCKED:
            return { label: 'Đã khóa', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <X size={14} /> };
        case UserStatus.DELETED:
            return { label: 'Đã xóa', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: <Activity size={14} /> };
        default:
            return { label: status, color: 'text-white', bg: 'bg-white/5 border-white/10', icon: null };
    }
};

const UsersTable: FC = () => {
    // 1. DATA HOOKS
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

    // 2. ACTION HOOKS (Lấy thêm createUser, updateUser)
    const {
        createUser,
        updateUser,
        deleteUser,
        loading: actionLoading
    } = useAdminUserMutations(refresh);

    const { roles: roleList, loading: roleLoading } = useAdminRoles();

    // 3. UI STATES
    const [showDateModal, setShowDateModal] = useState(false);

    // State Delete Modal
    const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

    // [MỚI] State Form Modal
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

    // Dropdown States
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const roleDropdownRef = useRef<HTMLDivElement>(null);

    const hasFilters = !!(filters.keyword || filters.status || filters.role || filters.fromDate);

    // --- HANDLERS ---

    const handleClearAllFilters = () => {
        setSearch('');
        setStatusFilter(null);
        setRoleFilter(null);
        setDateFilter(null, null);
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
    };

    // [MỚI] Mở form Tạo mới
    const handleOpenCreate = () => {
        setFormMode('CREATE');
        setSelectedUser(null);
        setIsFormOpen(true);
    };

    // [MỚI] Mở form Chỉnh sửa
    const handleOpenEdit = (user: UserResponse) => {
        setFormMode('EDIT');
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    // [MỚI] Xử lý Submit Form (Gọi API từ hook useAdminUserActions)
    const handleFormSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
        let success = false;
        if (formMode === 'CREATE') {
            success = await createUser(data as CreateUserRequest);
        } else {
            if (selectedUser) {
                success = await updateUser(selectedUser.userId, data as UpdateUserRequest);
            }
        }

        if (success) {
            setIsFormOpen(false); // Đóng form nếu thành công
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        const success = await deleteUser(deleteTarget.userId);
        if (success) setDeleteTarget(null);
    };

    const handleDateApply = (from: Date, to: Date) => {
        setDateFilter(from, to);
        setShowDateModal(false);
    };

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
                setIsRoleDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-fadeIn flex flex-col h-full">

            {/* --- HEADER & TOOLBAR --- */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white">Quản lý Người dùng</h3>
                    <p className="text-white/50 text-xs mt-1">Tổng cộng: {totalItems} tài khoản</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* SEARCH INPUT */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" size={16} />
                        <input
                            id="search-input"
                            type="text"
                            placeholder="Tìm kiếm user..."
                            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all w-48 md:w-64"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* ROLE FILTER */}
                    <div className="relative" ref={roleDropdownRef}>
                        <button
                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${filters.role ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                        >
                            <Shield size={16} />
                            <span>{filters.role ? filters.role : 'Tất cả vai trò'}</span>
                            <ChevronDown size={14} className={`transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isRoleDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
                                <button
                                    onClick={() => { setRoleFilter(null); setIsRoleDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${!filters.role ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
                                >
                                    <span>Tất cả</span>
                                    {!filters.role && <Check size={14} className="text-purple-400" />}
                                </button>

                                {roleLoading ? (
                                    <div className="px-3 py-2 text-xs text-white/40 text-center">Đang tải...</div>
                                ) : (
                                    roleList.map(role => (
                                        <button
                                            key={role.roleId}
                                            onClick={() => { setRoleFilter(role.roleCode); setIsRoleDropdownOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${filters.role === role.roleCode ? 'bg-purple-500/20 text-purple-200' : 'text-white/70 hover:bg-white/5'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{role.roleName}</span>
                                                <span className="text-[10px] opacity-60">{role.roleCode}</span>
                                            </div>
                                            {filters.role === role.roleCode && <Check size={14} className="text-purple-400" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* STATUS FILTER */}
                    <div className="relative" ref={statusDropdownRef}>
                        <button
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${filters.status ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                        >
                            <Activity size={16} />
                            <span>{filters.status ? getStatusConfig(filters.status).label : 'Tất cả trạng thái'}</span>
                            <ChevronDown size={14} className={`transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isStatusDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
                                <button
                                    onClick={() => { setStatusFilter(null); setIsStatusDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${!filters.status ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
                                >
                                    <span>Tất cả</span>
                                    {!filters.status && <Check size={14} />}
                                </button>

                                {Object.values(UserStatus).map((status) => {
                                    const config = getStatusConfig(status);
                                    const isSelected = filters.status === status;
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => { setStatusFilter(status); setIsStatusDropdownOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
                                        >
                                            <span className={`${config.color} font-medium`}>{config.label}</span>
                                            {isSelected && <Check size={14} className={config.color} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* DATE FILTER */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDateModal(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${filters.fromDate ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                        >
                            <Calendar size={16} />
                            <span>{filters.fromDate ? `${filters.fromDate} - ${filters.toDate}` : 'Thời gian'}</span>
                            {filters.fromDate && <div onClick={(e) => {e.stopPropagation(); setDateFilter(null,null)}} className="ml-1 p-0.5 rounded-full hover:bg-white/20"><X size={12}/></div>}
                        </button>
                        <AdminDateRangeModal isOpen={showDateModal} onClose={() => setShowDateModal(false)} onApply={handleDateApply} initialFrom={filters.fromDate} initialTo={filters.toDate} />
                    </div>

                    {/* CLEAR FILTER */}
                    {hasFilters && (
                        <button
                            onClick={handleClearAllFilters}
                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all animate-in fade-in zoom-in-75"
                            title="Xóa hết bộ lọc"
                        >
                            <FilterX size={18} />
                        </button>
                    )}

                    <button onClick={refresh} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors" title="Làm mới">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    {/* [MỚI] NÚT THÊM MỚI (Đã gán onClick) */}
                    <button
                        onClick={handleOpenCreate}
                        className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
                    >
                        + Thêm mới
                    </button>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex-grow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-xs uppercase font-medium text-white/50">
                        <tr>
                            <th className="p-4 border-b border-white/10 w-12 text-center">#</th>
                            <th className="p-4 border-b border-white/10">User Info</th>
                            <th className="p-4 border-b border-white/10">Vai trò</th>
                            <th className="p-4 border-b border-white/10">Trạng thái</th>
                            <th className="p-4 border-b border-white/10 text-right">Ngày tham gia</th>
                            <th className="p-4 border-b border-white/10 text-center">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-white/50"><Loader2 className="animate-spin mx-auto mb-2" />Đang tải danh sách...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-white/50">Không tìm thấy người dùng nào.</td></tr>
                        ) : (
                            users.map((user, index) => {
                                const statusCfg = getStatusConfig(user.status);
                                return (
                                    <tr key={user.userId} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-white/40 text-center">{(filters.page || 0) * (filters.size || 10) + index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                                                    {user.imageUrl ? <img src={user.imageUrl} className="w-full h-full rounded-full object-cover"/> : user.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{user.fullName}</div>
                                                    <div className="text-xs text-white/40 font-mono">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.map(r => (
                                                    <span key={r} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/5">
                                                            {r}
                                                        </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
                                                    {statusCfg.icon} {statusCfg.label}
                                                </span>
                                        </td>
                                        <td className="p-4 text-right text-white/50 text-xs font-mono">
                                            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* [ĐÃ ĐẤU] Nút Edit mở form */}
                                                <button
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                {/* Nút Xóa */}
                                                <button
                                                    onClick={() => setDeleteTarget(user)}
                                                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                    title="Xóa người dùng"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- PAGINATION --- */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50">Trang <span className="font-bold text-white">{filters.page! + 1}</span> / {totalPages}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(Math.max(0, filters.page! - 1))} disabled={filters.page === 0} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"><ChevronLeft size={18} /></button>
                        <button onClick={() => setPage(Math.min(totalPages - 1, filters.page! + 1))} disabled={filters.page! >= totalPages - 1} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"><ChevronRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRM MODAL --- */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="text-red-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Xóa người dùng?</h3>
                                <p className="text-sm text-white/60 mt-1">
                                    Bạn có chắc chắn muốn xóa người dùng <span className="font-bold text-white">{deleteTarget.fullName}</span>?
                                    Hành động này không thể hoàn tác.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} disabled={actionLoading} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">Hủy bỏ</button>
                            <button onClick={handleConfirmDelete} disabled={actionLoading} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-red-900/20">
                                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* [MỚI] ADMIN USER FORM */}
            <AdminUserForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedUser}
                mode={formMode}
                isLoading={actionLoading} // Truyền loading vào form
            />
        </div>
    );
};

export default UsersTable;