// types/user.type.ts

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    LOCKED = 'LOCKED',
    INACTIVE = 'INACTIVE',
    DELETED = 'DELETED',
}

export enum UserType {
    STUDENT = 'STUDENT',
    LECTURER = 'LECTURER',
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
    roles: string[];      // Backend trả về mảng tên role
    permissions: string[];
    imageUrl: string | null;
    qrPaymentUrl: string | null;
    creditBalance?: number;
}

// [CẬP NHẬT] Request Body cho Create (POST)
export interface CreateUserRequest {
    username: string;
    password?: string;
    email: string;
    fullName: string;
    phoneNumber?: string;

    // [THAY ĐỔI] Backend chỉ cần 1 role duy nhất, UserType tự sinh
    role: string;

    // [THAY ĐỔI] Không gửi userType nữa
    // userType: UserType; <-- Xóa dòng này

    imageUrl?: string; // URL ảnh sau khi upload
    qrPaymentUrl?: string;
}

// [CẬP NHẬT] Request Body cho Update (PUT)
export interface UpdateUserRequest {
    fullName?: string;
    phoneNumber?: string;
    imageUrl?: string;
    status?: UserStatus;

    // [THAY ĐỔI] Backend nhận 1 role duy nhất
    role?: string;

    qrPaymentUrl?: string;
    newPassword?: string;
}

// Filter Params
export interface UserFilterParams {
    page: number;
    size: number;
    keyword?: string;
    status?: UserStatus | null;
    role?: string | null;
    userType?: UserType | null;
    fromDate?: string;
    toDate?: string;
}

export interface UserListResponse {
    items: UserResponse[];
    totalItems: number;
    totalPages: number;
    page: number;
    size: number;
}