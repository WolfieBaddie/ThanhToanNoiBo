// 1. Enum giống Backend
export enum UserStatus {
    ACTIVE = 'ACTIVE',
    LOCKED = 'LOCKED',
    INACTIVE = 'INACTIVE'
}

export enum UserType {
    STUDENT = 'STUDENT',
    LECTURER = 'LECTURER',
    MERCHANT = 'MERCHANT',
    ADMIN = 'ADMIN'
}

// 2. User Response (Khớp với UserResponse.java)
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
    roles: string[];      // Backend trả Set<String> -> JS nhận mảng string[]
    permissions: string[]; // Backend trả Set<String>
    imageUrl: string | null;
}

// 3. Filter Params (Khớp với AdminUserController)
export interface UserFilterParams {
    page: number;
    size: number;
    keyword?: string;
    status?: UserStatus | null;
    role?: string | null;
    fromDate?: string;
    toDate?: string;
}

// 4. Page Response (Wrap chung cho List)
export interface UserListResponse {
    items: UserResponse[];
    totalItems: number;
    totalPages: number;
    page: number;
    size: number;
}