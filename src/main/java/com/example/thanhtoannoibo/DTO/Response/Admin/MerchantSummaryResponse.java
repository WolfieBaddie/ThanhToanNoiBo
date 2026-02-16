package com.example.thanhtoannoibo.DTO.Response.Admin;
import com.example.thanhtoannoibo.Common.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MerchantSummaryResponse {
    private UUID userId;
    private String fullName;
    private String username;
    private String email;
    private String phoneNumber;
    private UserStatus status;
    private String imageUrl;
    private LocalDateTime createdAt;

    // Thông tin Quầy & Thống kê
    private String counterName;
    private String counterLocation;
    private long totalServices;
    private long totalPackages;
}
