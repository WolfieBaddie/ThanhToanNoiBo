import React, { useState, useEffect } from 'react';
import {
    Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock, Calendar, Download, Eye, Loader2, X
} from 'lucide-react';

import { useAdminRequest } from "@/hooks/admin/useAdminRequest";
import { AdminDateRangeModal } from "@/admin/page/dashboard/components/AdminDateRangeModal";
import { AdminMerchantRequestDetailModal } from "@/admin/page/dashboard/components/AdminMerchantRequestDetailModal";
import { AdminReviewModal } from "@/admin/page/dashboard/components/AdminReviewModal";
import { AdminNotification, NotificationType } from "@/context/AdminNotification.tsx";

const AdminMerchantRequestPage: React.FC = () => {
    const {
        requests,
        pagination,
        isLoading,
        filters,
        setPage,
        handleSearch,
        handleFilterStatus,
        handleFilterDate,
        exportReport,
        refetch
    } = useAdminRequest();

    const [searchTerm, setSearchTerm] = useState('');
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        type: NotificationType;
        message: string;
    }>({ isOpen: false, type: 'success', message: '' });

    // Mặc định chọn 7 ngày
    useEffect(() => {
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(toDate.getDate() - 6);
        handleFilterDate(fromDate, toDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showNotification = (message: string, type: NotificationType = 'success') => {
        setNotification({ isOpen: true, type, message });
    };

    const formatDateTime = (isoString: string | undefined | null) => {
        if (!isoString) return '---';
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: false
            }).format(date);
        } catch (e) {
            return isoString;
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={14} /> Approved</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20"><XCircle size={14} /> Rejected</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Loader2 size={14} className="animate-spin" /> Pending</span>;
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => handleSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDateApply = (from: Date, to: Date) => {
        handleFilterDate(from, to);
        setIsDateModalOpen(false);
    };

    const handleOpenReview = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setReviewTargetId(id);
        setIsReviewModalOpen(true);
    };

    const handleReviewSuccess = () => {
        refetch();
        showNotification("Đã cập nhật trạng thái yêu cầu thành công!", "success");
    };

    const handleExport = async (merchantId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await exportReport(merchantId);
            showNotification("Đã xuất file báo cáo thành công.", "success");
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || "Lỗi không xác định";
            showNotification(`Lỗi xuất báo cáo: ${msg}`, "error");
        }
    };

    return (
        <div className="p-6 space-y-6 font-sans relative min-h-screen text-white">
            <AdminNotification
                isOpen={notification.isOpen}
                type={notification.type}
                message={notification.message}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
            />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Yêu cầu Merchant</h1>
                    <p className="text-white/50 text-sm mt-1">Duyệt cập nhật thông tin & Xuất đối soát</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { refetch(); showNotification("Đã làm mới dữ liệu", "info"); }} className="p-2.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl transition-all"><RefreshCw size={20} className={isLoading ? "animate-spin" : ""} /></button>
                </div>
            </div>

            {/* FILTER BAR - [FIX] Thêm z-20 để nổi lên trên bảng */}
            <div className="relative z-20 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col lg:flex-row gap-4 justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                        <input type="text" placeholder="Tìm tên, email, username..." className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm font-medium text-white/80 focus:outline-none cursor-pointer hover:bg-white/5 transition-all" value={filters.status || ''} onChange={(e) => handleFilterStatus(e.target.value)}>
                        <option value="" className="bg-slate-900 text-white">Tất cả trạng thái</option>
                        <option value="PENDING" className="bg-slate-900 text-white">Chờ duyệt</option>
                        <option value="APPROVED" className="bg-slate-900 text-white">Đã duyệt</option>
                        <option value="REJECTED" className="bg-slate-900 text-white">Đã từ chối</option>
                    </select>
                    <div className="relative">
                        <button onClick={() => setIsDateModalOpen(true)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${filters.fromDate ? 'bg-purple-500/20 text-purple-200 border-purple-500/50' : 'bg-black/20 text-white/70 border-white/10 hover:bg-white/5'}`}>
                            <Calendar size={16} />
                            {filters.fromDate ? `${formatDateTime(filters.fromDate).split(' ')[0]}...` : 'Lọc ngày'}
                            {filters.fromDate && <X size={14} className="ml-1 opacity-70 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleFilterDate(null, null); }} />}
                        </button>
                        <AdminDateRangeModal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} onApply={handleDateApply} initialFrom={filters.fromDate} initialTo={filters.toDate} />
                    </div>
                </div>
            </div>

            {/* TABLE - [FIX] z-0 hoặc z-10 thấp hơn Filter Bar */}
            <div className="relative z-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-xs font-bold text-white/40 uppercase tracking-wider">
                            <th className="px-6 py-4">Merchant</th>
                            <th className="px-6 py-4">Loại yêu cầu</th>
                            <th className="px-6 py-4 text-center">Trạng thái</th>
                            <th className="px-6 py-4">Thời gian tạo</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (<tr key={i}><td colSpan={5} className="px-6 py-4"><div className="h-10 bg-white/5 rounded-lg animate-pulse"></div></td></tr>))
                        ) : requests.length > 0 ? (
                            requests.map((req) => (
                                <tr key={req.requestId} onClick={() => setSelectedRequestId(req.requestId)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4"><div><p className="font-bold text-white text-sm">{req.merchantCurrentName}</p><p className="text-xs text-white/40 font-mono mt-0.5">{req.merchantUsername}</p></div></td>
                                    <td className="px-6 py-4"><span className="text-sm font-medium text-white/80">Cập nhật thông tin</span>{req.submittedQrUrl && <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold">QR</span>}</td>
                                    <td className="px-6 py-4 text-center">{renderStatusBadge(req.status)}</td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-white/50"><Clock size={14} className="text-white/30" />{formatDateTime(req.createdAt)}</div></td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setSelectedRequestId(req.requestId)} className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"><Eye size={18} /></button>
                                            {req.status === 'PENDING' && (<button onClick={(e) => handleOpenReview(req.requestId, e)} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/50">Xử lý</button>)}
                                            <button onClick={(e) => handleExport(req.merchantId, e)} className="p-2 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"><Download size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-white/30 italic border-t border-white/5">Không tìm thấy yêu cầu nào.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
                        <p className="text-xs text-white/50 font-medium">Trang <span className="text-white">{pagination.pageIndex + 1}</span> / {pagination.totalPages}</p>
                        <div className="flex gap-2">
                            <button disabled={pagination.pageIndex === 0} onClick={() => setPage(pagination.pageIndex - 1)} className="p-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"><ChevronLeft size={16} /></button>
                            <button disabled={pagination.pageIndex >= pagination.totalPages - 1} onClick={() => setPage(pagination.pageIndex + 1)} className="p-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {selectedRequestId && <AdminMerchantRequestDetailModal requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} onOpenReview={() => { setReviewTargetId(selectedRequestId); setSelectedRequestId(null); setIsReviewModalOpen(true); }} />}
            {isReviewModalOpen && reviewTargetId && <AdminReviewModal requestId={reviewTargetId} onClose={() => setIsReviewModalOpen(false)} onSuccess={handleReviewSuccess} />}
        </div>
    );
};

export default AdminMerchantRequestPage;