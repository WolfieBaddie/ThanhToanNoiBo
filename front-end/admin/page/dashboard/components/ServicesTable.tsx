import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useAdminCatalog } from '@/hooks/admin/useAdminCatalog';
import { useAdminCatalogMutations } from '@/hooks/admin/useAdminCatalogMutations';
import {
    Search, Filter, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    Package, Layers, Plus, Loader2, LayoutGrid, List as ListIcon, Store,
    Edit, Trash2, Eye, Check, User, MapPin
} from 'lucide-react';

import {
    AdminServiceResponse,
    CatalogStatus,
    PackageResponse,
    CatalogStatusMap
} from '@/types/admin.catalog.type';
import { formatCurrency } from '@/utils/format';

// Components
import { AdminServiceForm } from "@/admin/components/catalog/AdminServiceForm";
// [CẬP NHẬT 1] Import Package Form
import { AdminPackageForm } from "@/admin/components/catalog/AdminPackageForm";
import { AdminNotification, NotificationType } from "@/context/AdminNotification.tsx";

const ServicesTable: FC = () => {
    // 1. QUERY HOOK
    const {
        data, loading, totalItems, totalPages, filters, categories,
        setTabType, setPage, setSearch, setCategoryFilter, refresh
    } = useAdminCatalog();

    // 2. MUTATION HOOK
    const {
        createMasterService, updateMasterService, deleteMasterService,
        // [CẬP NHẬT 2] Lấy thêm các hàm xử lý Package
        createPackage, updatePackage, deletePackage
    } = useAdminCatalogMutations();

    // 3. STATE UI
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isCatOpen, setIsCatOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // STATE FORM SERVICE
    const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<AdminServiceResponse | null>(null);

    // [CẬP NHẬT 3] STATE FORM PACKAGE
    const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<PackageResponse | null>(null);

    // SHARED FORM STATE
    const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Notification State
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        type: NotificationType;
        message: string;
    }>({ isOpen: false, type: 'success', message: '' });

    const showNotification = (message: string, type: NotificationType = 'success') => {
        setNotification({ isOpen: true, type, message });
    };

    // 4. HELPERS
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCatOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    // --- HANDLERS: CREATE / EDIT / DELETE ---

    const handleCreate = () => {
        setFormMode('CREATE');
        if (filters.type === 'PACKAGE') {
            setEditingPackage(null);
            setIsPackageFormOpen(true);
        } else {
            setEditingService(null);
            setIsServiceFormOpen(true);
        }
    };

    const handleEdit = (id: string) => {
        setFormMode('EDIT');
        if (filters.type === 'PACKAGE') {
            const itemToEdit = data.find((d: any) => d.packageId === id) as PackageResponse;
            if (itemToEdit) {
                setEditingPackage(itemToEdit);
                setIsPackageFormOpen(true);
            }
        } else {
            const itemToEdit = data.find((d: any) => d.serviceCode === id) as AdminServiceResponse;
            if (itemToEdit) {
                setEditingService(itemToEdit);
                setIsServiceFormOpen(true);
            }
        }
    };

    const handleDelete = async (id: string) => {
        const typeName = filters.type === 'SERVICE' ? 'dịch vụ' : 'gói combo';
        if (window.confirm(`Bạn có chắc muốn xóa ${typeName} này? Hành động này không thể hoàn tác.`)) {
            try {
                if (filters.type === 'SERVICE') {
                    await deleteMasterService(id);
                } else {
                    await deletePackage(id);
                }
                showNotification(`Đã xóa ${typeName} thành công!`, "success");
            } catch (error) {
                showNotification(`Xóa thất bại. Có thể ${typeName} đang được sử dụng.`, "error");
            }
        }
    };

    // --- SUBMIT HANDLERS ---

    // 1. Submit Service Form
    const handleServiceSubmit = async (formData: any) => {
        setIsSubmitting(true);
        try {
            if (formMode === 'CREATE') {
                await createMasterService({
                    serviceCode: formData.serviceCode,
                    serviceName: formData.serviceName,
                    fixedPrice: formData.fixedPrice,
                    categoryId: formData.categoryId,
                    description: formData.description,
                    imageUrl: formData.imageUrl,
                    assignedCounterIds: formData.assignedCounterIds
                });
                showNotification("Tạo Master Service mới thành công!", "success");
            } else {
                if (editingService) {
                    await updateMasterService(editingService.serviceCode, {
                        serviceName: formData.serviceName,
                        unitPrice: formData.fixedPrice,
                        categoryId: formData.categoryId,
                        description: formData.description,
                        imageUrl: formData.imageUrl,
                        status: formData.status,
                        assignedCounterIds: formData.assignedCounterIds
                    });
                    showNotification("Cập nhật thông tin dịch vụ thành công!", "success");
                }
            }
            setIsServiceFormOpen(false);
        } catch (error: any) {
            console.error("Service Submit Error:", error);
            const msg = error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
            showNotification(`Thất bại: ${msg}`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2. [MỚI] Submit Package Form
    const handlePackageSubmit = async (formData: any) => {
        setIsSubmitting(true);
        try {
            if (formMode === 'CREATE') {
                await createPackage({
                    packageCode: formData.packageCode,
                    packageName: formData.packageName,
                    price: formData.price,
                    description: formData.description,
                    packageType: formData.packageType,
                    creditValue: formData.creditValue,
                    serviceIds: formData.serviceIds
                });
                showNotification("Tạo Gói Combo mới thành công!", "success");
            } else {
                if (editingPackage) {
                    await updatePackage(editingPackage.packageId, {
                        packageName: formData.packageName,
                        price: formData.price,
                        description: formData.description,
                        packageType: formData.packageType,
                        creditValue: formData.creditValue,
                        status: formData.status,
                        serviceIds: formData.serviceIds
                    });
                    showNotification("Cập nhật gói Combo thành công!", "success");
                }
            }
            setIsPackageFormOpen(false);
        } catch (error: any) {
            console.error("Package Submit Error:", error);
            const msg = error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
            showNotification(`Thất bại: ${msg}`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERS ---

    const getSelectedCategoryName = () => {
        if (!filters.categoryId) return "Tất cả danh mục";
        const cat = categories.find(c => c.categoryId === filters.categoryId);
        return cat ? cat.categoryName : "Tất cả danh mục";
    };

    const renderStatusBadge = (status: CatalogStatus) => {
        const config = CatalogStatusMap[status] || CatalogStatusMap[CatalogStatus.INACTIVE];
        const tailwindColors: Record<string, string> = {
            green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
            red: 'bg-red-500/10 border-red-500/20 text-red-400',
            orange: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
            gray: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
        };
        const style = tailwindColors[config.color] || tailwindColors.gray;

        return (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${style}`}>
                <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
                {config.label}
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-fadeIn flex flex-col h-full relative">

            <AdminNotification
                isOpen={notification.isOpen}
                type={notification.type}
                message={notification.message}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
            />

            {/* HEADER & FILTER BAR */}
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Catalog Management</h3>
                        <p className="text-white/60 text-sm mt-1">
                            {filters.type === 'SERVICE'
                                ? `Quản lý Dịch vụ Gốc & Phân phối (${totalItems} items)`
                                : `Quản lý Gói Combo (${totalItems} items)`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">
                                {filters.type === 'SERVICE' ? 'Add Master Service' : 'Add Package'}
                            </span>
                        </button>

                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}><ListIcon size={18} /></button>
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}><LayoutGrid size={18} /></button>
                        </div>

                        <button onClick={refresh} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* FILTER BAR */}
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center p-1">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setTabType('SERVICE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.type === 'SERVICE' ? 'bg-purple-500 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            <Layers size={16} /> <span>Master Services</span>
                        </button>
                        <button
                            onClick={() => setTabType('PACKAGE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.type === 'PACKAGE' ? 'bg-blue-500 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            <Package size={16} /> <span>Packages</span>
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto z-20">
                        {filters.type === 'SERVICE' && (
                            <div className="relative min-w-[220px]" ref={dropdownRef}>
                                <button onClick={() => setIsCatOpen(!isCatOpen)} className={`w-full flex items-center justify-between bg-white/5 border rounded-xl py-2 pl-3 pr-3 text-sm transition-all ${isCatOpen ? 'border-purple-500/50 text-white bg-white/10' : 'border-white/10 text-white/80 hover:bg-white/10'}`}>
                                    <div className="flex items-center gap-2 overflow-hidden"><Filter size={16} className={isCatOpen ? 'text-purple-400' : 'text-white/40'} /><span className="truncate">{getSelectedCategoryName()}</span></div><ChevronDown size={14} className={`text-white/40 transition-transform duration-200 ${isCatOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isCatOpen && (<div className="absolute top-full mt-2 left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50"><div className="max-h-[300px] overflow-y-auto py-1 custom-scrollbar"><button onClick={() => { setCategoryFilter(''); setIsCatOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${!filters.categoryId ? 'text-purple-400 bg-purple-500/10' : 'text-white/70'}`}><span>All Categories</span>{!filters.categoryId && <Check size={14} />}</button>{categories.map((cat) => (<button key={cat.categoryId} onClick={() => { setCategoryFilter(cat.categoryId); setIsCatOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-white/5 transition-colors border-t border-white/5 ${filters.categoryId === cat.categoryId ? 'text-purple-400 bg-purple-500/10' : 'text-white/70'}`}><span className="truncate">{cat.categoryName}</span>{filters.categoryId === cat.categoryId && <Check size={14} />}</button>))}</div></div>)}
                            </div>
                        )}
                        <div className="relative group flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" size={16} />
                            <input type="text" placeholder={filters.type === 'SERVICE' ? "Search service..." : "Search packages..."} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20" onChange={(e) => setSearch(e.target.value)}/>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="relative min-h-[300px] flex-grow z-0">
                {loading && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px] rounded-xl">
                        <Loader2 className="animate-spin text-purple-500 mb-2" size={32} />
                        <span className="text-white/60 text-sm">Loading data...</span>
                    </div>
                )}

                {!loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 border border-dashed border-white/10 rounded-xl text-white/40">
                        <Package size={48} className="mb-3 opacity-50" />
                        <p>No items found.</p>
                    </div>
                ) : (
                    <>
                        {/* VIEW 1: MASTER SERVICES */}
                        {filters.type === 'SERVICE' && viewMode === 'list' && (
                            <div className="overflow-hidden rounded-xl border border-white/10 animate-fadeIn">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 text-xs uppercase font-medium text-white/50">
                                    <tr>
                                        <th className="p-4 border-b border-white/10 w-12 text-center">#</th>
                                        <th className="p-4 border-b border-white/10">Service Info</th>
                                        <th className="p-4 border-b border-white/10">Category</th>
                                        <th className="p-4 border-b border-white/10">System Price</th>
                                        <th className="p-4 border-b border-white/10">Availability</th>
                                        <th className="p-4 border-b border-white/10 text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                    {data.map((item) => {
                                        const service = item as AdminServiceResponse;
                                        const validMerchants = service.merchants?.filter(m => m.merchantId && m.merchantName !== 'N/A') || [];
                                        const merchantCount = validMerchants.length;
                                        const isExpanded = expandedRows.has(service.serviceCode);
                                        const canExpand = merchantCount > 0;

                                        return (
                                            <div key={service.serviceCode} className="contents">
                                                <tr className={`hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer ${isExpanded ? 'bg-white/5 border-b-transparent' : ''}`} onClick={() => canExpand && toggleRow(service.serviceCode)}>
                                                    <td className="p-4 text-white/40 text-center">{canExpand ? (isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />) : (<div className="w-4 h-4 rounded-full bg-white/5 mx-auto" />)}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden flex-shrink-0"><img src={service.imageUrl || 'https://placehold.co/40x40?text=IMG'} alt="" className="w-full h-full object-cover" /></div>
                                                            <div><div className="font-bold text-white line-clamp-1">{service.serviceName}</div><div className="text-xs text-white/40 font-mono mt-0.5">{service.serviceCode}</div></div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-white/70"><span className="bg-white/5 px-2 py-1 rounded text-xs">{service.categoryName}</span></td>
                                                    <td className="p-4 font-medium text-white">{service.minPrice === service.maxPrice ? formatCurrency(service.minPrice) : <span className="text-purple-300">{formatCurrency(service.minPrice)} - {formatCurrency(service.maxPrice)}</span>}</td>
                                                    <td className="p-4"><div className="flex flex-col gap-1"><div>{renderStatusBadge(service.status)}</div><div className="flex items-center gap-2 text-xs mt-1"><div className={`p-1.5 rounded-full ${merchantCount > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/30'}`}><Store size={14} /></div><span className={merchantCount > 0 ? 'text-white' : 'text-white/40 italic'}>{merchantCount > 0 ? `${merchantCount} Merchants` : 'No active sellers'}</span></div></div></td>
                                                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleEdit(service.serviceCode)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors" title="Edit"><Edit size={16} /></button>
                                                            <button onClick={() => handleDelete(service.serviceCode)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors" title="Delete"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && canExpand && (<tr className="bg-white/[0.02] animate-in slide-in-from-top-1 fade-in duration-200"><td colSpan={6} className="p-0 border-b border-white/10"><div className="py-4 pl-[72px] pr-6"><div className="rounded-lg border border-white/10 overflow-hidden"><table className="w-full text-sm"><thead className="bg-black/20"><tr className="text-white/40 text-xs"><th className="py-2 px-4 text-left font-medium w-1/3">Merchant Info</th><th className="py-2 px-4 text-left font-medium">Counter</th><th className="py-2 px-4 text-left font-medium">Selling Price</th><th className="py-2 px-4 text-left font-medium">Status</th><th className="py-2 px-4 text-right font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/5">{validMerchants.map((m) => (<tr key={m.serviceId} className="hover:bg-white/5 transition-colors"><td className="py-3 px-4 text-white font-medium">{m.merchantName}</td><td className="py-3 px-4 text-white/60">{m.counterName}</td><td className="py-3 px-4 text-white font-mono">{formatCurrency(m.unitPrice)}</td><td className="py-3 px-4">{renderStatusBadge(m.status)}</td><td className="py-3 px-4 text-right"><button className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-center justify-end gap-1 ml-auto"><Eye size={12} /> Moderate</button></td></tr>))}</tbody></table></div></div></td></tr>)}
                                            </div>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* VIEW 2: PACKAGES */}
                        {filters.type === 'PACKAGE' && viewMode === 'list' && (
                            <div className="overflow-x-auto rounded-xl border border-white/10 animate-fadeIn">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 text-xs uppercase font-medium text-white/50">
                                    <tr>
                                        <th className="p-4 border-b border-white/10 w-12 text-center">#</th>
                                        <th className="p-4 border-b border-white/10">Combo Name</th>
                                        <th className="p-4 border-b border-white/10">Description</th>
                                        <th className="p-4 border-b border-white/10">Price</th>
                                        <th className="p-4 border-b border-white/10">Type</th>
                                        <th className="p-4 border-b border-white/10">Status</th>
                                        <th className="p-4 border-b border-white/10 text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                    {data.map((item) => {
                                        const pkg = item as PackageResponse;
                                        const isExpanded = expandedRows.has(pkg.packageId);
                                        const hasItems = pkg.items && pkg.items.length > 0;

                                        return (
                                            <div key={pkg.packageId} className="contents">
                                                <tr
                                                    className={`hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer ${isExpanded ? 'bg-white/5 border-b-transparent' : ''}`}
                                                    onClick={() => hasItems && toggleRow(pkg.packageId)}
                                                >
                                                    <td className="p-4 text-white/40 text-center">
                                                        {hasItems ? (
                                                            isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full bg-white/5 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400">
                                                                <Package size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-white">{pkg.packageName}</div>
                                                                <div className="text-xs text-white/40 font-mono mt-0.5">{pkg.packageCode}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-white/70 max-w-xs truncate">{pkg.description || '-'}</td>
                                                    <td className="p-4 font-bold text-white text-emerald-400">{formatCurrency(pkg.price)}</td>
                                                    <td className="p-4">
                                                        <span className="bg-blue-500/10 text-blue-300 px-2 py-1 rounded text-xs border border-blue-500/20">{pkg.packageType}</span>
                                                    </td>
                                                    <td className="p-4">{renderStatusBadge(pkg.status)}</td>
                                                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleEdit(pkg.packageId)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(pkg.packageId)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors" title="Delete">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {isExpanded && hasItems && (
                                                    <tr className="bg-white/[0.02] animate-in slide-in-from-top-1 fade-in duration-200">
                                                        <td colSpan={7} className="p-0 border-b border-white/10">
                                                            <div className="py-4 pl-[72px] pr-6">
                                                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                                    <h4 className="text-sm font-bold text-white/60 mb-3 flex items-center gap-2">
                                                                        <Layers size={16} /> Combo Items Details ({pkg.items.length})
                                                                    </h4>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                        {pkg.items.map((item, idx) => (
                                                                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                                                                                <div className="w-10 h-10 rounded bg-white/10 overflow-hidden flex-shrink-0">
                                                                                    {item.imageUrl ? (
                                                                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-xs text-white/30">IMG</div>
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-bold text-white/80 text-sm">{item.serviceName}</div>
                                                                                    <div className="text-xs text-white/50">{formatCurrency(item.originalPrice)}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </div>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* GRID VIEW FALLBACK */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeIn">
                                {data.map((item: any) => (
                                    <div key={item.serviceId || item.packageId} className="p-5 rounded-xl border border-white/10 bg-white/5 hover:border-purple-500/50 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden">
                                                <img src={item.imageUrl || ''} className="w-full h-full object-cover opacity-80" alt="" />
                                            </div>
                                            {renderStatusBadge(item.status)}
                                        </div>
                                        <h4 className="font-bold text-white text-lg mb-1">{item.serviceName || item.packageName}</h4>
                                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                            <div className="text-white font-bold">{formatCurrency(item.unitPrice || item.price || item.minPrice)}</div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(item.serviceId || item.packageId)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400"><Edit size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50">Page <span className="font-bold text-white">{filters.page + 1}</span> of <span className="font-bold text-white">{totalPages}</span></p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(0, filters.page - 1))}
                            disabled={filters.page === 0 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1 hidden sm:flex">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum = i;
                                if (totalPages > 5 && filters.page > 2) {
                                    pageNum = filters.page - 2 + i;
                                    if (pageNum >= totalPages) return null;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all
                                        ${filters.page === pageNum ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, filters.page + 1))}
                            disabled={filters.page >= totalPages - 1 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* FORM MODAL: SERVICE */}
            <AdminServiceForm
                isOpen={isServiceFormOpen}
                onClose={() => setIsServiceFormOpen(false)}
                onSubmit={handleServiceSubmit}
                categories={categories}
                mode={formMode}
                initialData={editingService}
            />

            {/* [MỚI] FORM MODAL: PACKAGE */}
            <AdminPackageForm
                isOpen={isPackageFormOpen}
                onClose={() => setIsPackageFormOpen(false)}
                onSubmit={handlePackageSubmit}
                mode={formMode}
                initialData={editingPackage}
            />
        </div>
    );
};

export default ServicesTable;