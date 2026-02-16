import React, { useState } from 'react';
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    Clock, Eye, Loader2, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAdminRequest } from "@/hooks/admin/useAdminRequest";
import { AdminMerchantRequestDetailModal } from "@/admin/page/dashboard/components/AdminMerchantRequestDetailModal";
import { AdminReviewModal } from "@/admin/page/dashboard/components/AdminReviewModal";

const AdminMerchantRequestPage: React.FC = () => {
    const {
        requests,
        pagination,
        isLoading,
        setPage,
        exportReport, // Hàm export từ hook
        refetch
    } = useAdminRequest();

    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);

    // [LOGIC MỚI] Xử lý xuất báo cáo trực tiếp dựa trên ngày tạo Request
    const handleDirectExport = async (merchantId: string, createdAtString: string) => {
        if (!createdAtString) {
            toast.error("Dữ liệu ngày tạo không hợp lệ");
            return;
        }

        // Parse ngày tạo request
        const date = new Date(createdAtString);
        const month = date.getMonth() + 1; // JS getMonth() trả về 0-11
        const year = date.getFullYear();

        // Gọi hàm export luôn
        const success = await exportReport(merchantId, month, year);
        // Toast đã được xử lý bên trong hook/service (theo code trước đó) hoặc bạn có thể toast ở đây
    };

    // Helper: Map trạng thái sang Tiếng Việt
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'Đã duyệt';
            case 'REJECTED': return 'Từ chối';
            default: return 'Chờ xử lý';
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-6 animate-fadeIn">
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Yêu cầu Merchant</h1>
                    <p className="text-white/50 text-sm mt-1">Quản lý các yêu cầu cập nhật thông tin và đối soát từ đối tác</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* TABLE CONTENT */}
            <div className="flex-1 overflow-hidden bg-black/40 border border-white/10 rounded-2xl flex flex-col relative backdrop-blur-sm">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                        <Loader2 className="animate-spin text-purple-500" size={32} />
                    </div>
                )}

                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-xs uppercase text-white/40 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <th className="p-4 font-medium">Đối tác / Merchant</th>
                            <th className="p-4 font-medium">Loại yêu cầu</th>
                            <th className="p-4 font-medium">Ngày gửi</th>
                            <th className="p-4 font-medium">Trạng thái</th>
                            <th className="p-4 font-medium text-right">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                        {requests.length === 0 && !isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-white/30 italic">Không tìm thấy yêu cầu nào</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.requestId} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-white font-bold border border-white/10">
                                                {req.merchantUsername.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{req.merchantCurrentName}</div>
                                                <div className="text-xs text-white/50">@{req.merchantUsername}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white/80">Cập nhật & Đối soát</span>
                                            {/* Hiển thị tháng đối soát */}
                                            <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded w-fit font-mono">
                                                    Kỳ: {new Date(req.createdAt).getMonth() + 1}/{new Date(req.createdAt).getFullYear()}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-white/60 tabular-nums">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-white/30" />
                                            {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                req.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    req.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Nút Xem chi tiết */}
                                            <button
                                                onClick={() => setSelectedRequestId(req.requestId)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {/* Nút Export trực tiếp (Chỉ hiện khi đã Duyệt hoặc tùy logic) */}
                                            <button
                                                onClick={() => handleDirectExport(req.merchantId, req.createdAt)}
                                                className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors"
                                                title={`Tải đối soát tháng ${new Date(req.createdAt).getMonth() + 1}/${new Date(req.createdAt).getFullYear()}`}
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-white/10 flex justify-between items-center">
                        <p className="text-xs text-white/50 font-medium">Trang <span className="text-white">{pagination.pageIndex + 1}</span> / {pagination.totalPages}</p>
                        <div className="flex gap-2">
                            <button disabled={pagination.pageIndex === 0} onClick={() => setPage(pagination.pageIndex - 1)} className="p-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"><ChevronLeft size={16} /></button>
                            <button disabled={pagination.pageIndex >= pagination.totalPages - 1} onClick={() => setPage(pagination.pageIndex + 1)} className="p-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {selectedRequestId && (
                <AdminMerchantRequestDetailModal
                    requestId={selectedRequestId}
                    onClose={() => setSelectedRequestId(null)}
                    onOpenReview={() => { setReviewTargetId(selectedRequestId); setSelectedRequestId(null); setIsReviewModalOpen(true); }}
                />
            )}

            {isReviewModalOpen && reviewTargetId && (
                <AdminReviewModal
                    requestId={reviewTargetId}
                    onClose={() => setIsReviewModalOpen(false)}
                    onSuccess={() => { refetch(); setIsReviewModalOpen(false); }}
                />
            )}
        </div>
    );
};

export default AdminMerchantRequestPage;