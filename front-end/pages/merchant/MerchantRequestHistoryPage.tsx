import React, { useState } from 'react';
import {
    RefreshCw, ArrowLeft, Download, Clock,
    CheckCircle2, XCircle, Eye, FileText, Search, Plus, X,
    UploadCloud, Trash2, ImageIcon, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 1. Import Hooks & Components
import { useMerchant } from '@/hooks/useMerchantRequest';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from "@/components/ui/Notification";
import { MerchantRequestDetailModal } from "@/components/merchant/MerchantRequestDetailModal";

const MerchantRequestHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Lấy logic từ Hook useMerchantRequest
    const {
        // Data
        requests,
        isLoadingRequests,
        isSubmitting,

        // Actions
        refreshRequests,
        submitRequest,
        exportExcel, // Hàm này nhận vào (month, year)

        // Image Logic
        imageFile,
        previewUrl,
        setPreviewUrl,
        handleImageUpload,
        removeImage
    } = useMerchant();

    // --- STATE UI LOCAL ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');

    const [notiState, setNotiState] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'info'; message: string }>({
        isOpen: false,
        type: 'info',
        message: ''
    });

    // --- HANDLERS ---

    // 1. Mở Form (CÓ CHECK NGÀY)
    const handleOpenForm = () => {
        // [LOGIC KHÓA] Kiểm tra thời gian hiện tại
        const now = new Date();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        // Chỉ cho phép mở form vào 2 ngày cuối cùng của tháng (Ví dụ 30 và 31)
        if (now.getDate() < lastDayOfMonth - 1) {
            setNotiState({
                isOpen: true,
                type: 'error',
                message: `Chưa đến kỳ kết toán. Hệ thống chỉ mở yêu cầu vào 2 ngày cuối tháng (Ngày ${lastDayOfMonth - 1} và ${lastDayOfMonth}).`
            });
            return;
        }

        setFullName(user?.fullName || '');
        if (user?.qrPaymentUrl) {
            setPreviewUrl(user.qrPaymentUrl);
        } else {
            removeImage();
        }
        setIsFormOpen(true);
    };

    // 2. Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await submitRequest({
                fullName: fullName,
                qrPaymentUrl: previewUrl || '',
                phoneNumber: user?.phoneNumber || ''
            });
            setIsFormOpen(false);
            setNotiState({
                isOpen: true,
                type: 'success',
                message: 'Đã gửi yêu cầu kết toán thành công.'
            });
        } catch (error) {
            // Error handled in hook
        }
    };

    // 3. Xử lý click Export theo ngày tạo request
    const handleExportClick = (createdAtString: string) => {
        if (!createdAtString) return;
        const date = new Date(createdAtString);
        // Gọi hàm exportExcel với Tháng và Năm của request đó
        exportExcel(date.getMonth() + 1, date.getFullYear());
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 font-sans">
            {/* HEADER SECTION */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-white rounded-full border border-slate-200 shadow-sm transition-all bg-white/50">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Lịch sử Kết toán</h1>
                        <p className="text-slate-500 text-sm">Gửi yêu cầu rút tiền và quản lý đối soát doanh thu</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => { refreshRequests(); setNotiState({ isOpen: true, message: 'Đã làm mới dữ liệu', type: 'success' }) }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-all shadow-sm"
                    >
                        <RefreshCw size={18} className={isLoadingRequests ? "animate-spin" : ""} />
                        Làm mới
                    </button>

                    {/* Nút Export Header: Mặc định xuất tháng hiện tại */}
                    <button
                        onClick={() => {
                            const now = new Date();
                            exportExcel(now.getMonth() + 1, now.getFullYear());
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-blue-600 hover:bg-blue-50 font-bold transition-all shadow-sm border-blue-100"
                    >
                        <Download size={18} />
                        Xuất Excel (Tháng này)
                    </button>

                    {/* [ĐÃ SỬA] Nút Gửi Yêu Cầu */}
                    <button
                        onClick={handleOpenForm}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <Plus size={20} />
                        Gửi yêu cầu kết toán
                    </button>
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mã Request</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Thông tin nhận tiền</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Chi tiết</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {isLoadingRequests ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 animate-pulse font-medium">Đang tải dữ liệu...</td></tr>
                        ) : requests.length > 0 ? (
                            requests.map((req) => (
                                <tr key={req.requestId} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">
                                        #{req.requestId.substring(0, 8).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase
                                                ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            req.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {req.status === 'APPROVED' ? <CheckCircle2 size={12} /> : req.status === 'REJECTED' ? <XCircle size={12} /> : <Clock size={12} />}
                                            {req.status === 'APPROVED' ? 'Đã thanh toán' : req.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                        {new Date(req.createdAt).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700">{req.submittedFullName}</div>
                                        {req.submittedQrUrl && (
                                            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-medium">
                                                <ImageIcon size={12} /> Có đính kèm QR
                                            </div>
                                        )}
                                    </td>

                                    {/* CỘT HÀNH ĐỘNG */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Nút Chi tiết */}
                                            <button
                                                onClick={() => setSelectedRequestId(req.requestId)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Xem chi tiết"
                                            >
                                                <Search size={18} />
                                            </button>

                                            {/* Nút Xuất Báo Cáo */}
                                            <button
                                                onClick={() => handleExportClick(req.createdAt)}
                                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                title={`Tải báo cáo kỳ ${new Date(req.createdAt).getMonth() + 1}/${new Date(req.createdAt).getFullYear()}`}
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium">Chưa có lịch sử kết toán nào.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORM GỬI YÊU CẦU --- */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Yêu cầu kết toán tháng {new Date().getMonth() + 1}</h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Vui lòng cung cấp thông tin nhận tiền chính xác</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    Lưu ý: Thông tin Tên và QR dưới đây sẽ được gửi cho Admin để thực hiện chuyển khoản doanh thu. Vui lòng kiểm tra kỹ trước khi gửi.
                                </p>
                            </div>

                            <form id="merchant-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-black text-slate-700 ml-1 uppercase tracking-wider">Tên người thụ hưởng (Chủ tài khoản)</label>
                                    <input
                                        type="text" required
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700 bg-slate-50/50"
                                        placeholder="VD: NGUYEN VAN A..."
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[13px] font-black text-slate-700 ml-1 uppercase tracking-wider">Mã QR Ngân Hàng (Nhận tiền)</label>
                                    <div className="relative group">
                                        {previewUrl ? (
                                            <div className="relative w-full h-56 bg-slate-100 rounded-3xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                                <img src={previewUrl} alt="QR Preview" className="h-full object-contain p-2" />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 rounded-full shadow-lg hover:bg-red-50 transition-all z-10"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="w-full h-56 bg-slate-50 hover:bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer transition-all group-hover:border-blue-400 group-hover:bg-blue-50/30 relative overflow-hidden">
                                                <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform relative z-10">
                                                    <UploadCloud size={28} className="text-blue-500" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-600 relative z-10">Nhấn để tải ảnh QR lên</p>
                                                <p className="text-xs text-slate-400 mt-1 relative z-10">PNG, JPG (Tối đa 5MB)</p>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 shrink-0">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 text-slate-500 rounded-2xl font-bold hover:bg-slate-200/50 transition-all text-sm">Hủy bỏ</button>
                            <button type="submit" form="merchant-form" disabled={isSubmitting} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 disabled:bg-blue-300 transition-all flex justify-center items-center gap-2 shadow-xl shadow-blue-200 text-sm uppercase tracking-wider">
                                {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : "Xác nhận gửi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CHI TIẾT --- */}
            {selectedRequestId && (
                <MerchantRequestDetailModal
                    requestId={selectedRequestId}
                    onClose={() => setSelectedRequestId(null)}
                />
            )}

            <Notification
                isOpen={notiState.isOpen}
                type={notiState.type}
                message={notiState.message}
                onClose={() => setNotiState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default MerchantRequestHistoryPage;