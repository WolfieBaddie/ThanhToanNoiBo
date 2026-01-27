// catalog.type.ts

// 1. Định nghĩa Type discriminator
export type CatalogItemType = 'SERVICE' | 'PACKAGE';

// 2. Định nghĩa chi tiết Service trong Package (nếu cần hiển thị list con)
export interface PackageServiceItem {
    serviceId: string;
    serviceName: string;
    imageUrl: string | null;
    originalPrice: number;
}

// 3. Update ServiceResponse thêm trường type
export interface ServiceResponse {
    type: 'SERVICE';
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    unitPrice: number;
    categoryName: string;
    imageUrl: string | null;
    description?: string;

    active: boolean;


    detailId?: string;
    remainingQuantity?: number;
}
// 4. Định nghĩa PackageResponse mới
export interface PackageResponse {
    type: 'PACKAGE'; // Định danh cứng
    packageId: string;
    packageCode: string;
    packageName: string;
    description?: string;
    price: number;
    packageType: string; // 'CREDIT_VALUE', 'item_quantity'...
    creditValue: number;
    isActive: boolean;
    items: PackageServiceItem[]; // Danh sách món trong gói
}

// 5. Union Type để dùng chung trong list hiển thị
export type CatalogItem = ServiceResponse | PackageResponse;

// --- CÁC PHẦN DƯỚI GIỮ NGUYÊN ---

export interface ServiceCategory {
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    iconUrl?: string;
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