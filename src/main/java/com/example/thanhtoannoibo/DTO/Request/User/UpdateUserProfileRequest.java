package com.example.thanhtoannoibo.DTO.Request.User;

import lombok.Data;

@Data
public class UpdateUserProfileRequest {
    private String fullName;
    private String phoneNumber;
    private String imageUrl;

    // Trường này chỉ Merchant mới được cập nhật
    private String qrPaymentUrl;
}