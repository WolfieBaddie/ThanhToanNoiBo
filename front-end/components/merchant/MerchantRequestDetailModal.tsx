import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    X, Clock, CheckCircle2, XCircle,
    User, Calendar, FileText, ImageIcon, ShieldCheck
} from 'lucide-react';
import { merchantService } from "@/services/merchant.request.service";
import { MerchantRequestResponse } from "@/types/merchant.request.type";

interface MerchantRequestDetailModalProps {
    requestId: string | null;
    onClose: () => void;
}

export const MerchantRequestDetailModal: React.FC<MerchantRequestDetailModalProps> = ({ requestId, onClose }) => {
    // 1. Fetch dữ liệu chi tiết khi có requestId
    const { data: request, isLoading, isError } = useQuery({
        queryKey: ['merchant', 'request', requestId],
        queryFn: () => merchantService.getRequestDetail(requestId!),
        enabled: !!requestId, // Chỉ chạy khi requestId không null
        retry: 1
    });

    if (!requestId) return null;

    // Helper render trạng thái
    const renderStatus = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <CheckCircle2 size={20} className="fill-emerald-100" />
                        <span className="font-black text-sm uppercase tracking-wide">Đã phê duyệt</span>
                    </div>
                );
            case 'REJECTED':
                return (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                        <XCircle size={20} className="fill-red-100" />
                        <span className="font-black text-sm uppercase tracking-wide">Bị từ chối</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                        <Clock size={20} className="fill-amber-100" />
                        <span className="font-black text-sm uppercase tracking-wide">Đang chờ xử lý</span>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Chi tiết Yêu cầu</h2>
                        <p className="text-xs text-slate-500 font-bold mt-1 font-mono uppercase">ID: {requestId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-medium">Đang tải thông tin...</p>
                        </div>
                    ) : isError || !request ? (
                        <div className="text-center py-10 text-red-500">
                            <XCircle size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Không thể tải dữ liệu yêu cầu này.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* 1. Trạng thái tổng quan */}
                            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Trạng thái hiện tại</p>
                                    {renderStatus(request.status)}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Thời gian tạo</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                                        <Calendar size={16} className="text-blue-500" />
                                        {new Date(request.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Grid thông tin chi tiết */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Cột Trái: Thông tin Merchant gửi */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <User size={16} /> Thông tin gửi đi
                                    </h3>

                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase">Tên hiển thị</p>
                                            <p className="text-base font-bold text-slate-800 mt-1">{request.submittedFullName}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Mã QR đính kèm</p>
                                            {request.submittedQrUrl ? (
                                                <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                    <img
                                                        src={request.submittedQrUrl}
                                                        alt="QR Sent"
                                                        className="w-full h-48 object-contain p-2"
                                                    />
                                                    <a
                                                        href={request.submittedQrUrl}
                                                        target="_blank"
                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold gap-2"
                                                    >
                                                        <ImageIcon size={20} /> Xem ảnh gốc
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="h-20 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs italic border border-dashed border-slate-200">
                                                    Không có ảnh QR
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Cột Phải: Phản hồi từ Admin */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <ShieldCheck size={16} /> Phản hồi từ Admin
                                    </h3>

                                    <div className={`p-5 rounded-2xl border shadow-sm h-full ${
                                        request.status === 'REJECTED' ? 'bg-red-50/50 border-red-100' :
                                            request.status === 'APPROVED' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        {request.status === 'PENDING' && (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <Clock size={40} className="mb-3 opacity-20" />
                                                <p className="text-sm font-medium">Đang chờ Admin xem xét...</p>
                                            </div>
                                        )}

                                        {request.status === 'REJECTED' && (
                                            <div className="space-y-3">
                                                <p className="text-[11px] font-bold text-red-400 uppercase">Lý do từ chối</p>
                                                <p className="text-sm font-bold text-red-700 bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                                    "{request.rejectionReason}"
                                                </p>
                                                <p className="text-[11px] text-red-400 italic text-right mt-2">
                                                    Vui lòng kiểm tra lại thông tin và gửi yêu cầu mới.
                                                </p>
                                            </div>
                                        )}

                                        {request.status === 'APPROVED' && (
                                            <div className="space-y-4">
                                                {request.adminReviewImageUrl ? (
                                                    <div>
                                                        <p className="text-[11px] font-bold text-emerald-600 uppercase mb-2">Minh chứng (Bill/Xác nhận)</p>
                                                        <div className="relative group rounded-xl overflow-hidden border border-emerald-200 bg-white">
                                                            <img
                                                                src={request.adminReviewImageUrl}
                                                                alt="Admin Proof"
                                                                className="w-full h-40 object-cover"
                                                            />
                                                            <a
                                                                href={request.adminReviewImageUrl}
                                                                target="_blank"
                                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold gap-2"
                                                            >
                                                                <FileText size={20} /> Xem chi tiết
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-emerald-700 font-medium text-sm flex items-center gap-2">
                                                        <CheckCircle2 size={16} /> Admin đã xác nhận cập nhật thành công.
                                                    </div>
                                                )}

                                                {request.reviewedAt && (
                                                    <div className="pt-4 border-t border-emerald-200/50">
                                                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Thời gian duyệt</p>
                                                        <p className="text-sm font-bold text-emerald-800">
                                                            {new Date(request.reviewedAt).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-sm text-sm uppercase tracking-wide"
                    >
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
};