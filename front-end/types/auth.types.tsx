import { UserStatus, UserRole } from './common.types';

export enum UserType {
    USER = 'USER',
    MERCHANT = 'MERCHANT',
    ADMIN = 'ADMIN'
}
// --- Request DTOs ---
export interface LoginRequest {
    username: string;
    password?: string;
    deviceId?: string;
    ip?: string;
    userAgent?: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
    deviceId?: string;
    ip?: string;
    userAgent?: string;
}

export interface LogoutRequest {
    refreshToken?: string;
    deviceId?: string;
}

// --- Response DTOs ---
export interface UserProfile {
    userId: string;
    username: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    userType: UserType;
    status: UserStatus;
    lastLoginAt?: string;
    createdAt: string;

    // [CẬP NHẬT] Đổi mảng string sang mảng Enum để type safe
    roles: UserRole[];
    permissions: string[];

    avatar?: string; // Bổ sung field này nếu MainLayout dùng
    studentCode?: string; // Bổ sung nếu cần hiển thị
}

export interface LoginResponse {
    userId: string;
    accessExpiresAt: string;
    refreshExpiresAt: string;
    type: string;
    expiresIn?: number;
    user: UserProfile;
}

export interface RegisterRequest {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    otp: string; // [QUAN TRỌNG] Trường OTP bắt buộc
}

export interface GenerateOtpResponse {
    message: string;
    maskedEmail: string;
    expiresInSeconds: number;
    sentAt: string;
}