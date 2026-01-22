import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    User, Mail, Phone, BadgeCheck,
    Package, Minus, Plus, UploadCloud, X, CheckCircle2,
    AlertTriangle, ArrowLeft, Image as ImageIcon, Loader2, CreditCard, Maximize2
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useMerchantVerify } from "@/hooks/useMerchantVerfiy";
import { QrCodeResponse } from '@/types/qr.type';
import { qrService } from '@/services/qr.service';

const MerchantVerifyPage: React.FC = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [qrData, setQrData] = useState<QrCodeResponse | null>(state?.qrData || null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // [MỚI] State điều khiển modal xem ảnh User
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const qrCodeParam = searchParams.get('code');

    useEffect(() => {
        if (qrData) return;
        if (!qrCodeParam) {
            setFetchError("Thiếu mã QR xác thực.");
            return;
        }
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const data = await qrService.verifyQr(qrCodeParam);
                setQrData(data);
            } catch (error: any) {
                console.error("Verify Error:", error);
                setFetchError(error.response?.data?.message || "Không thể tải thông tin mã QR.");
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, [qrCodeParam, qrData]);

    const {
        selectedItems,
        totalSelectedQty,
        previewUrl,
        isSubmitting,
        toggleItem,
        changeQuantity,
        handleImageUpload,
        removeImage,
        submitTransaction
    } = useMerchantVerify(qrData, (result) => {
        navigate('/merchant/success', {

            state: { result: result },

            replace: true // Xóa lịch sử trang verify để user không back lại được

        });
    });

    if (isLoadingData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-medium">Đang kiểm tra thông tin...</p>
            </div>
        );
    }

    if (!qrData || fetchError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
                <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm border border-slate-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Không thể xác thực</h2>
                    <p className="text-slate-500 mb-6">{fetchError || "Dữ liệu không hợp lệ. Vui lòng thử lại."}</p>
                    <button onClick={() => navigate('/merchant/dashboard')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const includedServices = qrData.includedServices || [];
    const limit = qrData.usageLimit || 1;
    const isOverLimit = totalSelectedQty > limit;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* --- [MỚI] MODAL XEM ẢNH USER FULLSCREEN --- */}
            {isUserModalOpen && qrData.imageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsUserModalOpen(false)} // Click ra ngoài để đóng
                >
                    {/* Nút đóng */}
                    <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10">
                        <X size={28} />
                    </button>

                    {/* Ảnh phóng to */}
                    <img
                        src={qrData.imageUrl}
                        alt={qrData.fullName}
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} // Chặn sự kiện click để không đóng khi nhấn vào ảnh
                    />
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-4 md:px-8 mb-6">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    <button onClick={() => navigate('/merchant/dashboard')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="overflow-hidden">
                        <h1 className="text-2xl font-bold text-slate-800 truncate">Xác nhận giao dịch</h1>
                        <p className="text-sm text-slate-500 font-mono truncate flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {qrData.codeString}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
                {/* --- KHỐI 1: THÔNG TIN NGƯỜI DÙNG --- */}
                <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">

                        {/* [CẬP NHẬT] Avatar Lớn hơn & Click để mở Modal */}
                        <div
                            className={`relative shrink-0 mx-auto md:mx-0 group ${qrData.imageUrl ? 'cursor-pointer' : ''}`}
                            onClick={() => qrData.imageUrl && setIsUserModalOpen(true)}
                        >
                            {/* Tăng kích thước md:w-40 -> md:w-48 */}
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] bg-slate-100 border-[6px] border-slate-50 shadow-xl overflow-hidden relative z-10 transition-transform group-hover:scale-[1.02]">
                                {qrData.imageUrl ? (
                                    <img src={qrData.imageUrl} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                                        <User size={80} />
                                    </div>
                                )}
                            </div>

                            {/* Badge Verify */}
                            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md z-20">
                                <div className="bg-emerald-500 text-white p-2 rounded-full">
                                    <BadgeCheck size={24} strokeWidth={3} />
                                </div>
                            </div>

                            {/* [MỚI] Lớp phủ hover gợi ý phóng to */}
                            {qrData.imageUrl && (
                                <div className="absolute inset-0 rounded-[2.5rem] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center text-white">
                                    <Maximize2 size={40} className="drop-shadow-lg" />
                                </div>
                            )}
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="mb-6">
                                <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-3">
                                    {qrData.fullName || "Khách vãng lai"}
                                </h2>
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-100 uppercase tracking-wide">
                                    <User size={16} />
                                    {qrData.userType || "USER"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                {/* Email */}
                                <div className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                        <Mail size={20} />
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Email</p>
                                        <p className="text-base font-bold text-slate-800 truncate" title={qrData.email}>
                                            {qrData.email || "Chưa cập nhật"}
                                        </p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                                        <Phone size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Số điện thoại</p>
                                        <p className="text-base font-bold text-slate-800 font-mono leading-none">
                                            {qrData.phoneNumber || "---"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- KHỐI 2: THÔNG TIN VOUCHER & CHỌN MÓN (Giữ nguyên) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cột trái: Thông tin Voucher */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm h-full">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                                <Package className="text-orange-500" size={24} />
                                Thông tin Voucher
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <CreditCard size={80} className="text-orange-600" />
                                    </div>
                                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Mã Voucher</p>
                                    <p className="text-2xl font-black text-slate-900 break-all relative z-10">
                                        {qrData.voucherCode || "UNKNOWN"}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-500">Giới hạn sử dụng</span>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-slate-900 block leading-none">{limit}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Lần / Vé</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Danh sách món */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                                    <CheckCircle2 className="text-emerald-500" size={24} />
                                    Chọn món khách lấy
                                </h3>
                                {isOverLimit && (
                                    <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full animate-pulse border border-red-100 flex items-center gap-1">
                                        <AlertTriangle size={12}/> Vượt quá giới hạn ({limit})
                                    </span>
                                )}
                            </div>

                            {includedServices.length > 0 ? (
                                <div className="space-y-3">
                                    {includedServices.map((service) => {
                                        const state = selectedItems[service.serviceId];
                                        if (!state) return null;
                                        return (
                                            <div key={service.serviceId} onClick={() => toggleItem(service.serviceId)} className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${state.isSelected ? 'bg-indigo-50/50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                                                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-colors shrink-0 ${state.isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white text-transparent group-hover:border-slate-400'}`}>
                                                    <CheckCircle2 size={18} strokeWidth={4} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold text-lg leading-tight ${state.isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{service.serviceName}</p>
                                                    <p className="text-sm font-medium text-slate-500 mt-1">{formatCurrency(service.unitPrice)}</p>
                                                </div>
                                                {state.isSelected && (
                                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-indigo-100 shadow-sm" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => changeQuantity(service.serviceId, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><Minus size={16} /></button>
                                                        <span className="w-8 text-center font-black text-lg text-slate-900">{state.quantity}</span>
                                                        <button onClick={() => changeQuantity(service.serviceId, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"><Plus size={16} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-slate-100 border-dashed">
                                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">Voucher này không quy định danh sách món cụ thể.</p>
                                    <p className="text-xs text-slate-400 mt-1">Hệ thống sẽ trừ giá trị tiền tương ứng.</p>
                                </div>
                            )}

                            <div className="mt-6 flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Tổng số lượng</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-black ${isOverLimit ? 'text-red-500' : 'text-indigo-600'}`}>{totalSelectedQty}</span>
                                    <span className="text-lg font-bold text-slate-400">/ {limit}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- KHỐI 3: HÌNH ẢNH XÁC THỰC (Giữ nguyên) --- */}
                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                        <ImageIcon className="text-pink-500" size={24} />
                        Hình ảnh xác thực <span className="text-red-500">*</span>
                    </h3>
                    {previewUrl ? (
                        <div className="relative w-full rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group">
                            <div className="min-h-[300px] flex items-center justify-center bg-slate-100/50">
                                <img src={previewUrl} alt="Proof" className="w-full h-auto max-h-[600px] object-contain shadow-sm" />
                            </div>
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                                <label className="cursor-pointer px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-50 hover:scale-105 transition-all flex items-center gap-2 shadow-xl">
                                    <UploadCloud size={20} /> Đổi ảnh khác
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                                <button onClick={removeImage} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 hover:scale-105 transition-all flex items-center gap-2 shadow-xl">
                                    <X size={20} /> Xóa ảnh
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-3 border-dashed border-slate-300 rounded-3xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group bg-slate-50/50">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-500 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                                <UploadCloud size={32} />
                            </div>
                            <p className="font-bold text-lg text-slate-700 group-hover:text-indigo-600 transition-colors">Chạm để tải ảnh xác thực</p>
                            <p className="text-sm text-slate-400 mt-2 font-medium">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} capture="environment" />
                        </label>
                    )}
                </div>

                {/* --- FOOTER ACTIONS --- */}
                <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4 pt-6 pb-8 border-t border-slate-100">
                    <button onClick={() => navigate('/merchant/dashboard')} className="w-full md:w-auto px-8 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-lg" disabled={isSubmitting}>Hủy bỏ</button>
                    <button onClick={submitTransaction} disabled={isSubmitting || isOverLimit || (includedServices.length > 0 && totalSelectedQty === 0)} className={`w-full md:w-auto px-12 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 transition-all text-lg ${(isSubmitting || isOverLimit) ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}>
                        {isSubmitting ? (<><Loader2 className="w-6 h-6 animate-spin" /> Đang xử lý...</>) : (<><CheckCircle2 size={24} /> Xác nhận Giao dịch</>)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MerchantVerifyPage;