package com.example.thanhtoannoibo.Service.Security;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.Common.UserType;
import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import com.example.thanhtoannoibo.Config.JwtProperties;
import com.example.thanhtoannoibo.DTO.Request.Auth.LoginRequest;
import com.example.thanhtoannoibo.DTO.Request.Auth.RefreshTokenRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.LoginResponse;
import com.example.thanhtoannoibo.DTO.Request.Register.RegisterRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.RefreshTokenResponse;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.Entity.*;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.Security.UserSession;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Security.RoleRepository;
import com.example.thanhtoannoibo.Repository.Security.SessionRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserVoucherRepository userVoucherRepository;

    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserCreditRepository userCreditRepository;
    private final JwtProperties jwtProperties;
    private final com.example.thanhtoannoibo.Service.Security.OtpService otpService;

    @Value("${app.jwt.access-ttl-minutes:15}")
    private long accessTtlMinutes;

    @Value("${app.jwt.refresh-ttl-days:30}")
    private long refreshTtlDays;

    private static final int MAX_FAILED = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    @Transactional
    public LoginResponse login(LoginRequest req) {
        // Find user by username (or email if needed)
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

        if (user.getStatus() == UserStatus.DELETED) {
            throw new RuntimeException("USER_DELETED");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new RuntimeException("USER_SUSPENDED");
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new RuntimeException("USER_LOCKED");
        }

        System.out.println("=== DEBUG LOGIN ===");
        System.out.println("1. Input Username: " + req.getUsername());
        System.out.println("2. Input Password: " + req.getPassword());

        User debugUser = userRepository.findByUsername(req.getUsername()).orElse(null);
        if (debugUser == null) {
            System.out.println("3. User query result: NULL (Tìm không thấy user trong DB!)");
        } else {
            System.out.println("3. User query result: FOUND");
            System.out.println("4. Hash in DB: [" + debugUser.getPasswordHash() + "]");

            boolean match = passwordEncoder.matches(req.getPassword(), debugUser.getPasswordHash());
            System.out.println("5. Check Matches: " + match);

            if (!match) {
                // Thử tạo hash mới xem nó trông thế nào
                String expectedHash = passwordEncoder.encode(req.getPassword());
                System.out.println("6. Expected Hash should look like: " + expectedHash);
            }
        }
        System.out.println("===================");

        // Authenticate using Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getUsername(),
                        req.getPassword()
                )
        );

        // Update last login time
        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        // Get permissions from user's roles
        List<String> permissionCodes = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getPermissionCode)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // Get role codes
        List<String> roleCodes = user.getRoles().stream()
                .map(Role::getRoleCode)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        Instant accessExp = Instant.now().plus(Duration.ofMinutes(accessTtlMinutes));
        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getUserId(), user.getUserType(), permissionCodes, roleCodes, accessExp);

        // Generate refresh token
        String refreshTokenPlain = UUID.randomUUID().toString() + "." + UUID.randomUUID();
        String refreshHash = sha256Base64(refreshTokenPlain);

        Instant refreshExp = Instant.now().plus(Duration.ofDays(refreshTtlDays));

        // Create session entity (you need to create this entity)
        UserSession session = UserSession.builder()
                .user(user)
                .token(refreshHash)
                .ipAddress(req.getIp())
                .expiresAt(java.time.LocalDateTime.now().plusDays(refreshTtlDays))
                .createdAt(java.time.LocalDateTime.now())
                .build();

        sessionRepository.save(session);

        return LoginResponse.builder()
                .userId(user.getUserId())
                .accessToken(accessToken)
                .accessExpiresAt(accessExp)
                .refreshToken(refreshTokenPlain)
                .refreshExpiresAt(Instant.now().plus(Duration.ofDays(refreshTtlDays)))
                .user(UserResponse.builder() // Mapping sơ bộ để trả về
                        .userId(user.getUserId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .userType(user.getUserType())
                        .build())
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        String refreshHash = sha256Base64(refreshToken);
        sessionRepository.findByToken(refreshHash)
                .ifPresent(session -> {
                    session.setRevoked(true);
                    sessionRepository.save(session);
                });
    }

    @Transactional
    public LoginResponse register(RegisterRequest req) {
        // 1. [MỚI] Validate OTP trước tiên
        // "REGISTER" là actionType quy ước giữa BE và FE
        otpService.validateOtp(req.getEmail(), req.getOtp(), "REGISTER");

        // 2. Validate trùng lặp
        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            throw new RuntimeException("USERNAME_EXISTS");
        }
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new RuntimeException("EMAIL_EXISTS");
        }

        // 3. Tạo User Entity
        User newUser = User.builder()
                .username(req.getUsername())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phoneNumber(req.getPhoneNumber())
                .userType(UserType.USER) // Mặc định là User/Student
                .status(UserStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        Role defaultRole = roleRepository.findByRoleCode("STUDENT")
                .orElseThrow(() -> new RuntimeException("DEFAULT_ROLE_NOT_FOUND"));

        newUser.setRoles(new HashSet<>(Collections.singletonList(defaultRole)));

        User savedUser = userRepository.save(newUser);

        // 4. [MỚI] Tự động tạo Ví (UserCredit)
        UserCredit newCredit = UserCredit.builder()
                .user(savedUser)
                .balance(BigDecimal.ZERO)          // Số dư ban đầu = 0
                .totalDeposited(BigDecimal.ZERO)
                .currentDaySpending(BigDecimal.ZERO)
                .dailyLimitAmount(null)            // Không giới hạn
                .build();

        userCreditRepository.save(newCredit);

        // 5. Tạo Voucher chào mừng (Giữ nguyên logic cũ nếu cần)
        String uniqueVoucherCode = "V" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0,4).toUpperCase();
        UserVoucher newVoucher = UserVoucher.builder()
                .owner(savedUser)
                .voucherCode(uniqueVoucherCode)
                .status(UserVoucherStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();
        userVoucherRepository.save(newVoucher);

        // 6. Ghi Audit Log
        AuditLog auditLog = AuditLog.builder()
                .user(savedUser)
                .action("REGISTER_ACCOUNT")
                .entityType("USER")
                .entityId(savedUser.getUserId())
                .details(Map.of("email", savedUser.getEmail(), "creditId", newCredit.getCreditId().toString()))
                .ipAddress("REGISTER_FLOW")
                .createdAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);

        // 7. Tự động đăng nhập (Tạo Token trả về luôn)
        // Lấy quyền hạn
        List<String> permissionCodes = savedUser.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getPermissionCode)
                .distinct().sorted().collect(Collectors.toList());

        List<String> roleCodes = savedUser.getRoles().stream()
                .map(Role::getRoleCode).distinct().sorted().collect(Collectors.toList());

        // Sinh Token
        Instant accessExp = Instant.now().plus(Duration.ofMinutes(accessTtlMinutes));
        String accessToken = jwtService.generateAccessToken(
                savedUser.getUsername(),
                savedUser.getUserId(),
                savedUser.getUserType(),
                permissionCodes,
                roleCodes,
                accessExp
        );

        String refreshTokenPlain = UUID.randomUUID().toString() + "." + UUID.randomUUID();
        String refreshHash = sha256Base64(refreshTokenPlain);
        Instant refreshExp = Instant.now().plus(Duration.ofDays(refreshTtlDays));

        // Lưu Session
        UserSession session = UserSession.builder()
                .user(savedUser)
                .token(refreshHash)
                .ipAddress("REGISTER_IP")
                .expiresAt(LocalDateTime.now().plusDays(refreshTtlDays))
                .createdAt(LocalDateTime.now())
                .build();

        sessionRepository.save(session);

        return LoginResponse.builder()
                .userId(savedUser.getUserId())
                .accessToken(accessToken)
                .accessExpiresAt(accessExp)
                .refreshToken(refreshTokenPlain)
                .refreshExpiresAt(refreshExp)
                // Có thể trả thêm user info nếu cần
                .build();
    }

    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        // 1. Tìm Refresh Token
        UserSession session = sessionRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));

        // 2. Kiểm tra hạn & trạng thái
        if (session.isRevoked() || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        User user = session.getUser();

        // 3. Lấy Roles
        List<String> roleCodes = user.getRoles().stream().map(Role::getRoleCode).toList();

        // 4. Tính thời gian hết hạn (Dùng jwtProperties)
        // jwt.expiration trong properties thường là miliseconds (VD: 86400000)
        Instant accessExpiration = Instant.now().plusMillis(jwtProperties.getExpiration());

        // 5. Sinh Access Token mới
        String newAccessToken = jwtService.generateAccessToken(
                user.getUsername(),
                user.getUserId(),
                user.getUserType(),
                new ArrayList<>(), // Permissions
                roleCodes,
                accessExpiration
        );

        // 6. Xoay vòng Refresh Token (Token Rotation)
        String newRefreshToken = UUID.randomUUID().toString();

        // Cập nhật Session
        session.setToken(newRefreshToken);
        // Lấy refreshExpiration từ properties (nếu có), hoặc fix cứng VD 7 ngày
        long refreshExpireMs = jwtProperties.getRefreshExpiration();
        session.setExpiresAt(LocalDateTime.now().plusNanos(refreshExpireMs * 1_000_000));
        // Hoặc đơn giản: LocalDateTime.now().plusDays(7)

        sessionRepository.save(session);

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    /**
     * Extracts the User from the JWT in the Authorization header.
     */
// === ĐÂY LÀ HÀM QUAN TRỌNG CẦN SỬA ===
    public User getCurrentUser(HttpServletRequest request) {
        System.out.println("========== DEBUG: getCurrentUser START ==========");

        String token = null;

        // 1. Check Header
        String header = request.getHeader("Authorization");
        System.out.println("1. Authorization Header: " + header);

        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            System.out.println("=> Tìm thấy Token trong Header!");
        }

        // 2. Check Cookie (Logic mới cần thêm vào)
        if (token == null) {
            System.out.println("2. Header null, đang tìm trong Cookie...");
            if (request.getCookies() != null) {
                System.out.println("   So luong Cookie nhan duoc: " + request.getCookies().length);
                for (Cookie cookie : request.getCookies()) {
                    System.out.println("   - Cookie Name: [" + cookie.getName() + "]");
                    if ("accessToken".equals(cookie.getName())) {
                        token = cookie.getValue();
                        System.out.println("=> CHECK MATCH: Tìm thấy Cookie 'accessToken'!");
                        break;
                    }
                }
            } else {
                System.out.println("   request.getCookies() is NULL (Trình duyệt không gửi cookie nào)");
            }
        }

        // 3. Kết quả
        if (token == null) {
            System.out.println("========== DEBUG: FAILED (Token is null) ==========");
            // Sửa lại ném AppException ErrorCode.UNAUTHORIZED (401) thay vì RuntimeException (500)
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        try {
            UUID userId = jwtService.extractUserId(token);
            System.out.println("=> User ID extracted: " + userId);
            return userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));
        } catch (Exception e) {
            System.out.println("ERROR: Giải mã token thất bại: " + e.getMessage());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    // THAY ĐỔI: Phương thức này thay thế cho getWalletIdByUser
    // Tìm Credit ID (đóng vai trò là kho xu) của User
    public UUID getCreditIdByUser(User user) {
        // Tìm Voucher đang ACTIVE của user này
        return userCreditRepository.findByUser_UserId(user.getUserId())
                .map(UserCredit::getCreditId)
                .orElseThrow(() -> new RuntimeException("Can't find user"));
    }

    private static String sha256Base64(String plain) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(plain.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException("HASH_ERROR", e);
        }
    }
}