import React, { useState, useMemo, useEffect } from 'react';
import { Plus, LayoutGrid, LayoutList, Utensils, Package, ChevronLeft, ChevronRight, Store } from 'lucide-react';

// 1. Import Components
import { MerchantServiceFilter } from "@/components/merchant/MerchantServiceFilter";
import { MerchantServiceGrid } from "@/components/merchant/MerchantServiceGrid";
import { MerchantServiceForm, FormMode } from "@/components/merchant/MerchantServiceForm";
import { MerchantPackageForm } from "@/components/merchant/MerchantPackageForm";
import { Notification } from "@/components/ui/Notification";
// [MỚI] Import Component Quản lý Quầy
import { MerchantCounterManagement } from "@/components/merchant/MerchantCounterManagement";

// 2. Import Hooks & Services & Types
import { useMerchantCatalog } from '@/hooks/useMerchantCatalog';
import { merchantCatalogService } from '@/services/merchant.catalog.service';
import { ServiceResponse, PackageResponse } from '@/types/catalog.type';
// [KHÔI PHỤC] Giữ nguyên import DTO theo ý bạn
import { CreateServiceRequest, UpdateServiceRequest } from '@/types/merchant.type';
import { ServiceItem } from "@/types/merchant.types";

const MerchantServicePage: React.FC = () => {
    // --- HOOKS ---
    const {
        services,
        packages,
        activeTab,
        switchTab,
        categories,
        pagination,
        isLoading,
        isSystemMode,
        toggleSystemMode,
        handleSearch,
        filterByCategory,
        changePage,
        refresh,
        createPackage,
        updatePackage,
        deletePackage
    } = useMerchantCatalog();

    // --- LOCAL STATE ---
    const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [serviceFormMode, setServiceFormMode] = useState<FormMode>('CREATE');

    const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<PackageResponse | null>(null);
    const [packageFormMode, setPackageFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

    const [notiState, setNotiState] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    }>({ isOpen: false, type: 'success', message: '' });

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotiState({ isOpen: true, type, message });
    };

    // --- DATA MAPPING ---
    const mappedItems: ServiceItem[] = useMemo(() => {
        // [MỚI] Nếu là tab Counter thì trả về rỗng để không render Grid
        if (activeTab === 'COUNTER') return [];

        if (activeTab === 'SERVICE') {
            return services.map((s: ServiceResponse) => ({
                id: s.serviceId,
                name: s.serviceName,
                price: s.unitPrice,
                image: viewMode === 'list' ? '' : (s.imageUrl || ''),
                category: s.categoryName,
                isAvailable: s.status === 'ACTIVE',
                description: '',
                masterServiceCode: s.masterServiceCode || null,
            } as unknown as ServiceItem));
        } else {
            return packages.map((p: PackageResponse) => ({
                id: p.packageId,
                name: p.packageName,
                price: p.price,
                image: '',
                category: 'Combo',
                isAvailable: p.status === 'ACTIVE',
                description: p.description || '',
                masterServiceCode: null,
            } as unknown as ServiceItem));
        }
    }, [services, packages, activeTab, viewMode]);

    const serviceItemsForSelection = useMemo(() => {
        return services.map((s: ServiceResponse) => ({
            id: s.serviceId,
            name: s.serviceName,
            price: s.unitPrice,
            image: s.imageUrl || '',
            category: s.categoryName
        } as any));
    }, [services]);

    // --- EFFECTS ---
    useEffect(() => {
        const timer = setTimeout(() => handleSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        filterByCategory(selectedCategory);
    }, [selectedCategory]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
    };

    // --- HANDLERS ---
    const handleOpenCreate = () => {
        if (activeTab === 'PACKAGE') {
            setEditingPackage(null);
            setPackageFormMode('CREATE');
            setIsPackageFormOpen(true);
        } else if (activeTab === 'SERVICE') {
            setEditingService(null);
            setServiceFormMode('CREATE');
            setIsServiceFormOpen(true);
        }
    };

    const handleOpenEdit = (item: ServiceItem) => {
        if (activeTab === 'PACKAGE') {
            const pkg = packages.find(p => p.packageId === item.id);
            if (pkg) {
                setEditingPackage(pkg);
                setPackageFormMode('EDIT');
                setIsPackageFormOpen(true);
            } else {
                showNotification("Không tìm thấy thông tin gói combo.", "error");
            }
        } else {
            setEditingService(item);
            setServiceFormMode('EDIT');
            setIsServiceFormOpen(true);
        }
    };

    const handleOpenRegister = (item: ServiceItem) => {
        if (activeTab === 'PACKAGE') {
            showNotification("Chưa hỗ trợ đăng ký Combo hệ thống.", "info");
            return;
        }
        setEditingService(item);
        setServiceFormMode('REGISTER');
        setIsServiceFormOpen(true);
    };

    const handleDelete = async (id: number | string) => {
        if (window.confirm("Bạn có chắc muốn xóa mục này? Hành động này không thể hoàn tác.")) {
            try {
                if (activeTab === 'SERVICE') {
                    await merchantCatalogService.deleteService(String(id));
                } else {
                    await deletePackage(String(id));
                }
                showNotification("Đã xóa thành công.", "success");
                refresh();
            } catch (error) {
                showNotification("Không thể xóa mục này.", "error");
            }
        }
    };

    const handleToggleStatus = async (id: number | string) => {
        try {
            if (activeTab === 'SERVICE') {
                const item = services.find(s => s.serviceId === id);
                if (item) await merchantCatalogService.toggleServiceStatus(String(id), item.status);
            } else {
                showNotification("Vui lòng vào 'Sửa' để cập nhật trạng thái Combo.", "info");
                return;
            }
            refresh();
        } catch (error) {
            showNotification("Lỗi cập nhật trạng thái.", "error");
        }
    };

    const handleServiceSubmit = async (formData: Partial<ServiceItem>) => {
        setIsSubmitting(true);
        try {
            if (serviceFormMode === 'REGISTER' && formData.id) {
                await merchantCatalogService.createService({
                    masterServiceIds: [String(formData.id)],
                    serviceCode: `REG_${formData.id}`,
                    serviceName: formData.name || '',
                    unitPrice: Number(formData.price) || 0,
                    categoryId: formData.category || '',
                    imageUrl: formData.image || ''
                });
                showNotification("Đăng ký thành công!", "success");
            } else if (serviceFormMode === 'CREATE') {
                await merchantCatalogService.createService({
                    serviceCode: `REQ_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    serviceName: formData.name || '',
                    unitPrice: Number(formData.price) || 0,
                    categoryId: formData.category || '',
                    imageUrl: formData.image || '',
                    masterServiceIds: []
                });
                showNotification("Tạo món mới thành công!", "success");
            } else if (serviceFormMode === 'EDIT' && editingService) {
                await merchantCatalogService.updateService(String(editingService.id), {
                    serviceName: formData.name,
                    unitPrice: formData.price,
                    imageUrl: formData.image,
                    categoryId: formData.category,
                    status: formData.isAvailable ? 'ACTIVE' : 'INACTIVE'
                });
                showNotification("Cập nhật thành công!", "success");
            }
            refresh();
            setIsServiceFormOpen(false);
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || "Lỗi hệ thống.";
            showNotification(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePackageSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (packageFormMode === 'CREATE') {
                await createPackage(data);
                showNotification("Tạo gói Combo thành công!", "success");
            } else {
                if (editingPackage) {
                    await updatePackage(editingPackage.packageId, data);
                    showNotification("Cập nhật Combo thành công!", "success");
                }
            }
            setIsPackageFormOpen(false);
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || "Lỗi xử lý gói combo.";
            showNotification(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPageNumbers = () => {
        const { pageNumber, totalPages } = pagination;
        const current = pageNumber + 1;
        const delta = 1;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots.map((page, index) => {
            if (page === '...') {
                return <span key={`dots-${index}`} className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold">...</span>;
            }
            const pNum = page as number;
            return (
                <button
                    key={pNum}
                    onClick={() => changePage(pNum - 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                        pNum === current
                            ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                    {pNum}
                </button>
            );
        });
    };

    return (
        <div className="space-y-6 pb-20 relative">
            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                        {isSystemMode ? 'Kho Hệ Thống' : 'Quản Lý Thực Đơn'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {isSystemMode
                            ? 'Đăng ký bán các món ăn hoặc gói combo có sẵn.'
                            : 'Quản lý danh sách món ăn, combo và quầy hàng.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">

                    {/* TAB SWITCHER */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => switchTab('SERVICE')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'SERVICE'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            <Utensils size={16} /> Món ăn
                        </button>
                        <button
                            onClick={() => switchTab('PACKAGE')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'PACKAGE'
                                    ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            <Package size={16} /> Combo
                        </button>

                        {/* [MỚI] Nút Tab Quầy Hàng */}
                        <button
                            onClick={() => switchTab('COUNTER')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'COUNTER'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            <Store size={16} /> Quầy hàng
                        </button>
                    </div>

                    {/* VIEW MODE SWITCHER (Ẩn khi ở tab Counter) */}
                    {activeTab !== 'COUNTER' && (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                <LayoutList size={20} />
                            </button>
                            <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                    )}

                    {/* Create Button (Ẩn khi ở tab Counter vì Counter quản lý riêng) */}
                    {!isSystemMode && activeTab !== 'COUNTER' && (
                        <button
                            onClick={handleOpenCreate}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold shadow-lg transition-transform active:scale-95 text-white
                                ${activeTab === 'SERVICE'
                                ? 'bg-slate-900 hover:bg-black shadow-slate-900/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`
                            }
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">
                                {activeTab === 'SERVICE' ? 'Tạo món mới' : 'Tạo Combo'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* --- BODY CONTENT --- */}

            {activeTab === 'COUNTER' ? (
                // [MỚI] Hiển thị Component Quản lý Quầy
                <MerchantCounterManagement />
            ) : (
                // Hiển thị Grid Service/Package cũ
                <>
                    <MerchantServiceFilter
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                        categories={categories} isSystemMode={isSystemMode}
                        onToggleSystemMode={toggleSystemMode} onClear={handleClearFilters}
                    />

                    <MerchantServiceGrid
                        items={mappedItems}
                        isLoading={isLoading}
                        isSystemMode={isSystemMode}
                        viewMode={viewMode}
                        onEdit={isSystemMode ? handleOpenRegister : handleOpenEdit}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        onClearFilters={handleClearFilters}
                        onOpenCreate={handleOpenCreate}
                    />

                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8 pb-10">
                            <button
                                onClick={() => changePage(pagination.pageNumber - 1)}
                                disabled={pagination.pageNumber === 0}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {renderPageNumbers()}

                            <button
                                onClick={() => changePage(pagination.pageNumber + 1)}
                                disabled={pagination.pageNumber >= pagination.totalPages - 1}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* 5. MODALS */}
            <MerchantServiceForm
                isOpen={isServiceFormOpen}
                onClose={() => setIsServiceFormOpen(false)}
                onSubmit={handleServiceSubmit}
                initialData={editingService}
                categories={categories}
                isSubmitting={isSubmitting}
                mode={serviceFormMode}
            />

            <MerchantPackageForm
                isOpen={isPackageFormOpen}
                onClose={() => setIsPackageFormOpen(false)}
                onSubmit={handlePackageSubmit}
                availableServices={serviceItemsForSelection}
                isSubmitting={isSubmitting}
                mode={packageFormMode}
                initialData={editingPackage}
            />

            <Notification
                isOpen={notiState.isOpen} type={notiState.type}
                message={notiState.message} onClose={() => setNotiState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default MerchantServicePage;