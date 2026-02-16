export type CatalogStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'PENDING';

export type CatalogItemType = 'SERVICE' | 'PACKAGE';

// Định nghĩa chi tiết các tùy chọn (Option) của Service
// Tương ứng với class ServiceOption trong UserServiceResponse.java
export interface ServiceOption {
    serviceId: string;
    unitPrice: number;
    counterId: string | null;
    counterName: string;
    location: string;
    merchantName: string;
    status: CatalogStatus;
    remainingQuantity: number;
}

// Cập nhật ServiceResponse theo cấu trúc mới
export interface ServiceResponse {
    type: 'SERVICE'; // Frontend tự thêm để phân biệt

    masterServiceCode: string; // Key gom nhóm
    serviceName: string;
    categoryName: string;
    imageUrl: string | null;
    description?: string;

    // Thống kê giá
    minPrice: number;
    maxPrice: number;

    // Danh sách các quầy bán (ServiceOption)
    options: ServiceOption[];
}

export interface PackageServiceItem {
    serviceId: string;
    serviceName: string;
    imageUrl: string | null;
    originalPrice: number;
}

export interface PackageResponse {
    type: 'PACKAGE';
    packageId: string;
    packageCode: string;
    packageName: string;
    description?: string;
    price: number;
    packageType: string;
    comboType?: 'ALL_INCLUSIVE' | 'SELECT_ONE';
    creditValue: number;
    imageUrl?: string;
    status: CatalogStatus;
    items: PackageServiceItem[];
    // Info merchant nếu cần
    merchantInfo?: {
        counterId: string;
        counterName: string;
        location: string;
        merchantId: string;
        merchantName: string;
    };
}

export type CatalogItem = ServiceResponse | PackageResponse;

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
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    items: T[];
}