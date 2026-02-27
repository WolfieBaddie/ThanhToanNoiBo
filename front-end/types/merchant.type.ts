// src/types/merchant.types.ts

// --- CÁC TYPE CŨ (GIỮ NGUYÊN) ---
export interface ServiceItem {
    id: number | string; // Cập nhật hỗ trợ string UUID
    name: string;
    price: number;
    image: string;
    category: string;
    isAvailable: boolean;
    description: string;
    masterServiceCode: string | null;
}

export interface MerchantCatalogFilterParams {
    page: number;
    size: number;
    keyword?: string;
    categoryId?: string;
    status?: string;
    system?: boolean;
    sortBy?: string;
    sortDir?: string;
}

export interface CreateServiceRequest {
    serviceCode: string;
    serviceName: string;
    unitPrice: number;
    categoryId: string;
    imageUrl?: string;
    masterServiceIds?: string[];
}

export interface UpdateServiceRequest {
    serviceName?: string;
    unitPrice?: number;
    imageUrl?: string;
    categoryId?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface PaginationState {
    pageNumber: number;
    totalPages: number;
    totalItems: number;
}

// --- [BỔ SUNG MỚI] TYPE CHO PACKAGE (COMBO) ---

export interface CreatePackageRequest {
    packageCode: string;
    packageName: string;
    price: number;
    description: string;
    packageType: string; // 'ITEM_QUANTITY', 'CREDIT_VALUE', 'MIXED'
    creditValue?: number | null;
    serviceIds: string[]; // List UUID các món ăn
}

export interface UpdatePackageRequest {
    packageName?: string;
    price?: number;
    description?: string;
    packageType?: string;
    creditValue?: number | null;
    status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
    serviceIds?: string[];
}

export interface Counter {
    counterId: string;
    counterCode: string;
    counterName: string;
    counterType: string;
    location?: string;
    deviceIdentifier?: string;
    status: 'ACTIVE' | 'INACTIVE'
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCounterRequest {
    counterCode: string;
    counterName: string;
    counterType: string;
    location?: string;
    deviceIdentifier?: string;
}

export interface UpdateCounterRequest {
    counterName?: string;
    location?: string;
    deviceIdentifier?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}