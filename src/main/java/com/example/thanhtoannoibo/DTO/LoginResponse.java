package com.example.thanhtoannoibo.DTO;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class LoginResponse {
    private UUID userId;
    private String accessToken;
    private Instant accessExpiresAt;
    private String refreshToken;    // plaintext trả về client (DB chỉ lưu hash)
    private Instant refreshExpiresAt;
    private String type = "Bearer";
    private Long expiresIn;
    private UserResponse user;
}
