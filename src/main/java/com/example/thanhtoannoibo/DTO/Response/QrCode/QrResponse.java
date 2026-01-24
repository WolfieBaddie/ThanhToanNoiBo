package com.example.thanhtoannoibo.DTO.Response.QrCode;

import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QrResponse {
    private UUID qrId;
    private String codeString; // Chuỗi token để Frontend render thành ảnh QR
    private String type;
    private String status;
    private BigDecimal creditAmount;
    private UUID voucherId;
    private String voucherCode; // Tiện hiển thị
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private Integer usageLimit;
    private UUID userId;
    private String fullName;
    private String phoneNumber;
    private String userType;
    private String email;
    private String imageUrl;

    private List<ServiceResponse> includedServices;
}