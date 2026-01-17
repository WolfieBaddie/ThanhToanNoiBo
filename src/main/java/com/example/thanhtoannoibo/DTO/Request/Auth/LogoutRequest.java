package com.example.thanhtoannoibo.DTO.Request.Auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogoutRequest {
    // Bỏ @NotBlank vì token sẽ lấy từ Cookie
    private String refreshToken;
    private String deviceId;
}