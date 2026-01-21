package com.example.thanhtoannoibo.DTO.Response.Auth;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class GenerateOtpResponse {

    // Thông báo hiển thị cho user (VD: "Mã OTP đã được gửi đến email n***@gmail.com")
    private String message;

    // Email nhận mã (đã che bớt ký tự để bảo mật, VD: nguyen***@gmail.com)
    private String maskedEmail;

    // Thời gian hết hạn tính bằng giây (VD: 300s = 5 phút)
    // Frontend dùng số này để chạy đồng hồ đếm ngược
    private int expiresInSeconds;

    // Thời điểm gửi
    private LocalDateTime sentAt;
}