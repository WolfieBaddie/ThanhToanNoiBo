import React, { useState, useEffect } from 'react';
import {
    X, CheckCircle2, XCircle, UploadCloud,
    Loader2, AlertCircle, ImageIcon, Trash2
} from 'lucide-react';
import { useAdminRequest } from "@/hooks/admin/useAdminRequest";
import { uploadService } from '@/services/upload.service';
import { toast } from 'react-hot-toast';

interface Props {
    requestId: string;
    onClose: () => void;
    onSuccess: () => void;
}

type ReviewStatus = 'APPROVED' | 'REJECTED';

export const AdminReviewModal: React.FC<Props> = ({ requestId, onClose, onSuccess }) => {
    // Hooks
    const { submitReview } = useAdminRequest();

    // State
    const [status, setStatus] = useState<ReviewStatus>('APPROVED');
    const [reason, setReason] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Clean up preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Handlers
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ảnh quá lớn. Vui lòng chọn ảnh < 5MB");
                return;
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    const handleSubmit = async () => {
        // Validate
        if (status === 'REJECTED' && !reason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối.");
            return;
        }

        setIsProcessing(true);
        try {
            let finalImageUrl = "";

            // 1. Upload ảnh (nếu có và đang duyệt)
            if (status === 'APPROVED' && imageFile) {
                try {
                    const toastId = toast.loading("Đang tải ảnh minh chứng...");
                    finalImageUrl = await uploadService.uploadToCloudinary(imageFile);
                    toast.dismiss(toastId);
                } catch (error) {
                    toast.error("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
                    setIsProcessing(false);
                    return;
                }
            }

            // 2. Gửi API Duyệt
            await submitReview({
                id: requestId,
                data: {
                    status: status,
                    reason: status === 'REJECTED' ? reason : undefined,
                    reviewImageUrl: status === 'APPROVED' ? finalImageUrl : undefined
                }
            });

            // 3. Success -> Close Modal
            onSuccess();
            onClose();

        } catch (error) {
            // Error đã được xử lý trong hook useAdminRequest (toast.error)
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1a1a1a] rounded-[24px] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden flex flex-col">

                {/* HEADER */}
                <div className="p-6 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Xử lý Yêu cầu</h2>
                        <p className="text-xs text-white/50 mt-1 font-medium">Quyết định phê duyệt hoặc từ chối</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8 space-y-6">

                    {/* 1. Chọn Trạng thái */}
                    <div className="flex gap-4">
                        <label
                            className={`flex-1 relative cursor-pointer p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                status === 'APPROVED'
                                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
                                    : 'border-white/10 hover:border-emerald-500/30 text-white/40 bg-white/5 hover:bg-white/10'
                            }`}
                        >
                            <input
                                type="radio" name="status" className="hidden"
                                checked={status === 'APPROVED'}
                                onChange={() => setStatus('APPROVED')}
                            />
                            <CheckCircle2 size={32} className={status === 'APPROVED' ? 'text-emerald-400' : 'text-white/20'} />
                            <span className="font-bold text-sm">Phê Duyệt</span>
                            {status === 'APPROVED' && <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                        </label>

                        <label
                            className={`flex-1 relative cursor-pointer p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                status === 'REJECTED'
                                    ? 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]'
                                    : 'border-white/10 hover:border-red-500/30 text-white/40 bg-white/5 hover:bg-white/10'
                            }`}
                        >
                            <input
                                type="radio" name="status" className="hidden"
                                checked={status === 'REJECTED'}
                                onChange={() => setStatus('REJECTED')}
                            />
                            <XCircle size={32} className={status === 'REJECTED' ? 'text-red-400' : 'text-white/20'} />
                            <span className="font-bold text-sm">Từ Chối</span>
                            {status === 'REJECTED' && <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.8)]" />}
                        </label>
                    </div>

                    {/* 2. Nội dung chi tiết (Conditional) */}
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        {status === 'APPROVED' ? (
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-white/80 flex items-center justify-between">
                                    <span>Ảnh minh chứng (Bill/Xác nhận)</span>
                                    <span className="text-[10px] text-white/40 font-normal bg-white/5 px-2 py-0.5 rounded border border-white/10">Không bắt buộc</span>
                                </label>

                                {previewUrl ? (
                                    <div className="relative group rounded-xl border border-white/20 overflow-hidden bg-black/40 h-40 flex items-center justify-center">
                                        <img src={previewUrl} alt="Proof" className="h-full object-contain" />
                                        <button
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md shadow-md rounded-full text-red-400 hover:bg-red-500/20 transition-all border border-white/10"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 w-full border border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all group">
                                        <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform mb-2 border border-white/5">
                                            <UploadCloud size={24} className="text-white/40 group-hover:text-emerald-400" />
                                        </div>
                                        <p className="text-xs text-white/50 font-medium group-hover:text-white/80">Tải ảnh xác thực lên đây</p>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                )}
                                <p className="text-[11px] text-white/30 italic">
                                    * Nên đính kèm ảnh chụp màn hình chuyển khoản hoặc biên lai xác nhận.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-red-400 flex items-center gap-1">
                                    Lý do từ chối <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full p-3 border border-red-500/30 rounded-xl bg-red-950/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all resize-none h-32 placeholder:text-red-200/30"
                                    placeholder="Nhập lý do tại sao yêu cầu này bị từ chối..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                ></textarea>
                                <div className="flex items-start gap-2 text-[11px] text-red-300 bg-red-500/10 p-2 rounded-lg border border-red-500/10">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <span>Lý do này sẽ được gửi thông báo trực tiếp đến Merchant.</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-6 py-3 text-white/50 font-bold hover:bg-white/10 hover:text-white rounded-xl transition-all text-sm disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed
                            ${status === 'APPROVED'
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                            : 'bg-red-600 hover:bg-red-500 shadow-red-900/40'
                        }`}
                    >
                        {isProcessing && <Loader2 size={16} className="animate-spin" />}
                        {status === 'APPROVED' ? 'Xác nhận Duyệt' : 'Xác nhận Từ chối'}
                    </button>
                </div>
            </div>
        </div>
    );
};