package com.example.thanhtoannoibo.Controller.Security;

import com.example.thanhtoannoibo.DTO.LoginRequest;
import com.example.thanhtoannoibo.DTO.LoginResponse;
import com.example.thanhtoannoibo.DTO.LogoutRequest;
import com.example.thanhtoannoibo.DTO.RefreshTokenRequest;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest httpRequest) {

        // Extract request metadata
        if (loginRequest.getIp() == null) {
            loginRequest.setIp(getClientIp(httpRequest));
        }

        if (loginRequest.getUserAgent() == null) {
            loginRequest.setUserAgent(httpRequest.getHeader("User-Agent"));
        }

        if (loginRequest.getDeviceId() == null) {
            loginRequest.setDeviceId(httpRequest.getHeader("X-Device-Id"));
        }

        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Valid @RequestBody LogoutRequest logoutRequest,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Option 1: Use provided refresh token
        if (logoutRequest.getRefreshToken() != null) {
            // Call service method to invalidate specific refresh token
            // authService.logoutByRefreshToken(logoutRequest.getRefreshToken());
        }

        // Option 2: Use Authorization header
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String accessToken = authHeader.substring(7);
            // Call service method to handle logout (invalidate session, etc.)
            // authService.logoutByAccessToken(accessToken);
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest refreshRequest,
            HttpServletRequest httpRequest) {

        // Extract request metadata for new session
        refreshRequest.setIp(getClientIp(httpRequest));
        refreshRequest.setUserAgent(httpRequest.getHeader("User-Agent"));
        refreshRequest.setDeviceId(httpRequest.getHeader("X-Device-Id"));

        // Call service method to validate refresh token and issue new tokens
        // LoginResponse response = authService.refreshToken(refreshRequest);
        // return ResponseEntity.ok(response);

        // Placeholder until refresh service method is implemented
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/validate")
    public ResponseEntity<Void> validateToken(
            @RequestHeader("Authorization") String authHeader) {

        // Token validation is handled by JWT filter
        // This endpoint just confirms the token is valid
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok().build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}