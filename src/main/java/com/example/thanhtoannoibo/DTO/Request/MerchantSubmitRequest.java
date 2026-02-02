package com.example.thanhtoannoibo.DTO.Request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantSubmitRequest {
    private String fullName;
    private String phoneNumber;
    private String qrPaymentUrl;
}
