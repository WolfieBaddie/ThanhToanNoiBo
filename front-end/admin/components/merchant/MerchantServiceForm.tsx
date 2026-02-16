import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, UploadCloud, DollarSign, AlignLeft, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { MerchantItemInfo } from '@/types/admin.merchant.type';
import { UpdateServiceRequest, CatalogStatus } from '@/types/admin.catalog.type';
import { uploadService } from '@/services/upload.service'; // Giả sử dùng lại upload service cũ
import { toast } from 'react-hot-toast';

interface MerchantServiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (serviceId: string, data: UpdateServiceRequest) => Promise<boolean>;
    initialData: MerchantItemInfo | null;
    isLoading?: boolean;
}

export const MerchantServiceForm: React.FC<MerchantServiceFormProps> = ({
                                                                            isOpen,
                                                                            onClose,
                                                                            onSubmit,
                                                                            initialData,
                                                                            isLoading = false
                                                                        }) => {
    // State
    const [serviceName, setServiceName] = useState('');
    const [price, setPrice] = useState<number | string>('');
    const [description, setDescription] = useState(''); // Field này có thể thêm vào nếu API hỗ trợ
    const [imageUrl, setImageUrl] = useState('');
    const [status, setStatus] = useState<CatalogStatus>(CatalogStatus.ACTIVE);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset & Fill Data
    useEffect(() => {
        if (isOpen && initialData) {
            setServiceName(initialData.itemName);
            setPrice(initialData.price);
            setImageUrl(initialData.imageUrl || '');
            setStatus(initialData.status);
            // setDescription(initialData.description || ''); // Nếu item có description
        } else {
            setServiceName('');
            setPrice('');
            setImageUrl('');
            setStatus(CatalogStatus.ACTIVE);
        }
    }, [isOpen, initialData]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadService.uploadToCloudinary(file);
            setImageUrl(url);
        } catch (error) {
            toast.error("Lỗi tải ảnh lên");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!initialData) return;

        const payload: UpdateServiceRequest = {
            serviceName: serviceName,
            unitPrice: Number(price),
            imageUrl: imageUrl,
            description: description,
            status: status,
            // Các trường không dùng thì để undefined
            categoryId: undefined as any,
            assignedCounterIds: undefined as any
        };

        const success = await onSubmit(initialData.itemId, payload);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-white">Chỉnh sửa Dịch vụ</h2>
                        <p className="text-xs text-white/50">Cập nhật thông tin dịch vụ của Merchant</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

                    {/* Image Upload */}
                    <div className="flex flex-col items-center">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-500 hover:bg-white/5 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all relative group"
                        >
                            {imageUrl ? (
                                <>
                                    <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <UploadCloud className="text-white" size={24} />
                                    </div>
                                </>
                            ) : (
                                <div className="text-white/30 flex flex-col items-center gap-2">
                                    <ImageIcon size={32} />
                                    <span className="text-xs">Tải ảnh</span>
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-purple-500" />
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60 uppercase">Tên dịch vụ</label>
                            <input
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500 outline-none"
                                placeholder="Nhập tên dịch vụ..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60 uppercase">Giá niêm yết (VND)</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:border-purple-500 outline-none"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60 uppercase">Mô tả</label>
                            <div className="relative">
                                <AlignLeft size={16} className="absolute left-3 top-3 text-white/30"/>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:border-purple-500 outline-none min-h-[80px]"
                                    placeholder="Mô tả chi tiết..."
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60 uppercase">Trạng thái</label>
                            <div className="flex gap-2">
                                {[CatalogStatus.ACTIVE, CatalogStatus.INACTIVE, CatalogStatus.REJECTED].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStatus(s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                            status === s
                                                ? 'bg-purple-500 text-white border-purple-500'
                                                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02] rounded-b-2xl">
                    <button onClick={onClose} disabled={isLoading} className="px-5 py-2 rounded-xl text-white/60 hover:bg-white/5 text-sm font-medium">Hủy</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !serviceName || !price}
                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/20 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};