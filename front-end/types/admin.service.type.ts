import { CatalogStatus } from './catalog.type';

// --- REQUESTS ---

export interface CreateMasterServiceRequest {
    serviceCode: string;
    serviceName: string;
    fixedPrice: number;
    categoryId: string;
    description?: string;
    imageUrl?: string;

    // [QUAN TRỌNG] Danh sách ID quầy hàng được chỉ định bán món này (Sync/Assign)
    assignedCounterIds?: string[];
}

export interface UpdateMasterServiceRequest {
    serviceName?: string;
    unitPrice?: number;   // Backend map vào fixedPrice
    imageUrl?: string;
    description?: string;
    categoryId?: string;
    status?: CatalogStatus;

    // [QUAN TRỌNG] Danh sách ID quầy hàng được chỉ định bán món này (Sync/Assign)
    assignedCounterIds?: string[];
}

// --- RESPONSES ---

// Trả về khi Tạo/Sửa Master Service
export interface MasterServiceResponse {
    masterId: string;
    serviceCode: string;
    serviceName: string;
    fixedPrice: number;
    imageUrl: string;
    description: string;
    status: CatalogStatus;
    category: {
        categoryId: string;
        categoryName: string;
    };
}

// Trả về khi Toggle Status Merchant Service (Map full theo ServiceResponse từ Backend)
export interface MerchantServiceStatusResponse {
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    unitPrice: number;
    categoryName: string;
    imageUrl: string | null;
    status: CatalogStatus;
}