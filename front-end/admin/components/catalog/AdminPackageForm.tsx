import React, { useEffect, useState, useRef } from 'react';
import {
    X, Save, Package, DollarSign, AlignLeft, Hash,
    Search, Check, ChevronDown, Circle, Layers, Coins
} from 'lucide-react';
import {
    CatalogStatus,
    PackageResponse,
    CatalogStatusMap,
    AdminServiceResponse
} from '@/types/admin.catalog.type';
import { adminCatalogService } from '@/services/admin/admin.catalog.service';

interface AdminPackageFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: PackageResponse | null;
    mode: 'CREATE' | 'EDIT';
}

export const AdminPackageForm: React.FC<AdminPackageFormProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      onSubmit,
                                                                      initialData,
                                                                      mode
                                                                  }) => {
    // --- STATE FORM ---
    const [packageCode, setPackageCode] = useState('');
    const [packageName, setPackageName] = useState('');
    const [price, setPrice] = useState<number | string>('');
    const [description, setDescription] = useState('');

    // [CẬP NHẬT] Thay packageType bằng comboType
    const [comboType, setComboType] = useState('ALL_INCLUSIVE');

    const [creditValue, setCreditValue] = useState<number | string>('0');
    const [status, setStatus] = useState<CatalogStatus>(CatalogStatus.ACTIVE);

    // --- STATE UI DROPDOWNS ---
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    // Refs
    const typeRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);

    // --- STATE SERVICE SELECTION ---
    const [availableServices, setAvailableServices] = useState<AdminServiceResponse[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [serviceSearch, setServiceSearch] = useState('');
    const [isLoadingServices, setIsLoadingServices] = useState(false);

    // --- CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
                setIsTypeOpen(false);
            }
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- FETCH AVAILABLE SERVICES ---
    useEffect(() => {
        if (isOpen) {
            const fetchServices = async () => {
                setIsLoadingServices(true);
                try {
                    const res = await adminCatalogService.getMasterServices({
                        page: 0, size: 100, status: CatalogStatus.ACTIVE
                    });
                    setAvailableServices(res.items || []);
                } catch (error) {
                    console.error("Failed to load services", error);
                } finally {
                    setIsLoadingServices(false);
                }
            };
            fetchServices();
        }
    }, [isOpen]);

    // --- LOAD INITIAL DATA ---
    useEffect(() => {
        if (isOpen && mode === 'EDIT' && initialData) {
            setPackageCode(initialData.packageCode);
            setPackageName(initialData.packageName);
            setPrice(initialData.price);
            setDescription(initialData.description || '');

            // [CẬP NHẬT] Load comboType
            setComboType((initialData as any).comboType || 'ALL_INCLUSIVE');

            setCreditValue(initialData.creditValue || 0);
            setStatus(initialData.status || CatalogStatus.ACTIVE);

            if (initialData.items) {
                const existingIds = initialData.items.map(item => item.serviceId);
                setSelectedServiceIds(existingIds);
            }
        } else if (isOpen && mode === 'CREATE') {
            setPackageCode('');
            setPackageName('');
            setPrice('');
            setDescription('');
            setComboType('ALL_INCLUSIVE'); // Default
            setCreditValue(0);
            setStatus(CatalogStatus.ACTIVE);
            setSelectedServiceIds([]);
        }
    }, [isOpen, initialData, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            packageCode,
            packageName,
            price: Number(price),
            description,
            comboType, // [CẬP NHẬT] Gửi comboType thay vì packageType
            creditValue: Number(creditValue),
            status,
            serviceIds: selectedServiceIds
        });
    };

    const toggleService = (id: string) => {
        setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
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

    const filteredServices = availableServices.filter(s =>
        s.serviceName.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.serviceCode.toLowerCase().includes(serviceSearch.toLowerCase())
    );

    // [CẬP NHẬT] Danh sách tùy chọn Combo Type
    const comboTypes = [
        { value: 'ALL_INCLUSIVE', label: 'All Inclusive (Trọn gói)' },
        { value: 'SELECT_ONE', label: 'Select One (Chọn 1 món)' }
    ];

    const currentTypeLabel = comboTypes.find(t => t.value === comboType)?.label || comboType;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* 1. HEADER */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {mode === 'CREATE' ? 'Add New Package' : 'Edit Package Details'}
                            </h2>
                            <p className="text-xs text-white/40">
                                {mode === 'CREATE' ? 'Create a combo or credit package.' : `Updating package: ${initialData?.packageCode}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* 2. BODY */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* LEFT: FORM INPUTS */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5 border-r border-white/5">

                        {/* Row 1: Code & Name */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">PACKAGE CODE</label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="text"
                                        value={packageCode}
                                        onChange={(e) => setPackageCode(e.target.value.toUpperCase())}
                                        disabled={mode === 'EDIT'}
                                        placeholder="COMBO_01"
                                        className={`w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono 
                                            ${mode === 'EDIT' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Package Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={packageName}
                                    onChange={(e) => setPackageName(e.target.value)}
                                    placeholder="e.g. Combo Sáng Vui Vẻ"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Row 2: Price & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Selling Price</label>
                                <div className="relative">
                                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-emerald-400 font-bold focus:outline-none focus:border-blue-500/50 font-mono"
                                    />
                                </div>
                            </div>

                            {/* [CẬP NHẬT] Combo Type Dropdown */}
                            <div ref={typeRef} className="relative">
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Combo Type <span className="text-red-400">*</span></label>
                                <button
                                    type="button"
                                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                                    className={`w-full flex items-center justify-between bg-black/20 border rounded-lg py-2.5 px-3 text-sm transition-all
                                        ${isTypeOpen ? 'border-blue-500/50 text-white' : 'border-white/10 text-white/70 hover:border-white/30'}
                                    `}
                                >
                                    <span className="truncate">{currentTypeLabel}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isTypeOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isTypeOpen && (
                                    <div className="absolute top-full mt-1 left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-20 animate-in fade-in zoom-in-95 duration-100 p-1">
                                        {comboTypes.map((t) => (
                                            <div
                                                key={t.value}
                                                onClick={() => { setComboType(t.value); setIsTypeOpen(false); }}
                                                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors rounded
                                                    ${comboType === t.value ? 'text-blue-400 bg-blue-500/10' : 'text-white/70'}
                                                `}
                                            >
                                                <span>{t.label}</span>
                                                {comboType === t.value && <Check size={14} />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Credit Value */}
                        <div>
                            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Credit Value (Points)</label>
                            <div className="relative">
                                <Coins size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="number"
                                    value={creditValue}
                                    onChange={(e) => setCreditValue(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono"
                                />
                            </div>
                            <p className="text-[10px] text-white/30 mt-1">Value used if this package grants credits to user wallet.</p>
                        </div>

                        {/* Row 4: Status (Only Edit) */}
                        {mode === 'EDIT' && (
                            <div ref={statusRef} className="relative">
                                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Status</label>
                                <button
                                    type="button"
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className={`w-full flex items-center justify-between bg-black/20 border rounded-lg py-2.5 px-3 text-sm transition-all
                                        ${isStatusOpen ? 'border-blue-500/50' : 'border-white/10 hover:border-white/30'}
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
                                        {[CatalogStatus.ACTIVE, CatalogStatus.INACTIVE, CatalogStatus.DELETED].map((st) => (
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
                                                {status === st && <Check size={14} className="text-blue-400" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* RIGHT: SERVICE ASSIGNMENT */}
                    <div className="w-full md:w-[320px] bg-black/20 flex flex-col border-l border-white/5">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                                <Layers size={16} className="text-purple-400" />
                                Bundle Items
                            </h3>
                            <p className="text-[10px] text-white/40 mb-3">
                                Select master services to include in this package.
                            </p>

                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={serviceSearch}
                                    onChange={(e) => setServiceSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-purple-500/50"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {isLoadingServices ? (
                                <div className="text-center py-8 text-white/30 text-xs flex flex-col items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Loading services...
                                </div>
                            ) : filteredServices.length === 0 ? (
                                <div className="text-center py-8 text-white/30 text-xs">No services found.</div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredServices.map(service => {
                                        const keyId = service.serviceCode;
                                        const isSelected = selectedServiceIds.includes(keyId);

                                        return (
                                            <div
                                                key={keyId}
                                                onClick={() => toggleService(keyId)}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border
                                                    ${isSelected
                                                    ? 'bg-purple-500/10 border-purple-500/30'
                                                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}
                                                `}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                                                    ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20'}
                                                `}>
                                                    {isSelected && <Check size={10} className="text-white" />}
                                                </div>
                                                <div className="w-8 h-8 rounded bg-white/10 overflow-hidden flex-shrink-0">
                                                    <img src={service.imageUrl} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="overflow-hidden min-w-0 flex-1">
                                                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-purple-200' : 'text-white/80'}`}>
                                                        {service.serviceName}
                                                    </div>
                                                    <div className="text-[10px] text-white/40 truncate flex justify-between">
                                                        <span>{service.serviceCode}</span>
                                                        <span className="text-emerald-400">{service.minPrice.toLocaleString()}</span>
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
                                <span>Selected Items:</span>
                                <span className="text-purple-400 font-bold">{selectedServiceIds.length} items</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. FOOTER */}
                <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-white/[0.02] rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!packageName || !price}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Save size={16} />
                        {mode === 'CREATE' ? 'Create Package' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};