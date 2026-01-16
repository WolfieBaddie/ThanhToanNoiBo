package com.example.thanhtoannoibo.Controller.Security;

import com.example.thanhtoannoibo.DTO.*;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import com.example.thanhtoannoibo.Util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) { // Return UserResponse thay vì LoginResponse chứa token
        // ... (Giữ nguyên logic xác thực IP/Device) ...
        // Extract request metadata
        if (loginRequest.getIp() == null) {
            loginRequest.setIp(getClientIp(request));
        }

        // 1. Lấy kết quả login từ Service (vẫn trả về token string bình thường)
        LoginResponse loginResult = authService.login(loginRequest);

        // 2. Đóng gói Token vào HttpOnly Cookie
        ResponseCookie accessCookie = cookieUtil.createAccessTokenCookie(loginResult.getAccessToken(), 15);
        ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(loginResult.getRefreshToken(), 30);

        // 3. Trả về User Info trong Body, còn Token nằm trong Header Set-Cookie
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(loginResult.getUser()); // Chỉ trả về thông tin User, KHÔNG trả token text
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) LogoutRequest logoutRequest, // Cho phép body null
            HttpServletRequest request,
            HttpServletResponse response // Để xóa cookie
    ) {
        // Logic cũ của bạn: Xóa session trong DB (nếu cần)
        // String refreshToken = ... (Lấy từ Cookie nếu body null)

        // Quan trọng nhất: Xóa Cookie ở trình duyệt
        ResponseCookie cleanAccess = cookieUtil.clearCookie("accessToken");
        ResponseCookie cleanRefresh = cookieUtil.clearCookie("refreshToken");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanAccess.toString())
                .header(HttpHeaders.SET_COOKIE, cleanRefresh.toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(HttpServletRequest request) {
        // 1. Lấy User Entity từ Token (AuthService đã handle việc parse header)
        User user = authService.getCurrentUser(request);

        // 2. Map sang DTO UserResponse (Cần đảm bảo khớp với DTO bên Frontend)
        UserResponse response = UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType()) // Enum
                .status(user.getStatus())     // Enum
                // Nếu UserResponse của bạn có field role, hãy map ở đây
                .build();

        return ResponseEntity.ok(response);
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