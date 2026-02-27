import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminRequestService } from "@/services/admin/admin.request.service";
import { X, User, ShieldCheck, CreditCard, Banknote, QrCode, Loader2 } from 'lucide-react';

interface Props {
    requestId: string;
    onClose: () => void;
    onOpenReview: () => void;
}

export const AdminMerchantRequestDetailModal: React.FC<Props> = ({ requestId, onClose, onOpenReview }) => {
    const { data: req, isLoading } = useQuery({
        queryKey: ['admin-request-detail', requestId],
        queryFn: () => adminRequestService.getRequestDetail(requestId)
    });

    if (!requestId) return null;

    // Helper format tiền tệ
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Chi tiết Yêu cầu Rút tiền</h2>
                        <p className="text-xs text-white/40 font-mono mt-1 uppercase">ID: {requestId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-white/60 hover:text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {isLoading || !req ? (
                        <div className="flex flex-col items-center justify-center py-20 text-white/30">
                            <Loader2 size={32} className="animate-spin mb-3"/>
                            <span>Đang tải dữ liệu...</span>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* 1. Merchant Info Section */}
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                <h3 className="text-xs font-bold text-white/50 uppercase mb-3 flex items-center gap-2">
                                    <User size={14} className="text-purple-400" /> Thông tin Người yêu cầu
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                        {req.merchantCurrentName?.charAt(0) || 'M'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{req.merchantCurrentName}</p>
                                        <p className="text-xs text-white/50 font-mono">{req.merchantUsername} • {req.merchantPhone || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Withdrawal Detail Section (Thông tin rút tiền) */}
                            <div className="bg-gradient-to-b from-emerald-500/10 to-transparent p-6 rounded-2xl border border-emerald-500/20">
                                <h3 className="text-sm font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2">
                                    <Banknote size={18} /> Thông tin giao dịch
                                </h3>

                                <div className="space-y-6">
                                    {/* Số tiền (Giả định req.amount có tồn tại, nếu không bạn cần map đúng field từ API) */}
                                    {req.amount && (
                                        <div className="text-center py-2">
                                            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Số tiền yêu cầu</p>
                                            <p className="text-4xl font-extrabold text-white">{formatCurrency(req.amount)}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Thông tin tài khoản nhận */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <CreditCard size={12}/> Tên chủ tài khoản
                                                </p>
                                                <p className="text-lg font-bold text-white">
                                                    {req.submittedFullName || req.merchantCurrentName}
                                                </p>
                                            </div>

                                            {/* Nếu có Bank Name / Number thì hiển thị ở đây */}
                                            {req.bankName && (
                                                <div>
                                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Ngân hàng</p>
                                                    <p className="text-sm text-white">{req.bankName} - {req.bankAccount}</p>
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Ghi chú</p>
                                                <p className="text-sm text-white/70 italic">{req.note || "Không có ghi chú"}</p>
                                            </div>
                                        </div>

                                        {/* QR Code nhận tiền */}
                                        <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                                                <QrCode size={12}/> QR Nhận tiền
                                            </p>
                                            {req.submittedQrUrl ? (
                                                <div className="p-2 bg-white rounded-lg">
                                                    <img src={req.submittedQrUrl} className="h-32 w-32 object-contain" alt="QR Code" />
                                                </div>
                                            ) : (
                                                <div className="h-32 w-32 flex items-center justify-center text-white/20 text-xs italic border border-white/10 border-dashed rounded-lg">
                                                    Không có QR
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Admin Feedback / Result */}
                            {req.status !== 'PENDING' && (
                                <div className={`p-5 rounded-2xl border ${
                                    req.status === 'APPROVED'
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-red-500/5 border-red-500/20'
                                }`}>
                                    <h4 className={`font-bold text-sm uppercase mb-2 flex items-center gap-2 ${
                                        req.status === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                        <ShieldCheck size={16} /> Kết quả xử lý
                                    </h4>
                                    <div className="text-white/80 text-sm flex justify-between items-start">
                                        <div>
                                            Trạng thái: <span className="font-bold">{req.status}</span>
                                            {req.status === 'REJECTED' && (
                                                <p className="mt-1 text-red-300 text-xs">Lý do: {req.rejectionReason}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-white/40">Xử lý bởi: {req.reviewedByName || 'Admin'}</p>
                                            <p className="text-xs text-white/40">{new Date(req.reviewedAt!).toLocaleString('vi-VN')}</p>
                                        </div>
                                    </div>

                                    {/* Ảnh bill chuyển khoản nếu có */}
                                    {req.status === 'APPROVED' && req.adminReviewImageUrl && (
                                        <div className="mt-3 pt-3 border-t border-emerald-500/10">
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase mb-2">Minh chứng chuyển khoản</p>
                                            <a href={req.adminReviewImageUrl} target="_blank" rel="noreferrer" className="block w-fit">
                                                <img src={req.adminReviewImageUrl} className="h-20 rounded border border-white/10 hover:opacity-80 transition-opacity" alt="Proof" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-white/60 font-bold hover:bg-white/10 hover:text-white rounded-xl transition-all text-sm"
                    >
                        Đóng
                    </button>
                    {req?.status === 'PENDING' && (
                        <button
                            onClick={onOpenReview}
                            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition-all text-sm flex items-center gap-2"
                        >
                            <ShieldCheck size={16} />
                            Xử lý Rút tiền
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};