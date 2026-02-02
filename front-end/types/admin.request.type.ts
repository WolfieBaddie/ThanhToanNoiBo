// src/types/admin.request.type.ts

export interface AdminMerchantRequestDetailResponse {
    // --- Thông tin Request ---
    requestId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;

    // --- Thông tin Xử lý của Admin ---
    reviewedAt?: string;
    reviewedByName?: string;
    rejectionReason?: string;
    adminReviewImageUrl?: string;

    // --- Thông tin Merchant (Người gửi) ---
    merchantId: string;
    merchantUsername: string;
    merchantCurrentName: string;
    merchantEmail: string;
    merchantPhone: string;
    currentQrUrl: string;

    // --- Thông tin Merchant muốn Cập nhật ---
    submittedFullName?: string;
    submittedQrUrl?: string;
}

export interface AdminReviewRequest {
    status: 'APPROVED' | 'REJECTED';
    reason?: string;         // Bắt buộc nếu REJECTED
    reviewImageUrl?: string; // URL ảnh bill/xác thực (nếu duyệt)
}

// Bộ lọc tìm kiếm
export interface AdminRequestFilter {
    keyword?: string;
    status?: string;
    fromDate?: string; // ISO Date String
    toDate?: string;   // ISO Date String
    page: number;
    size: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}