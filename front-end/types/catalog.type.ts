export type CatalogStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'PENDING';

// 1. Định nghĩa Type discriminator
export type CatalogItemType = 'SERVICE' | 'PACKAGE';

// 2. Định nghĩa chi tiết Service trong Package
export interface PackageServiceItem {
    serviceId: string;
    serviceName: string;
    imageUrl: string | null;
    originalPrice: number;
}

// 3. Update ServiceResponse: Thay 'active' bằng 'status'
export interface ServiceResponse {
    type: 'SERVICE';
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    unitPrice: number;
    categoryName: string;
    imageUrl: string | null;
    description?: string;

    status: CatalogStatus;
    masterServiceCode?: string;

    detailId?: string;
    remainingQuantity?: number;
}

// 4. Update PackageResponse: Thay 'isActive' bằng 'status'
export interface PackageResponse {
    type: 'PACKAGE';
    packageId: string;
    packageCode: string;
    packageName: string;
    description?: string;
    price: number;
    packageType: string; // 'CREDIT_VALUE', 'ITEM_QUANTITY', 'MIXED'
    creditValue: number;
    imageUrl?:string;
    status: CatalogStatus;

    items: PackageServiceItem[];
}

// 5. Union Type để dùng chung trong list hiển thị
export type CatalogItem = ServiceResponse | PackageResponse;

// --- CÁC PHẦN DƯỚI GIỮ NGUYÊN ---

export interface ServiceCategory {
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    iconUrl?: string;
    status?: CatalogStatus;
}

export interface CatalogFilterParams {
    page: number;
    size: number;
    keyword?: string;
    categoryId?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export interface PageResponse<T> {
    items: T[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
}