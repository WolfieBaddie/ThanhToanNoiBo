// Định nghĩa Response trả về từ Backend (ServiceResponse)
export interface ServiceResponse {
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    unitPrice: number;
    categoryName: string; // Backend đã map tên category vào đây
    imageUrl: string | null;
    description?: string;
}

// Định nghĩa Category
export interface ServiceCategory {
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    iconUrl?: string;
}

// Params gửi lên để lọc (Filter Request)
export interface CatalogFilterParams {
    page: number;
    size: number;
    keyword?: string;
    categoryId?: string; // UUID của category
    sortBy?: string;     // Mặc định 'createdAt'
    sortDir?: 'asc' | 'desc';
}

// Cấu trúc phân trang chung (Đồng bộ với transaction/voucher)
export interface PageResponse<T> {
    items: T[];          // Backend trả về content nhưng ta map sang items ở frontend cho chuẩn
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
}