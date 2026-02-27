import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom'; // [MỚI] Import Portal
import {
    X, Save, Layers, UploadCloud, DollarSign, AlignLeft, Hash,
    Store, Search, Check, ChevronDown, Circle
} from 'lucide-react';
import { ServiceCategory, CatalogStatus, AdminServiceResponse, CatalogStatusMap } from '@/types/admin.catalog.type';
import { adminUserService } from '@/services/admin/admin.user.service';
import {useAdminCatalogMutations} from "@/hooks/admin/useAdminCatalogMutations.ts";
interface AdminServiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: AdminServiceResponse | null;
    categories: ServiceCategory[];
    mode: 'CREATE' | 'EDIT';
}

interface MerchantOption {
    userId: string;
    fullName: string;
    email: string;
    counterId?: string;
    counterName?: string;
}

export const AdminServiceForm: React.FC<AdminServiceFormProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      onSubmit,
                                                                      initialData,
                                                                      categories,
                                                                      mode
                                                                  }) => {
    // --- [MỚI] STATE & EFFECT CHO PORTAL/UI ---
    const [mounted, setMounted] = useState(false);
    const { approveMerchantService, rejectMerchantService } = useAdminCatalogMutations();
    console.log(initialData);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Khóa cuộn trang khi mở Modal
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // --- STATE FORM (LOGIC GIỮ NGUYÊN) ---
    const [serviceCode, setServiceCode] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [fixedPrice, setFixedPrice] = useState<number | string>('');
    const [categoryId, setCategoryId] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<CatalogStatus>(CatalogStatus.ACTIVE);

    // --- STATE UI CUSTOM DROPDOWNS ---
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const catRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);

    // --- STATE MERCHANT ---
    const [merchants, setMerchants] = useState<MerchantOption[]>([]);
    const [selectedCounterIds, setSelectedCounterIds] = useState<string[]>([]);
    const [merchantSearch, setMerchantSearch] = useState('');
    const [isLoadingMerchants, setIsLoadingMerchants] = useState(false);

    // --- CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (catRef.current && !catRef.current.contains(event.target as Node)) {
                setIsCatOpen(false);
            }
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- FETCH DATA ---
    useEffect(() => {
        if (isOpen) {
            const fetchMerchants = async () => {
                setIsLoadingMerchants(true);
                try {
                    const res = await adminUserService.getUsers({
                        page: 0, size: 100, role: 'MERCHANT', status: 'ACTIVE'
                    } as any);

                    const merchantList = (res.items || []).map((u: any) => ({
                        userId: u.userId,
                        fullName: u.fullName,
                        email: u.email,
                        counterId: u.counterId || u.userId,
                        counterName: u.counterName || "Quầy của " + u.fullName
                    }));
                    setMerchants(merchantList);
                } catch (error) {
                    console.error("Failed to load merchants", error);
                } finally {
                    setIsLoadingMerchants(false);
                }
            };
            fetchMerchants();
        }
    }, [isOpen]);

    // --- LOAD INITIAL DATA ---
    useEffect(() => {
        if (isOpen && mode === 'EDIT' && initialData) {
            setServiceCode(initialData.serviceCode);
            setServiceName(initialData.serviceName);
            setFixedPrice(initialData.minPrice || 0);

            const foundCat = categories.find(c => c.categoryName === initialData.categoryName);
            setCategoryId(foundCat ? foundCat.categoryId : '');

            setImageUrl(initialData.imageUrl || '');
            setDescription(initialData.description || '');
            setStatus(initialData.status || CatalogStatus.ACTIVE);

            if (initialData.merchants) {
                const existingIds = initialData.merchants
                    .map(m => m.counterId || m.merchantId)
                    .filter(Boolean) as string[];
                setSelectedCounterIds(existingIds);
            }
        } else if (isOpen && mode === 'CREATE') {
            setServiceCode('');
            setServiceName('');
            setFixedPrice('');
            setCategoryId('');
            setImageUrl('');
            setDescription('');
            setStatus(CatalogStatus.ACTIVE);
            setSelectedCounterIds([]);
        }
    }, [isOpen, initialData, mode, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ==========================================================
        // CASE 2: KHÔNG CÓ masterServiceCode -> Luồng duyệt Merchant
        // ==========================================================
        if (mode === 'EDIT' && !initialData?.masterServiceCode) {

            if (!initialData.serviceId) {
                console.error("Không có serviceId để duyệt!");
                return;
            }

            try {
                if (initialData?.status !== status) {
                    if (status === CatalogStatus.ACTIVE) {
                        await approveMerchantService(initialData.serviceId);
                    } else if (status === CatalogStatus.INACTIVE || status === CatalogStatus.REJECTED) {
                        await rejectMerchantService(initialData.serviceId);
                    }
                }

                onClose();
                return; // XONG CASE MERCHANT, CÚT LUÔN!
            } catch (error) {
                console.error("Lỗi khi gọi API duyệt/khóa:", error);
                return;
            }
        }

        // ==========================================================
        // CASE 1: CÓ masterServiceCode (Hoặc tạo mới) -> Master Service
        // ==========================================================
        onSubmit({
            serviceCode,
            serviceName,
            fixedPrice: Number(fixedPrice),
            categoryId,
            imageUrl,
            description,
            status,
            assignedCounterIds: selectedCounterIds
        });
    };

    const toggleMerchant = (id: string) => {
        setSelectedCounterIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const getStatusStyle = (st: CatalogStatus) => {
        const config = CatalogStatusMap[st] || CatalogStatusMap[CatalogStatus.INACTIVE];
        switch (config.color) {
            case 'green': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'red': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'orange': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'gray': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
            default: return 'text-white bg-white/10 border-white/20';
        }
    };

    const filteredMerchants = merchants.filter(m =>
        m.fullName.toLowerCase().includes(merchantSearch.toLowerCase()) ||
        (m.counterName && m.counterName.toLowerCase().includes(merchantSearch.toLowerCase()))
    );

    const selectedCategoryName = categories.find(c => c.categoryId === categoryId)?.categoryName || "-- Chọn danh mục --";

    // --- RENDER ---
    if (!mounted || !isOpen) return null;

    // Sử dụng Portal để render ra ngoài root -> Giúp căn giữa chuẩn xác
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

            {/* BACKDROP */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* MODAL CONTAINER */}
            <div className="relative z-10 w-full max-w-4xl bg-[#1e1e2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* 1. HEADER (Fixed) */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02] shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            {mode === 'CREATE' ? <Layers size={24} /> : <AlignLeft size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {mode === 'CREATE' ? 'Add Master Service' : 'Edit Service Details'}
                            </h2>
                            <p className="text-xs text-white/40">
                                {mode === 'CREATE' ? 'Create a new base service for the system.' : `Updating service: ${initialData?.serviceCode}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* 2. BODY (Scrollable Area) */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">

                    {/* LEFT: FORM INPUTS */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5 border-r border-white/5">

                        {/* Row 1: Code & Name */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">CODE</label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="text"
                                        value={serviceCode}
                                        onChange={(e) => setServiceCode(e.target.value.toUpperCase())}
                                        disabled={mode === 'EDIT'}
                                        placeholder="PHO_BO"
                                        className={`w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-purple-500/50 font-mono 
                                            ${mode === 'EDIT' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Service Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={serviceName}
                                    onChange={(e) => setServiceName(e.target.value)}
                                    placeholder="Enter name..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                />
                            </div>
                        </div>

                        {/* Row 2: Price & Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Base Price</label>
                                <div className="relative">
                                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="number"
                                        value={fixedPrice}
                                        onChange={(e) => setFixedPrice(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-purple-500/50 font-mono"
                                    />
                                </div>
                            </div>

                            <div ref={catRef} className="relative">
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Category <span className="text-red-400">*</span></label>
                                <button
                                    type="button"
                                    onClick={() => setIsCatOpen(!isCatOpen)}
                                    className={`w-full flex items-center justify-between bg-black/20 border rounded-lg py-2.5 px-3 text-sm transition-all
                                        ${isCatOpen ? 'border-purple-500/50 text-white' : 'border-white/10 text-white/70 hover:border-white/30'}
                                    `}
                                >
                                    <span className={categoryId ? 'text-white' : 'text-white/40'}>{selectedCategoryName}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isCatOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCatOpen && (
                                    <div className="absolute top-full mt-1 left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                                        {categories.map((cat) => (
                                            <div
                                                key={cat.categoryId}
                                                onClick={() => { setCategoryId(cat.categoryId); setIsCatOpen(false); }}
                                                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors
                                                    ${categoryId === cat.categoryId ? 'text-purple-400 bg-purple-500/10' : 'text-white/70'}
                                                `}
                                            >
                                                <span>{cat.categoryName}</span>
                                                {categoryId === cat.categoryId && <Check size={14} />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Status (CUSTOM DROPDOWN) - Chỉ hiện khi EDIT */}
                        {mode === 'EDIT' && (
                            <div ref={statusRef} className="relative">
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Status</label>
                                <button
                                    type="button"
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className={`w-full flex items-center justify-between bg-black/20 border rounded-lg py-2.5 px-3 text-sm transition-all
                                        ${isStatusOpen ? 'border-purple-500/50' : 'border-white/10 hover:border-white/30'}
                                    `}
                                >
                                    <div className={`flex items-center gap-2 px-2 py-0.5 rounded border text-xs font-medium ${getStatusStyle(status)}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" />
                                        {CatalogStatusMap[status]?.label || status}
                                    </div>
                                    <ChevronDown size={14} className={`text-white/40 transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isStatusOpen && (
                                    <div className="absolute top-full mt-1 left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-20 animate-in fade-in zoom-in-95 duration-100 p-1">
                                        {[CatalogStatus.ACTIVE, CatalogStatus.INACTIVE, CatalogStatus.PENDING, CatalogStatus.DELETED].map((st) => (
                                            <div
                                                key={st}
                                                onClick={() => { setStatus(st); setIsStatusOpen(false); }}
                                                className={`px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between rounded hover:bg-white/5 transition-colors
                                                    ${status === st ? 'bg-white/5' : ''}
                                                `}
                                            >
                                                <div className={`flex items-center gap-2 ${getStatusStyle(st).split(' ')[0]}`}>
                                                    <Circle size={8} fill="currentColor" />
                                                    <span className="text-white/80 font-medium">{CatalogStatusMap[st]?.label}</span>
                                                </div>
                                                {status === st && <Check size={14} className="text-purple-400" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Image */}
                        <div>
                            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Image URL</label>
                            <div className="flex gap-3 items-start">
                                <div className="w-14 h-14 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = ''} />
                                    ) : (
                                        <UploadCloud size={18} className="text-white/20" />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-grow bg-black/20 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* RIGHT: MERCHANT ASSIGNMENT */}
                    <div className="w-full md:w-[320px] bg-black/20 flex flex-col border-l border-white/5">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                                <Store size={16} className="text-blue-400" />
                                Assign to Merchants
                            </h3>
                            <p className="text-[10px] text-white/40 mb-3">
                                Force-deploy this service to specific counters.
                            </p>

                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Search merchant..."
                                    value={merchantSearch}
                                    onChange={(e) => setMerchantSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {isLoadingMerchants ? (
                                <div className="text-center py-8 text-white/30 text-xs flex flex-col items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Loading merchants...
                                </div>
                            ) : filteredMerchants.length === 0 ? (
                                <div className="text-center py-8 text-white/30 text-xs">No merchants found.</div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredMerchants.map(merchant => {
                                        const isSelected = selectedCounterIds.includes(merchant.counterId || merchant.userId);
                                        return (
                                            <div
                                                key={merchant.userId}
                                                onClick={() => toggleMerchant(merchant.counterId || merchant.userId)}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border
                                                    ${isSelected
                                                    ? 'bg-blue-500/10 border-blue-500/30'
                                                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}
                                                `}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                                                    ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20'}
                                                `}>
                                                    {isSelected && <Check size={10} className="text-white" />}
                                                </div>
                                                <div className="overflow-hidden min-w-0">
                                                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-blue-200' : 'text-white/80'}`}>
                                                        {merchant.counterName}
                                                    </div>
                                                    <div className="text-[10px] text-white/40 truncate">
                                                        {merchant.fullName}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                            <div className="flex justify-between text-xs text-white/50">
                                <span>Selected:</span>
                                <span className="text-blue-400 font-bold">{selectedCounterIds.length} counters</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. FOOTER (Fixed) */}
                <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-white/[0.02] rounded-b-2xl shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!serviceName || !fixedPrice || !categoryId}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Save size={16} />
                        {mode === 'CREATE' ? 'Create Service' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};