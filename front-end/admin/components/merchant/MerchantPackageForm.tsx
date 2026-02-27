import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, UploadCloud, DollarSign, Image as ImageIcon, Check, Loader2, Package, Search } from 'lucide-react';
import { MerchantItemInfo } from '@/types/admin.merchant.type';
import { UpdatePackageRequest, CatalogStatus } from '@/types/admin.catalog.type';
import { uploadService } from '@/services/upload.service';
import { toast } from 'react-hot-toast';

interface MerchantPackageFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (packageId: string, data: UpdatePackageRequest) => Promise<boolean>;
    initialData: MerchantItemInfo | null;
    availableServices: MerchantItemInfo[]; // Danh sách service của merchant để chọn vào gói
    isLoading?: boolean;
}

export const MerchantPackageForm: React.FC<MerchantPackageFormProps> = ({
                                                                            isOpen,
                                                                            onClose,
                                                                            onSubmit,
                                                                            initialData,
                                                                            availableServices,
                                                                            isLoading = false
                                                                        }) => {
    // State
    const [packageName, setPackageName] = useState('');
    const [price, setPrice] = useState<number | string>('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [status, setStatus] = useState<CatalogStatus>(CatalogStatus.ACTIVE);

    // Logic chọn Service cho Package
    // Lưu ý: initialData của MerchantItemInfo không chứa danh sách service con.
    // Nếu API getDetail trả về list serviceIds của gói, ta cần truyền vào đây.
    // Tạm thời giả định Admin phải chọn lại hoặc logic Backend xử lý giữ nguyên nếu không gửi.
    const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && initialData) {
            setPackageName(initialData.itemName);
            setPrice(initialData.price);
            setImageUrl(initialData.imageUrl || '');
            setStatus(initialData.status);
            // Reset selected services (Hoặc fetch detail riêng để lấy list này)
            setSelectedServiceIds(new Set());
        } else {
            setPackageName('');
            setPrice('');
            setImageUrl('');
            setSelectedServiceIds(new Set());
        }
    }, [isOpen, initialData]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadService.uploadToCloudinary(file);
            setImageUrl(url);
        } catch { toast.error("Lỗi upload ảnh"); }
        finally { setIsUploading(false); }
    };

    const toggleService = (id: string) => {
        const newSet = new Set(selectedServiceIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedServiceIds(newSet);
    };

    const handleSubmit = async () => {
        if (!initialData) return;

        const payload: UpdatePackageRequest = {
            packageName: packageName,
            price: Number(price),
            description: description,
            imageUrl: imageUrl, // Nếu DTO có trường này
            status: status,
            serviceIds: Array.from(selectedServiceIds), // Gửi danh sách service mới
            // Undefined fields
            packageType: undefined as any,
            creditValue: undefined as any,
        };

        const success = await onSubmit(initialData.itemId, payload);
        if (success) onClose();
    };

    // Filter services để hiển thị
    const filteredServices = availableServices.filter(s =>
        s.type === 'SERVICE' &&
        s.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-white">Chỉnh sửa Gói Combo</h2>
                        <p className="text-xs text-white/50">Cập nhật thông tin và thành phần gói</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Info */}
                    <div className="w-full md:w-1/2 p-6 space-y-5 overflow-y-auto custom-scrollbar border-r border-white/5">
                        {/* Image */}
                        <div className="flex flex-col items-center">
                            <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-orange-500 hover:bg-white/5 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group">
                                {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" /> : <div className="text-white/30 flex flex-col items-center"><ImageIcon size={24} /><span className="text-xs mt-1">Ảnh gói</span></div>}
                                {isUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-white/60 uppercase">Tên gói</label>
                                <input value={packageName} onChange={e => setPackageName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-xs text-white/60 uppercase">Giá trọn gói</label>
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-xs text-white/60 uppercase">Mô tả</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none mt-1 h-20" />
                            </div>
                            <div>
                                <label className="text-xs text-white/60 uppercase mb-1 block">Trạng thái</label>
                                <div className="flex gap-2">
                                    {[CatalogStatus.ACTIVE, CatalogStatus.INACTIVE].map(s => (
                                        <button key={s} onClick={() => setStatus(s)} className={`px-2 py-1 rounded text-xs border ${status === s ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/10 text-white/50'}`}>{s}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Service Selection */}
                    <div className="w-full md:w-1/2 flex flex-col bg-white/[0.02]">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-xs font-bold text-white/70 uppercase mb-2">Chọn món trong gói</h3>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Tìm món..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-orange-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                            {filteredServices.map(service => {
                                const isSelected = selectedServiceIds.has(service.itemId);
                                return (
                                    <div
                                        key={service.itemId}
                                        onClick={() => toggleService(service.itemId)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-orange-500/10 border-orange-500/30' : 'border-transparent hover:bg-white/5'}`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-white/30'}`}>
                                            {isSelected && <Check size={10} className="text-white"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${isSelected ? 'text-orange-200' : 'text-white/70'}`}>{service.itemName}</div>
                                            <div className="text-xs text-white/30">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-3 border-t border-white/5 text-xs text-white/40 text-center">
                            Đã chọn: <span className="text-orange-400 font-bold">{selectedServiceIds.size}</span> món
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02] rounded-b-2xl">
                    <button onClick={onClose} disabled={isLoading} className="px-5 py-2 rounded-xl text-white/60 hover:bg-white/5 text-sm font-medium">Hủy</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !packageName || !price}
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-600/20 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        Lưu gói
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};