package com.example.thanhtoannoibo.DTO.Response.Auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RefreshTokenResponse {
    private String accessToken;
    private String refreshToken;
}