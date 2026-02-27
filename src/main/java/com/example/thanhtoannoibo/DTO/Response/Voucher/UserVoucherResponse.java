package com.example.thanhtoannoibo.DTO.Response.Voucher;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserVoucherResponse {
    private UUID voucherId;
    private String voucherCode;
    private String status;

    private UUID serviceId;
    private UUID packageId;
    private String serviceName;
    private String imageUrl;
    private String categoryName;

    private BigDecimal priceAtPurchase;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime usedAt;

    private boolean isExpired;
    private Integer quantity; // Số lượng gói (VD: mua 2 gói)
    private String qrContent;

    private Integer totalRemainingUsage; // Tổng lượt còn lại của voucher

    // [CẬP NHẬT MỚI]: Thông tin Gói & Quầy
    private String comboType;       // "ALL_INCLUSIVE" hoặc "SELECT_ONE"
    private Integer usageLimit;     // Giới hạn (nếu là gói chọn 1)
    private String counterName;     // Tên quầy quản lý gói này
    private String counterLocation; // Vị trí quầy

    // [CẬP NHẬT MỚI] Danh sách các món trong voucher này
    private List<UserVoucherDetailResponse> items;
}