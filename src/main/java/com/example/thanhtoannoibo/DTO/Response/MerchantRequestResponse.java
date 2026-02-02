package com.example.thanhtoannoibo.DTO.Response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MerchantRequestResponse {
    private UUID requestId;
    private String requestType;
    private String status;
    private LocalDateTime createdAt;

    // Dữ liệu đã gửi
    private String submittedFullName;
    private String submittedQrUrl;

    // Phản hồi từ Admin
    private String rejectionReason;
    private String adminReviewImageUrl; // Ảnh bằng chứng/bill từ Admin
    private LocalDateTime reviewedAt;
}
