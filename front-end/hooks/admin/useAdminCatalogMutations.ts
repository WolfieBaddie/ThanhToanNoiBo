import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCatalogService } from '@/services/admin/admin.catalog.service';
import {
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CreatePackageRequest,
    UpdatePackageRequest,
    CatalogStatus
} from '@/types/admin.catalog.type';

// Import Type mới
import {
    CreateMasterServiceRequest,
    UpdateMasterServiceRequest
} from '@/types/admin.service.type';

const KEYS = {
    CATALOG: ['admin', 'catalog'],
    CATEGORIES: ['categories']
};

export const useAdminCatalogMutations = () => {
    const queryClient = useQueryClient();

    const refreshCatalog = () => {
        queryClient.invalidateQueries({ queryKey: KEYS.CATALOG });
        queryClient.invalidateQueries({ queryKey: KEYS.CATEGORIES });
    };

    // =========================================================================
    // 1. MASTER SERVICES
    // =========================================================================

    const createMasterServiceMutation = useMutation({
        mutationFn: (data: CreateMasterServiceRequest) =>
            adminCatalogService.createMasterService(data),
        onSuccess: refreshCatalog
    });

    const updateMasterServiceMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMasterServiceRequest }) =>
            adminCatalogService.updateMasterService(id, data),
        onSuccess: refreshCatalog
    });

    const deleteMasterServiceMutation = useMutation({
        mutationFn: (id: string) => adminCatalogService.deleteMasterService(id),
        onSuccess: refreshCatalog
    });

    // =========================================================================
    // 2. MODERATION
    // =========================================================================

    const approveMerchantServiceMutation = useMutation({
        mutationFn: (id: string) =>
            adminCatalogService.toggleMerchantServiceStatus(id, CatalogStatus.ACTIVE),
        onSuccess: refreshCatalog
    });

    // [FIXED] Gọi đúng hàm toggleMerchantServiceStatus
    const rejectMerchantServiceMutation = useMutation({
        mutationFn: (id: string) =>
            adminCatalogService.toggleMerchantServiceStatus(id, CatalogStatus.INACTIVE),
        onSuccess: refreshCatalog
    });

    // =========================================================================
    // 3. PACKAGES
    // =========================================================================

    const createPackageMutation = useMutation({
        mutationFn: (data: CreatePackageRequest) => adminCatalogService.createPackage(data),
        onSuccess: refreshCatalog
    });

    const updatePackageMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePackageRequest }) =>
            adminCatalogService.updatePackage(id, data),
        onSuccess: refreshCatalog
    });

    const deletePackageMutation = useMutation({
        mutationFn: (id: string) => adminCatalogService.deletePackage(id),
        onSuccess: refreshCatalog
    });

    // =========================================================================
    // 4. CATEGORIES
    // =========================================================================

    const createCategoryMutation = useMutation({
        mutationFn: (data: CreateCategoryRequest) => adminCatalogService.createCategory(data),
        onSuccess: refreshCatalog
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
            adminCatalogService.updateCategory(id, data),
        onSuccess: refreshCatalog
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => adminCatalogService.deleteCategory(id),
        onSuccess: refreshCatalog
    });

    // =========================================================================
    // RETURN WRAPPER FUNCTIONS (Để khớp với ServicesTable)
    // =========================================================================
    return {
        // Master Service
        createMasterService: (data: CreateMasterServiceRequest) => createMasterServiceMutation.mutateAsync(data),
        updateMasterService: (id: string, data: UpdateMasterServiceRequest) => updateMasterServiceMutation.mutateAsync({ id, data }),
        deleteMasterService: (id: string) => deleteMasterServiceMutation.mutateAsync(id),

        // Moderation
        approveMerchantService: (id: string) => approveMerchantServiceMutation.mutateAsync(id),
        rejectMerchantService: (id: string) => rejectMerchantServiceMutation.mutateAsync(id),

        // Package
        createPackage: (data: CreatePackageRequest) => createPackageMutation.mutateAsync(data),
        updatePackage: (id: string, data: UpdatePackageRequest) => updatePackageMutation.mutateAsync({ id, data }),
        deletePackage: (id: string) => deletePackageMutation.mutateAsync(id),

        // Category
        createCategory: (data: CreateCategoryRequest) => createCategoryMutation.mutateAsync(data),
        updateCategory: (id: string, data: UpdateCategoryRequest) => updateCategoryMutation.mutateAsync({ id, data }),
        deleteCategory: (id: string) => deleteCategoryMutation.mutateAsync(id),

        refreshCatalog
    };
};