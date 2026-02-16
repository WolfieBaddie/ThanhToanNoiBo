import { UserStatus } from "./user.type";
import { CatalogStatus } from "./admin.catalog.type";
import { UpdateServiceRequest, UpdatePackageRequest } from "./admin.catalog.type";
// --- RESPONSE TYPES ---

export interface MerchantCounterInfo {
    counterId: string;
    counterName: string;
    location: string;
    counterCode: string;
    status: string;
}

export interface MerchantItemInfo {
    itemId: string;
    itemCode: string;
    itemName: string;
    price: number;
    status: CatalogStatus;
    imageUrl: string | null;
    type: 'SERVICE' | 'PACKAGE';
}

export interface AdminMerchantDetailResponse {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    userStatus: UserStatus;
    counter: MerchantCounterInfo | null;
    services: MerchantItemInfo[];
    packages: MerchantItemInfo[];
}

export interface MerchantSummaryResponse {
    userId: string;
    fullName: string;
    username: string;
    email: string;
    phoneNumber: string;
    status: UserStatus;
    imageUrl: string | null;
    createdAt: string;
    counterName: string;
    counterLocation: string;
    totalServices: number;
    totalPackages: number;
}

// --- REQUEST TYPES ---

export interface UpdateCounterRequest {
    counterName: string;
    location: string;
    status?: string;
}

export interface UpdateMerchantItemStatusRequest {
    status: CatalogStatus;
    reason?: string;
}

export interface MerchantFilterParams {
    page: number;
    size: number;
    keyword?: string;
    status?: UserStatus | null;
}

export type { UpdateServiceRequest, UpdatePackageRequest };