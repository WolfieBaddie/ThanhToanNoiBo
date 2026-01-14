package com.example.thanhtoannoibo.DTO.Response.Payment;

import lombok.*;

@Data
@Builder
public class VnPayResponse {
    private String paymentUrl;
    private String txnRef; // Mã tham chiếu giao dịch gửi sang VNPAY
}
