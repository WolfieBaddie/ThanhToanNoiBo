package com.example.thanhtoannoibo.Controller.Security;

import com.example.thanhtoannoibo.DTO.Request.Auth.GenerateOtpRequest;
import com.example.thanhtoannoibo.DTO.Request.Auth.LoginRequest;
import com.example.thanhtoannoibo.DTO.Request.Auth.LogoutRequest;
import com.example.thanhtoannoibo.DTO.Request.Auth.RefreshTokenRequest;
import com.example.thanhtoannoibo.DTO.Request.Register.RegisterRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.GenerateOtpResponse;
import com.example.thanhtoannoibo.DTO.Response.Auth.LoginResponse;
import com.example.thanhtoannoibo.DTO.Response.Auth.RefreshTokenResponse;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.Entity.Permission;
import com.example.thanhtoannoibo.Entity.Role;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import com.example.thanhtoannoibo.Service.Security.OtpService;
import com.example.thanhtoannoibo.Util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;
import jakarta.servlet.http.Cookie;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;
    private final OtpService otpService;

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
        User user = authService.getCurrentUser(request);

        UserResponse userResponse = UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType())
                .status(user.getStatus())
                // [FIX] Map Roles & Permissions
                .roles(user.getRoles().stream()
                        .map(Role::getRoleCode)
                        .collect(Collectors.toSet()))
                .permissions(user.getRoles().stream()
                        .flatMap(role -> role.getPermissions().stream())
                        .map(Permission::getPermissionCode)
                        .collect(Collectors.toSet()))
                .build();

        return ResponseEntity.ok(BaseResponse.success(userResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<BaseResponse<RefreshTokenResponse>> refreshToken(
                                                                            @RequestBody(required = false) RefreshTokenRequest requestBody,
                                                                            HttpServletRequest request,
                                                                            HttpServletResponse response
    ) {
        String refreshToken = null;

        // 1. Ưu tiên lấy từ Cookie
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        // 2. Fallback lấy từ Body
        if (refreshToken == null && requestBody != null) {
            refreshToken = requestBody.getRefreshToken();
        }

        if (refreshToken == null) {
            return ResponseEntity.status(400).body(BaseResponse.error(400, "Refresh Token không tìm thấy"));
        }

        // [FIX 2] Đóng gói tham số vào DTO trước khi gọi Service
        RefreshTokenRequest serviceRequest = new RefreshTokenRequest();
        serviceRequest.setRefreshToken(refreshToken);
        serviceRequest.setIp(getClientIp(request));
        serviceRequest.setUserAgent(request.getHeader("User-Agent"));
        serviceRequest.setDeviceId(request.getHeader("X-Device-Id"));

        // Gọi Service (Lúc này Service sẽ nhận đúng DTO)
        RefreshTokenResponse tokenResult = authService.refreshToken(serviceRequest);

        // 3. Set lại Cookie mới
        ResponseCookie accessCookie = cookieUtil.createAccessTokenCookie(tokenResult.getAccessToken(), 15);
        ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(tokenResult.getRefreshToken(), 30);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(BaseResponse.success(tokenResult, "Làm mới token thành công"));
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

    @PostMapping("/otp/generate")
    public ResponseEntity<BaseResponse<GenerateOtpResponse>> generateOtp(
            @RequestBody @Valid GenerateOtpRequest request,
            HttpServletRequest httpRequest
    ) {
        // 1. Lấy User từ Token
        User user = authService.getCurrentUser(httpRequest);

        // 2. Gọi Service sinh OTP (Logic Redis/Mail đã viết)
        otpService.generateAndSendOtp(user.getEmail(), request.getActionType());

        // 3. Ẩn bớt email để trả về client
        String maskedEmail = maskEmail(user.getEmail());

        // 4. Trả về Response
        return ResponseEntity.ok(BaseResponse.success(
                GenerateOtpResponse.builder()
                        .message("Mã xác thực đã được gửi đến email " + maskedEmail)
                        .maskedEmail(maskedEmail)
                        .expiresInSeconds(60)
                        .sentAt(LocalDateTime.now())
                        .build()
        ));
    }

    // 1. Endpoint Gửi OTP (Public - không cần token)
    @PostMapping("/register/send-otp")
    public ResponseEntity<BaseResponse<String>> sendRegisterOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        // Logic gửi OTP cho hành động REGISTER
        otpService.generateAndSendOtp(email, "REGISTER");
        return ResponseEntity.ok(BaseResponse.success("OTP đã được gửi tới " + email));
    }

    // 2. Endpoint Đăng ký (Kèm OTP)
    @PostMapping("/register")
    public ResponseEntity<BaseResponse<LoginResponse>> register(@Valid @RequestBody RegisterRequest request) {
        // Gọi Service xử lý tất cả (Validate OTP -> Tạo User -> Tạo Credit -> Login)
        LoginResponse result = authService.register(request);

        // Trả về Token (Cookie/Header) như Login
        // ... code set cookie ...
        return ResponseEntity.ok(BaseResponse.success(result));
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf("@");
        if (atIndex > 3) {
            return email.substring(0, 2) + "*******" + email.substring(atIndex - 2);
        }
        return email;
    }
}