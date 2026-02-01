// types/user.type.ts

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    LOCKED = 'LOCKED',
    INACTIVE = 'INACTIVE',
    DELETED = 'DELETED', // Bổ sung status DELETED
    SUSPENDED = 'SUSPENDED'
}

export enum UserType {
    STUDENT = 'STUDENT',
    LECTURER = 'LECTURER', // Nếu hệ thống có
    MERCHANT = 'MERCHANT',
    ADMIN = 'ADMIN',
    USER = 'USER'
}

// Response hiển thị (GET)
export interface UserResponse {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    userType: UserType;
    status: UserStatus;
    username: string;
    lastLoginAt: string | null;
    createdAt: string;
    roles: string[];
    permissions: string[];
    imageUrl: string | null;
    qrPaymentUrl: string | null;
    creditBalance?: number; // Bổ sung số dư ví nếu backend trả về
}

// [MỚI] Request Body cho Create (POST)
export interface CreateUserRequest {
    username: string;
    password?: string; // Optional nếu tạo Merchant thì có thể random password ở FE hoặc BE xử lý
    email: string;
    fullName: string;
    phoneNumber?: string;
    userType: UserType;
    roles?: string[]; // VD: ["ADMIN", "MERCHANT"]
    qrPaymentUrl?: string; // Dành cho Merchant
}

// [MỚI] Request Body cho Update (PUT)
export interface UpdateUserRequest {
    fullName?: string;
    phoneNumber?: string;
    imageUrl?: string;
    status?: UserStatus;
    roles?: string[];
    qrPaymentUrl?: string;
    newPassword?: string; // Nếu Admin muốn reset pass cho user
}

// Filter Params
export interface UserFilterParams {
    page: number;
    size: number;
    keyword?: string;
    status?: UserStatus | null;
    role?: string | null;
    userType?: UserType | null; // [QUAN TRỌNG] Filter theo loại user
    fromDate?: string;
    toDate?: string;
}

// Page Response
export interface UserListResponse {
    items: UserResponse[];
    totalItems: number;
    totalPages: number;
    page: number;
    size: number;
}