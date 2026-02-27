import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    User, Minus, Plus, UploadCloud, X, CheckCircle2,
    AlertTriangle, ArrowLeft, Image as ImageIcon, Loader2,
    ArrowRight, Layers, Ticket, Package
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
                setFetchError(error.response?.data?.message || "Không thể tải thông tin mã QR.");
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, [qrCodeParam, qrData]);

    // 3. HOOK LOGIC (GIỮ NGUYÊN)
    const {
        selectedItems,
        effectiveQuantity,
        isOverLimit,
        previewUrl,
        isSubmitting,
        toggleItem,
        changeQuantity,
        handleImageUpload,
        removeImage,
        submitTransaction,
        genericQuantity,
        setGenericQuantity,
        isSelectOne,
        isAllInclusive,
        isSingle
    } = useMerchantVerify(qrData, (result) => {
        navigate('/merchant/success', { state: { result: result }, replace: true });
    });

    // Biến cờ check Combo
    const isCombo = isSelectOne || isAllInclusive;

    const handleNextStep = () => {
        if (effectiveQuantity === 0) {
            notify.error("Vui lòng chọn ít nhất 1 mục.");
            return;
        }
        if (isCombo && Object.values(selectedItems).filter(i => i.isSelected).length === 0) {
            notify.error("Vui lòng chọn món khách yêu cầu.");
            return;
        }
        if (isOverLimit) {
            notify.error("Vượt quá giới hạn cho phép.");
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
            e.target.value = ''; // Reset để chọn lại được
        }
    };

    // --- VARIABLES LABEL (LOGIC HIỂN THỊ) ---
    const qrUsageLimit = qrData?.usageLimit || 1;
    const includedServices = qrData?.includedServices || [];

    // Label động dựa trên loại vé
    const unitLabel = isSingle ? "Vé" : "Món";
    const actionLabel = isSingle ? "Số lượng vé sử dụng" : "Chọn món khách dùng";
    const limitLabel = isSingle ? "Số dư Vé" : "Hạn mức (Món)";

    if (isLoadingData) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10"/></div>;

    if (!qrData || fetchError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <p className="text-slate-600 font-bold text-lg mb-6">{fetchError || "Dữ liệu không hợp lệ."}</p>
                <button onClick={() => navigate('/merchant/dashboard')} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Về trang chủ</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
            <ImageViewerModal isOpen={!!viewerImage} onClose={() => setViewerImage(null)} imageUrl={viewerImage} alt="Phóng to ảnh" />

            {/* HEADER (STATIC) */}
            <div className="bg-white border-b border-slate-200 shadow-sm py-4">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => currentStep === 1 ? navigate('/merchant/dashboard') : handleBackStep()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                            <ArrowLeft size={28} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                                {currentStep === 1 ? "Xử lý Vé & Combo" : "Xác thực ảnh"}
                            </h1>
                            <div className="flex gap-2 mt-1">
                                {isAllInclusive && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">TRỌN GÓI</span>}
                                {isSelectOne && <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200">TỰ CHỌN</span>}
                                {isSingle && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">VÉ LẺ</span>}
                            </div>
                        </div>
                    </div>
                    {/* Stepper */}
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                        <div className="w-8 h-0.5 bg-slate-300"></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-4xl mx-auto px-6 pt-8 space-y-6">

                {currentStep === 1 && (
                    <>
                        {/* 1. CARD THÔNG TIN (FULL WIDTH) */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Header Gói */}
                            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Package size={20} className="text-indigo-300"/>
                                        {qrData.packageName || "Dịch vụ"}
                                    </h2>
                                    <p className="opacity-80 font-mono mt-1 flex items-center gap-2 text-sm bg-white/10 w-fit px-2 rounded">
                                        <Ticket size={14}/> {qrData.voucherCode}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs opacity-60 uppercase font-bold">{limitLabel}</p>
                                    <p className="text-3xl font-black">{qrUsageLimit}</p>
                                </div>
                            </div>

                            {/* Body User */}
                            <div className="p-6 flex items-center gap-4 bg-white">
                                <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                    {qrData.imageUrl ? <img src={qrData.imageUrl} className="w-full h-full object-cover" /> : <User size={28} className="m-auto mt-3 text-slate-400"/>}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Khách hàng</p>
                                    <p className="font-bold text-slate-900 text-lg">{qrData.fullName || "Khách vãng lai"}</p>
                                    <p className="text-slate-500 text-sm">{qrData.email}</p>
                                </div>
                                <div className="ml-auto text-right border-l border-slate-100 pl-6">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Đã sử dụng</p>
                                    <p className="font-bold text-indigo-600 text-xl">{qrData.usageCount} <span className="text-sm text-slate-400 font-normal">lượt</span></p>
                                </div>
                            </div>
                        </div>

                        {/* 2. KHU VỰC CHỌN (LIST CÓ HÌNH ẢNH) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <Layers className="text-indigo-600" size={24}/> {actionLabel}
                            </h3>

                            {/* --- LIST ITEM (COMBO) --- */}
                            {isCombo && (
                                <div className="grid grid-cols-1 gap-4">
                                    {includedServices.map((service) => {
                                        const state = selectedItems[service.serviceId] || { quantity: 0, isSelected: false };
                                        const remaining = service.remainingQuantity ?? 999;
                                        const isSoldOut = remaining <= 0;

                                        return (
                                            <div key={service.serviceId}
                                                 onClick={() => !isSoldOut && toggleItem(service.serviceId)}
                                                 className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-5 hover:bg-slate-50
                                                ${state.isSelected ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100'}
                                                ${isSoldOut ? 'opacity-50 grayscale cursor-not-allowed' : ''} 
                                                `}>

                                                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 
                                                    ${state.isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                                                    {state.isSelected && <CheckCircle2 size={18} strokeWidth={3} />}
                                                </div>

                                                <div className="w-20 h-20 rounded-lg bg-slate-200 overflow-hidden border border-slate-100 shrink-0 shadow-sm">
                                                    <img
                                                        src={service.imageUrl || "https://placehold.co/100"}
                                                        alt={service.serviceName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-bold text-lg truncate ${state.isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                        {service.serviceName}
                                                    </p>
                                                    <div className="mt-1">
                                                        {!isSoldOut ? (
                                                            <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                                                Kho: <b>{remaining}</b>
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">HẾT HÀNG</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Counter (+/-) */}
                                                {state.isSelected && (
                                                    <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-lg p-1.5 shadow-sm" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => changeQuantity(service.serviceId, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-500"><Minus size={20} /></button>
                                                        <span className="w-8 text-center font-bold text-xl text-indigo-700">{state.quantity}</span>
                                                        <button onClick={() => changeQuantity(service.serviceId, 1)} className="w-8 h-8 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md"><Plus size={20} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* --- VÉ LẺ (SINGLE) --- */}
                            {isSingle && (
                                <div className="bg-slate-50 rounded-2xl p-8 border-2 border-dashed border-slate-300 flex flex-col items-center">
                                    <p className="font-bold text-lg text-slate-700 mb-6">Nhập số lượng vé cần trừ</p>
                                    <div className="flex items-center gap-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                        <button onClick={() => setGenericQuantity(Math.max(1, genericQuantity - 1))} className="w-14 h-14 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg"><Minus size={24}/></button>
                                        <span className="text-4xl font-black min-w-[80px] text-center text-slate-900">{genericQuantity}</span>
                                        <button
                                            onClick={() => {
                                                const max = Math.min(qrData.totalRemainingUsage ?? 999, qrUsageLimit);
                                                if (genericQuantity < max) setGenericQuantity(genericQuantity + 1);
                                                else notify.error("Đạt giới hạn vé");
                                            }}
                                            className="w-14 h-14 flex items-center justify-center bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-lg"><Plus size={24}/></button>
                                    </div>
                                    <p className="mt-4 text-slate-500">Còn lại trong ví: <b>{qrData.totalRemainingUsage}</b> vé</p>
                                </div>
                            )}

                            {/* 3. TOTAL BAR (NẰM TRONG FORM) */}
                            <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Xác nhận trừ</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-black ${isOverLimit ? 'text-red-500' : 'text-slate-900'}`}>{effectiveQuantity}</span>
                                        <span className="text-base font-bold text-slate-500 uppercase">{unitLabel}</span>
                                    </div>
                                    {isOverLimit && <span className="text-red-500 text-sm font-bold bg-red-100 px-2 py-0.5 rounded mt-1 inline-block">Vượt quá giới hạn!</span>}
                                </div>
                                <button
                                    onClick={handleNextStep}
                                    disabled={effectiveQuantity === 0 || isOverLimit}
                                    className="px-10 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 flex items-center gap-2 shadow-lg shadow-emerald-200/50 transition-all"
                                >
                                    Tiếp tục <ArrowRight size={24}/>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* STEP 2: UPLOAD ẢNH (KHÔI PHỤC LAYOUT CŨ) */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        {/* --- KHÔI PHỤC: SINGLE COLUMN UPLOAD (NHƯ CŨ) --- */}
                        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                                <ImageIcon className="text-pink-500" size={24} />
                                Ảnh xác thực (Bắt buộc)
                            </h3>

                            {previewUrl ? (
                                <div className="relative w-full rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group">
                                    <div className="min-h-[300px] flex items-center justify-center bg-slate-100/50">
                                        <img src={previewUrl} alt="Proof" className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in" onClick={() => setViewerImage(previewUrl)} />
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
                                    <input type="file" className="hidden" accept="image/*" onChange={onFileChange} capture="environment" />
                                </label>
                            )}
                        </div>

                        {/* FOOTER ACTIONS */}
                        <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-8 border-t border-slate-200 mt-8">
                            <button onClick={handleBackStep} className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">Quay lại</button>
                            <button onClick={submitTransaction} disabled={isSubmitting || !previewUrl} className="w-full md:w-auto px-12 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />} Xác nhận
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MerchantVerifyPage;