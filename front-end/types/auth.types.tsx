import { UserStatus, UserType } from './common.types';

// --- Request DTOs ---

export interface LoginRequest {
    username: string;
    password?: string;
    // Các trường optional vì Controller có thể lấy từ Header/IP
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
    userId: string; // UUID
    username: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    userType: UserType;
    status: UserStatus;
    lastLoginAt?: string; // ISO Date string
    createdAt: string;
    roles: string[];
    permissions: string[];
}

export interface LoginResponse {
    userId: string;
    accessExpiresAt: string; // ISO Date
    refreshExpiresAt: string; // ISO Date
    type: string; // "Bearer"
    expiresIn?: number;
    user: UserProfile;
}