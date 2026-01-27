import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    User, Mail, Phone, BadgeCheck,
    Package, Minus, Plus, UploadCloud, X, CheckCircle2,
    AlertTriangle, ArrowLeft, Image as ImageIcon, Loader2, CreditCard, Maximize2,
    ArrowRight, ClipboardList
} from 'lucide-react';
import { useMerchantVerify } from "@/hooks/useMerchantVerfiy";
import { QrCodeResponse } from '@/types/qr.type';
import { qrService } from '@/services/qr.service';
import { useNotification } from '@/context/NotificationContext';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';

const MerchantVerifyPage: React.FC = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const notify = useNotification();

    // 1. STATE UI
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [qrData, setQrData] = useState<QrCodeResponse | null>(state?.qrData || null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    const qrCodeParam = searchParams.get('code');

    // 2. FETCH DATA
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

    // 3. HOOK LOGIC
    const {
        selectedItems,
        effectiveQuantity,
        totalBillAmount,
        isPackage,
        isOverLimit,
        previewUrl,
        isSubmitting,
        toggleItem,
        changeQuantity,
        handleImageUpload,
        removeImage,
        submitTransaction,
        genericQuantity,
        setGenericQuantity
    } = useMerchantVerify(qrData, (result) => {
        navigate('/merchant/success', { state: { result: result }, replace: true });
    });

    // --- LOGIC CHUYỂN BƯỚC ---
    const handleNextStep = () => {
        if (effectiveQuantity === 0) {
            notify.error("Vui lòng chọn ít nhất 1 món/vé.");
            return;
        }
        if (isOverLimit) {
            notify.error("Vượt quá giới hạn sử dụng.");
            return;
        }
        setCurrentStep(2);
    };

    const handleBackStep = () => {
        setCurrentStep(1);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    };

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
                    <p className="text-slate-500 mb-6">{fetchError || "Dữ liệu không hợp lệ."}</p>
                    <button onClick={() => navigate('/merchant/dashboard')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const includedServices = qrData.includedServices || [];
    const limit = qrData.usageLimit || 1;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-10">

            <ImageViewerModal
                isOpen={!!viewerImage}
                onClose={() => setViewerImage(null)}
                imageUrl={viewerImage}
                alt="Phóng to ảnh"
            />

            {/* HEADER */}
            <div className="bg-white border-b border-slate-200">
                <div className="px-4 py-4 md:px-8 max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => currentStep === 1 ? navigate('/merchant/dashboard') : handleBackStep()} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-lg font-bold text-slate-800">
                            {currentStep === 1 ? "Bước 1: Chọn dịch vụ" : "Bước 2: Xác thực ảnh"}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <div className={`w-3 h-3 rounded-full transition-colors ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                        <div className={`w-3 h-3 rounded-full transition-colors ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 space-y-6">

                {/* === BƯỚC 1: THÔNG TIN USER & CHỌN MÓN === */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                        {/* 1.1 Thông tin Khách hàng */}
                        <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                            <div
                                className={`relative shrink-0 group ${qrData.imageUrl ? 'cursor-pointer' : ''}`}
                                onClick={() => qrData.imageUrl && setViewerImage(qrData.imageUrl)}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md relative z-10">
                                    {qrData.imageUrl ? (
                                        <img src={qrData.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                    ) : (
                                        <User className="w-full h-full p-3 text-slate-300" />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white z-20">
                                    <BadgeCheck size={12} />
                                </div>
                                {qrData.imageUrl && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 size={16} className="text-white drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-black text-slate-900 truncate">{qrData.fullName || "Khách vãng lai"}</h2>
                                <p className="text-sm text-slate-500 font-medium truncate">{qrData.email || "---"}</p>
                            </div>
                        </div>

                        {/* 1.2 Thông tin Voucher & Chọn Món */}
                        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                                    <CheckCircle2 className="text-indigo-600" size={24} />
                                    Chọn dịch vụ
                                </h3>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Hạn mức</span>
                                    <span className="text-sm font-black text-slate-900">{limit} Lần</span>
                                </div>
                            </div>

                            {/* Danh sách món */}
                            {includedServices.length > 0 ? (
                                <div className="space-y-3">
                                    {includedServices.map((service) => {
                                        const state = selectedItems[service.serviceId];
                                        if (!state) return null;

                                        const remaining = service.remainingQuantity ?? 999;
                                        const isSoldOut = remaining <= 0;
                                        const isMaxReached = state.quantity >= remaining;

                                        return (
                                            <div key={service.serviceId}
                                                 onClick={() => !isSoldOut && toggleItem(service.serviceId)}
                                                 className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 
                                                ${state.isSelected ? 'bg-indigo-50/50 border-indigo-500' : 'bg-white border-slate-100 hover:bg-slate-50'}
                                                ${isSoldOut ? 'opacity-50 grayscale cursor-not-allowed' : ''} 
                                                `}>
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 
                                                    ${state.isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white'}`}>
                                                    <CheckCircle2 size={14} strokeWidth={4} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className={`font-bold ${state.isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{service.serviceName}</p>
                                                        {remaining < 999 && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSoldOut ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                {isSoldOut ? 'Hết hàng' : `Còn: ${remaining}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {service.unitPrice.toLocaleString('vi-VN')}đ
                                                    </p>
                                                </div>
                                                {state.isSelected && (
                                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-indigo-100 shadow-sm" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => changeQuantity(service.serviceId, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500"><Minus size={16} /></button>
                                                        <span className="w-6 text-center font-bold text-slate-900">{state.quantity}</span>
                                                        <button
                                                            onClick={() => changeQuantity(service.serviceId, 1)}
                                                            disabled={isMaxReached}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isMaxReached ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'hover:bg-indigo-50 text-indigo-600'}`}
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center border-2 border-slate-100 border-dashed">
                                    <Package size={40} className="text-slate-300 mb-3" />
                                    <p className="text-slate-600 font-bold mb-1">Voucher này áp dụng cho 1 lần sử dụng</p>

                                    {qrData.includedServices?.[0]?.remainingQuantity !== undefined && (
                                        <p className="text-xs font-bold text-blue-600 mb-4 bg-blue-50 px-2 py-1 rounded">
                                            Còn lại: {qrData.includedServices[0].remainingQuantity} lượt
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                                        <button onClick={() => setGenericQuantity(Math.max(1, genericQuantity - 1))} className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors">
                                            <Minus size={20} />
                                        </button>
                                        <div className="w-16 text-center">
                                            <span className="text-2xl font-black text-slate-900">{genericQuantity}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const max = qrData.includedServices?.[0]?.remainingQuantity ?? 999;
                                                if (genericQuantity < max) setGenericQuantity(genericQuantity + 1);
                                                else notify.error("Đạt giới hạn số lượng");
                                            }}
                                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
                                                genericQuantity >= (qrData.includedServices?.[0]?.remainingQuantity ?? 999)
                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
                                            }`}
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tổng kết số lượng */}
                            <div className="mt-6 flex justify-between items-center p-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
                                <span className="font-bold text-sm uppercase tracking-wide opacity-80">Tổng số lượng</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-3xl font-black ${isOverLimit ? 'text-red-400' : 'text-white'}`}>{effectiveQuantity}</span>
                                    {/* [FIX] Ẩn phần limit nếu là Package để tránh hiểu nhầm "2/1" */}
                                    {!isPackage && <span className="text-sm font-bold opacity-60">/ {limit}</span>}
                                </div>
                            </div>
                            {isOverLimit && (
                                <p className="text-center text-red-500 text-xs font-bold mt-2 flex justify-center gap-1">
                                    <AlertTriangle size={14} /> Số lượng vượt quá hạn mức vé
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* === BƯỚC 2: XÁC THỰC ẢNH === */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                        {/* 2.1 Tóm tắt đơn hàng */}
                        <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ClipboardList className="text-orange-500" size={20} />
                                Tóm tắt giao dịch
                            </h3>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Khách hàng</span>
                                    <span className="font-bold text-slate-800">{qrData.fullName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Số lượng vé trừ</span>
                                    <span className="font-bold text-indigo-600">{effectiveQuantity} Vé</span>
                                </div>
                                {totalBillAmount > 0 && (
                                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                                        <span className="text-slate-500 font-medium">Tổng giá trị</span>
                                        <span className="font-bold text-slate-800">
                                            {totalBillAmount.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2.2 Upload Ảnh */}
                        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                                <ImageIcon className="text-pink-500" size={24} />
                                Ảnh xác thực (Bắt buộc)
                            </h3>

                            {previewUrl ? (
                                <div className="relative w-full rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group">
                                    <div className="min-h-[300px] flex items-center justify-center bg-slate-100/50">
                                        <img
                                            src={previewUrl}
                                            alt="Proof"
                                            className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in"
                                            onClick={() => setViewerImage(previewUrl)}
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                        <label className="cursor-pointer px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-xl">
                                            <UploadCloud size={18} /> Thay ảnh
                                            <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                                        </label>
                                        <button onClick={removeImage} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-xl">
                                            <X size={18} /> Xóa ảnh
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-64 border-3 border-dashed border-slate-300 rounded-3xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all bg-slate-50/50 active:scale-[0.99]">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-500 mb-3 shadow-sm border border-slate-100">
                                        <UploadCloud size={28} />
                                    </div>
                                    <p className="font-bold text-slate-700">Chạm để chụp/tải ảnh</p>
                                    <p className="text-xs text-slate-400 mt-1">Bằng chứng giao dịch</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={onFileChange} capture="environment" />
                                </label>
                            )}
                        </div>
                    </div>
                )}

                {/* --- FOOTER ACTIONS --- */}
                <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4 pt-8 border-t border-slate-200 mt-8">
                    {currentStep === 1 ? (
                        <>
                            <button onClick={() => navigate('/merchant/dashboard')} className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleNextStep}
                                disabled={effectiveQuantity === 0 || isOverLimit}
                                className="w-full md:w-auto px-12 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                Tiếp tục <ArrowRight size={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleBackStep} className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                                Quay lại
                            </button>
                            <button
                                onClick={submitTransaction}
                                disabled={isSubmitting || !previewUrl}
                                className="w-full md:w-auto px-12 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                                Xác nhận
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MerchantVerifyPage;