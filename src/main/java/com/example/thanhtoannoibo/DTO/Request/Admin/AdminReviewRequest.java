package com.example.thanhtoannoibo.DTO.Request.Admin;

import lombok.Data;

@Data
public class AdminReviewRequest {
    private String status; // APPROVED hoặc REJECTED
    private String reason; // Lý do (bắt buộc nếu REJECTED)
    private String reviewImageUrl; // Ảnh xác thực (bắt buộc nếu APPROVED - tuỳ logic)
}