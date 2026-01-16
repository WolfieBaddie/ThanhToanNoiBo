package com.example.thanhtoannoibo.Util;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {
    // Thời gian sống: Access Token (ví dụ 15 phút), Refresh Token (30 ngày)

    public ResponseCookie createAccessTokenCookie(String token, long durationMinutes) {
        return ResponseCookie.from("accessToken", token)
                .httpOnly(true) // Quan trọng: JS không đọc được
                .secure(false)  // Để false khi chạy localhost (http), lên prod đổi thành true (https)
                .path("/")      // Cookie có hiệu lực toàn domain
                .maxAge(Duration.ofMinutes(durationMinutes))
                .sameSite("Strict") // Chặn CSRF
                .build();
    }

    public ResponseCookie createRefreshTokenCookie(String token, long durationDays) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(false)
                .path("/api/auth/refresh") // Chỉ gửi cookie này khi gọi API refresh để tối ưu
                .maxAge(Duration.ofDays(durationDays))
                .sameSite("Strict")
                .build();
    }

    public ResponseCookie clearCookie(String name) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0) // Xóa ngay lập tức
                .build();
    }
}