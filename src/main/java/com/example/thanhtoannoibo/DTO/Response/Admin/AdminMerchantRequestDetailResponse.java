package com.example.thanhtoannoibo.DTO.Response.Admin;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminMerchantRequestDetailResponse {
    private UUID requestId;
    private String status; // PENDING, APPROVED, REJECTED
    private LocalDateTime createdAt;

    // --- Thông tin Xử lý của Admin ---
    private LocalDateTime reviewedAt;
    private String reviewedByName; // Tên Admin đã duyệt (nếu có)
    private String rejectionReason;
    private String adminReviewImageUrl; // Ảnh minh chứng từ Admin

    // --- Thông tin Merchant (Người gửi) - Lấy từ DB hiện tại ---
    private UUID merchantId;
    private String merchantUsername; // Mã định danh
    private String merchantCurrentName; // Tên hiển thị hiện tại trong DB
    private String merchantEmail;
    private String merchantPhone;
    private String currentQrUrl; // QR Code đang dùng hiện tại

    // --- Thông tin Merchant muốn Cập nhật (Lấy từ JSON request_data) ---
    private String submittedFullName;
    private String submittedQrUrl;
}