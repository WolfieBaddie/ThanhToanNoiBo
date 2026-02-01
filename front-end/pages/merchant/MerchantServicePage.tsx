import React, { useState, useMemo, useEffect } from 'react';
import { Plus, LayoutGrid, LayoutList, Utensils, Package, Layers } from 'lucide-react';

// 1. Import Components
import { MerchantServiceFilter } from "@/components/merchant/MerchantServiceFilter";
import { MerchantServiceGrid } from "@/components/merchant/MerchantServiceGrid";
import { MerchantServiceForm, FormMode } from "@/components/merchant/MerchantServiceForm";
import { MerchantPackageForm } from "@/components/merchant/MerchantPackageForm"; // Form Combo
import { Notification } from "@/components/ui/Notification";

// 2. Import Hooks & Services & Types
import { useMerchantCatalog } from '@/hooks/useMerchantCatalog';
import { merchantCatalogService } from '@/services/merchant.catalog.service';
import { ServiceResponse, PackageResponse } from '@/types/catalog.type';
import { CreateServiceRequest, UpdateServiceRequest } from '@/types/merchant.type';
import { ServiceItem } from "@/types/merchant.types";

const MerchantServicePage: React.FC = () => {
    // --- HOOKS (Lấy dữ liệu & Actions từ API) ---
    const {
        services,           // Danh sách món ăn
        packages,           // Danh sách gói combo
        activeTab,          // 'SERVICE' | 'PACKAGE'
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

        // Actions cho Package
        createPackage,
        updatePackage,
        deletePackage
    } = useMerchantCatalog();

    // --- LOCAL STATE ---

    // 1. State cho Form Món ăn (Service)
    const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [serviceFormMode, setServiceFormMode] = useState<FormMode>('CREATE');

    // 2. State cho Form Combo (Package)
    const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<PackageResponse | null>(null);
    const [packageFormMode, setPackageFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');

    // 3. UI State chung
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

    // 4. Notification State
    const [notiState, setNotiState] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    }>({ isOpen: false, type: 'success', message: '' });

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotiState({ isOpen: true, type, message });
    };

    // --- DATA MAPPING ---

    // Map dữ liệu (Service hoặc Package) về dạng chuẩn để hiển thị lên Grid
    const mappedItems: ServiceItem[] = useMemo(() => {
        if (activeTab === 'SERVICE') {
            return services.map((s: ServiceResponse) => ({
                id: s.serviceId,
                name: s.serviceName,
                price: s.unitPrice,
                image: s.imageUrl || '',
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
                image: '', // Package chưa có ảnh đại diện
                category: 'Combo',
                isAvailable: p.status === 'ACTIVE',
                description: p.description || '',
                masterServiceCode: null,
            } as unknown as ServiceItem));
        }
    }, [services, packages, activeTab]);

    // Danh sách món ăn dùng để chọn trong Form Combo
    const serviceItemsForSelection: ServiceItem[] = useMemo(() => {
        return services.map((s: ServiceResponse) => ({
            id: s.serviceId,
            name: s.serviceName,
            price: s.unitPrice,
            image: s.imageUrl || '',
            category: s.categoryName,
            isAvailable: s.status === 'ACTIVE',
            description: '',
            masterServiceCode: s.masterServiceCode || null,
        } as unknown as ServiceItem));
    }, [services]);

    // --- SYNC FILTER LOGIC ---
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

    // --- HANDLERS: OPEN FORMS ---

    // 1. Mở form Tạo mới (Tùy theo tab đang đứng)
    const handleOpenCreate = () => {
        if (activeTab === 'PACKAGE') {
            setEditingPackage(null);
            setPackageFormMode('CREATE');
            setIsPackageFormOpen(true);
        } else {
            setEditingService(null);
            setServiceFormMode('CREATE');
            setIsServiceFormOpen(true);
        }
    };

    // 2. Mở form Sửa (Edit)
    const handleOpenEdit = (item: ServiceItem) => {
        if (activeTab === 'PACKAGE') {
            // Tìm lại object PackageResponse gốc từ danh sách packages để lấy đủ thông tin (gồm items bên trong)
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

    // 3. Mở form Đăng ký (Chỉ cho Service hệ thống)
    const handleOpenRegister = (item: ServiceItem) => {
        if (activeTab === 'PACKAGE') {
            showNotification("Chưa hỗ trợ đăng ký Combo hệ thống.", "info");
            return;
        }
        setEditingService(item);
        setServiceFormMode('REGISTER');
        setIsServiceFormOpen(true);
    };

    // --- HANDLERS: ACTIONS ---

    const handleDelete = async (id: number | string) => {
        if (window.confirm("Bạn có chắc muốn xóa mục này? Hành động này không thể hoàn tác.")) {
            try {
                if (activeTab === 'SERVICE') {
                    await merchantCatalogService.deleteService(String(id));
                } else {
                    await deletePackage(String(id)); // Gọi action từ Hook
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
                // Với Package, trạng thái thường được sửa trong Form Edit, nhưng nếu muốn toggle nhanh:
                showNotification("Vui lòng vào 'Sửa' để cập nhật trạng thái Combo.", "info");
                return;
            }
            refresh();
        } catch (error) {
            showNotification("Lỗi cập nhật trạng thái.", "error");
        }
    };

    // --- SUBMIT HANDLERS ---

    // 1. Submit Form Service (Món ăn)
    const handleServiceSubmit = async (formData: Partial<ServiceItem>) => {
        setIsSubmitting(true);
        try {
            if (serviceFormMode === 'REGISTER' && formData.id) {
                const payload: CreateServiceRequest = {
                    masterServiceIds: [String(formData.id)],
                    serviceCode: `REG_${formData.id}`,
                    serviceName: formData.name || '',
                    unitPrice: Number(formData.price) || 0,
                    categoryId: formData.category || '',
                    imageUrl: formData.image || ''
                };
                await merchantCatalogService.createService(payload);
                showNotification("Đăng ký thành công!", "success");
            } else if (serviceFormMode === 'CREATE') {
                const payload: CreateServiceRequest = {
                    serviceCode: `REQ_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    serviceName: formData.name || '',
                    unitPrice: Number(formData.price) || 0,
                    categoryId: formData.category || '',
                    imageUrl: formData.image || '',
                    masterServiceIds: []
                };
                await merchantCatalogService.createService(payload);
                showNotification("Tạo món mới thành công!", "success");
            } else if (serviceFormMode === 'EDIT' && editingService) {
                const payload: UpdateServiceRequest = {
                    serviceName: formData.name,
                    unitPrice: formData.price,
                    imageUrl: formData.image,
                    categoryId: formData.category,
                    status: formData.isAvailable ? 'ACTIVE' : 'INACTIVE'
                };
                await merchantCatalogService.updateService(String(editingService.id), payload);
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

    // 2. Submit Form Package (Combo)
    const handlePackageSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (packageFormMode === 'CREATE') {
                // data đã đúng format CreatePackageRequest
                await createPackage(data);
                showNotification("Tạo gói Combo thành công!", "success");
            } else {
                if (editingPackage) {
                    // data đã đúng format UpdatePackageRequest
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
                            : 'Quản lý danh sách món ăn, combo và trạng thái kinh doanh.'}
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
                    </div>

                    {/* VIEW MODE */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <LayoutList size={20} />
                        </button>
                        <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <LayoutGrid size={20} />
                        </button>
                    </div>

                    {/* CREATE BUTTON */}
                    {!isSystemMode && (
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

            {/* 2. FILTER */}
            <MerchantServiceFilter
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                categories={categories} isSystemMode={isSystemMode}
                onToggleSystemMode={toggleSystemMode} onClear={handleClearFilters}
            />

            {/* 3. GRID */}
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

            {/* 4. PAGINATION */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <span className="text-sm text-slate-500 self-center">
                        Trang {pagination.pageNumber + 1} / {pagination.totalPages}
                     </span>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.pageNumber === 0}
                            onClick={() => changePage(pagination.pageNumber - 1)}
                            className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium"
                        >Prev</button>
                        <button
                            disabled={pagination.pageNumber >= pagination.totalPages - 1}
                            onClick={() => changePage(pagination.pageNumber + 1)}
                            className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium"
                        >Next</button>
                    </div>
                </div>
            )}

            {/* 5. FORM MODALS */}

            {/* Form tạo/sửa Món ăn */}
            <MerchantServiceForm
                isOpen={isServiceFormOpen}
                onClose={() => setIsServiceFormOpen(false)}
                onSubmit={handleServiceSubmit}
                initialData={editingService}
                categories={categories}
                isSubmitting={isSubmitting}
                mode={serviceFormMode}
            />

            {/* Form tạo/sửa Gói Combo */}
            <MerchantPackageForm
                isOpen={isPackageFormOpen}
                onClose={() => setIsPackageFormOpen(false)}
                onSubmit={handlePackageSubmit}
                availableServices={serviceItemsForSelection} // Truyền danh sách món để chọn
                isSubmitting={isSubmitting}
                mode={packageFormMode}        // CREATE | EDIT
                initialData={editingPackage}  // Dữ liệu cũ nếu đang Edit
            />

            {/* 6. NOTIFICATION */}
            <Notification
                isOpen={notiState.isOpen} type={notiState.type}
                message={notiState.message} onClose={() => setNotiState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default MerchantServicePage;