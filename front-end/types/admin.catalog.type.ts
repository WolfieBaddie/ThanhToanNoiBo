// Enums
export enum CatalogStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING',
    DELETED = 'DELETED',
}

// Common Responses
export interface PageResponse<T> {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    items: T[];
}

export interface BaseResponse<T> {
    code: number;
    message: string;
    data: T;
}

// Filters
export interface ServiceFilterParams {
    keyword?: string;
    status?: CatalogStatus;
    categoryId?: string;
    system?: boolean;
    page?: number;
    size?: number;
}

// --- DTOs ---

// 1. Category
export interface Category { // ServiceCategory
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    description: string;
    iconUrl: string;
    status: CatalogStatus;
}
export type ServiceCategory = Category;

export interface CreateCategoryRequest {
    categoryCode: string;
    categoryName: string;
    description?: string;
    iconUrl?: string;
}

export interface UpdateCategoryRequest {
    categoryName?: string;
    description?: string;
    iconUrl?: string;
    status?: CatalogStatus;
}

// 2. Services

// [MỚI] Type Response cho View Catalog
export interface AdminServiceResponse {
    serviceCode: string;
    serviceName: string;
    imageUrl: string;
    description: string;
    categoryName: string;
    status: CatalogStatus;
    minPrice: number;
    maxPrice: number;
    merchants: MerchantInfo[];
}

export interface MerchantInfo {
    merchantId: string;
    merchantName: string;
    counterId?: string; // [BỔ SUNG] Cần ID này để map với assignedCounterIds
    counterName: string;
    serviceId: string;
    unitPrice: number;
    status: CatalogStatus;
}

// Entity Master Service
export interface MasterService {
    masterId: string;
    serviceCode: string;
    serviceName: string;
    fixedPrice: number;
    imageUrl: string;
    description: string;
    status: CatalogStatus;
    category: Category;
}

export interface AppService {
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    unitPrice: number;
    imageUrl: string;
    status: CatalogStatus;
    categoryName: string;
}

// Requests
export interface CreateMasterServiceRequest {
    serviceCode: string;
    serviceName: string;
    fixedPrice: number;
    categoryId: string;
    description?: string;
    imageUrl?: string;

    // [BỔ SUNG QUAN TRỌNG]
    assignedCounterIds?: string[];
}

export interface UpdateServiceRequest {
    serviceName?: string;
    unitPrice?: number;
    imageUrl?: string;
    description?: string;
    categoryId?: string;
    status?: CatalogStatus;

    // [BỔ SUNG QUAN TRỌNG]
    assignedCounterIds?: string[];
}

// 3. Packages
export interface PackageServiceItem {
    serviceId: string;
    serviceName: string;
    imageUrl: string;
    originalPrice: number;
}

export interface PackageResponse {
    packageId: string;
    packageCode: string;
    packageName: string;
    description: string;
    price: number;
    packageType: string;
    creditValue: number;
    status: CatalogStatus;
    items: PackageServiceItem[];
}
export type AppPackage = PackageResponse;

// [CẬP NHẬT] Create Request
export interface CreatePackageRequest {
    packageCode: string;
    packageName: string;

    // Backend yêu cầu @NotBlank -> Frontend phải bắt buộc (bỏ dấu ?)
    description: string;

    price: number;
    packageType: string;
    creditValue: number; // Backend cho phép null nhưng logic gói thường cần
    serviceIds: string[];
}

// [CẬP NHẬT] Update Request - Bổ sung các trường thiếu
export interface UpdatePackageRequest {
    packageName?: string;
    description?: string;
    price?: number;
    status?: CatalogStatus;
    serviceIds?: string[];

    // [BỔ SUNG] Để đồng bộ với Backend UpdatePackageRequest.java
    packageType?: string;
    creditValue?: number;
}

export const CatalogStatusMap: Record<CatalogStatus, { label: string; color: string; badge: "success" | "error" | "warning" | "default" }> = {
    [CatalogStatus.ACTIVE]: {
        label: 'Đang hoạt động',
        color: 'green',
        badge: 'success'
    },
    [CatalogStatus.INACTIVE]: {
        label: 'Ngừng hoạt động',
        color: 'red',
        badge: 'error'
    },
    [CatalogStatus.PENDING]: {
        label: 'Chờ duyệt',
        color: 'orange',
        badge: 'warning'
    },
    [CatalogStatus.DELETED]: {
        label: 'Đã xóa',
        color: 'gray',
        badge: 'default'
    }
};