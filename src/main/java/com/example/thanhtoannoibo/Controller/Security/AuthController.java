package com.example.thanhtoannoibo.Controller.Security;

import com.example.thanhtoannoibo.DTO.Request.Auth.LoginRequest;
import com.example.thanhtoannoibo.DTO.Request.Auth.LogoutRequest;
import com.example.thanhtoannoibo.DTO.Request.Auth.RefreshTokenRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.LoginResponse;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
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
    public ResponseEntity<BaseResponse<UserResponse>> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        // Extract request metadata
        if (loginRequest.getIp() == null) {
            loginRequest.setIp(getClientIp(request));
        }

        // 1. Lấy kết quả login từ Service
        LoginResponse loginResult = authService.login(loginRequest);

        // 2. Đóng gói Token vào HttpOnly Cookie
        ResponseCookie accessCookie = cookieUtil.createAccessTokenCookie(loginResult.getAccessToken(), 15);
        ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(loginResult.getRefreshToken(), 30);

        // 3. Trả về User Info trong Body (Được bọc BaseResponse), còn Token nằm trong Header Set-Cookie
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(BaseResponse.success(loginResult.getUser(), "Đăng nhập thành công"));
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(
            @RequestBody(required = false) LogoutRequest logoutRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        // Xóa Cookie ở trình duyệt
        ResponseCookie cleanAccess = cookieUtil.clearCookie("accessToken");
        ResponseCookie cleanRefresh = cookieUtil.clearCookie("refreshToken");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanAccess.toString())
                .header(HttpHeaders.SET_COOKIE, cleanRefresh.toString())
                .body(BaseResponse.success(null, "Đăng xuất thành công"));
    }

    @GetMapping("/me")
    public ResponseEntity<BaseResponse<UserResponse>> getCurrentUser(HttpServletRequest request) {
        // 1. Lấy User Entity từ Token
        User user = authService.getCurrentUser(request);

        // 2. Map sang DTO UserResponse
        UserResponse userResponse = UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType())
                .status(user.getStatus())
                .build();

        return ResponseEntity.ok(BaseResponse.success(userResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<BaseResponse<LoginResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest refreshRequest,
            HttpServletRequest httpRequest) {

        refreshRequest.setIp(getClientIp(httpRequest));
        refreshRequest.setUserAgent(httpRequest.getHeader("User-Agent"));
        refreshRequest.setDeviceId(httpRequest.getHeader("X-Device-Id"));

        // LoginResponse response = authService.refreshToken(refreshRequest);
        // return ResponseEntity.ok(BaseResponse.success(response, "Refresh token thành công"));

        return ResponseEntity.badRequest().body(BaseResponse.error(400, "Tính năng chưa được cài đặt"));
    }

    @GetMapping("/validate")
    public ResponseEntity<BaseResponse<Void>> validateToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(BaseResponse.error(401, "Token không hợp lệ"));
        }
        return ResponseEntity.ok(BaseResponse.success(null, "Token hợp lệ"));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}