//package com.example.thanhtoannoibo.Service;
//import com.example.thanhtoannoibo.Common.IdentityProvider;
//import com.example.thanhtoannoibo.Common.UserStatus;
//import com.example.thanhtoannoibo.DTO.LoginRequest;
//import com.example.thanhtoannoibo.DTO.LoginResponse;
//import com.example.thanhtoannoibo.Entity.*;
//import com.example.thanhtoannoibo.Projection.UserPermissionRow;
//import com.example.thanhtoannoibo.Repository.*;
//import lombok.RequiredArgsConstructor;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.nio.charset.StandardCharsets;
//import java.security.MessageDigest;
//import java.time.Duration;
//import java.time.Instant;
//import java.util.*;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//public class AuthService {
//    private final UserAccountRepository userAccountRepo;
//    private final UserCredentialRepository credentialRepo;
//    private final UserIdentityRepository identityRepo;
//    private final SessionRepository sessionRepo;
//    private final LoginAttemptRepository loginAttemptRepo;
//    private final UserPermissionViewRepository permissionViewRepo;
//
//    private final PasswordEncoder passwordEncoder;
//    private final JwtService jwtService;
//
//    @Value("${app.jwt.access-ttl-minutes:15}")
//    private long accessTtlMinutes;
//
//    @Value("${app.jwt.refresh-ttl-days:30}")
//    private long refreshTtlDays;
//
//    // Chính sách lockout mẫu
//    private static final int MAX_FAILED = 5;
//    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);
//
//    @Transactional
//    public LoginResponse login(LoginRequest req) {
//
//        String rawIdentifier = req.getIdentifier() == null ? null : req.getIdentifier().trim();
//        UUID userId = resolveUserId(req.getProvider(), rawIdentifier);
//
//        // 2) Load user + credential
//        UserAccount user = userAccountRepo.findById(userId)
//                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
//
//        if (user.getStatus() == UserStatus.DELETED) {
//            recordLoginAttempt(rawIdentifier, user.getUserId(), false, "USER_DELETED", req);
//            throw new RuntimeException("USER_DISABLED");
//        }
//        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.LOCKED) {
//            recordLoginAttempt(rawIdentifier, user.getUserId(), false, "USER_BLOCKED", req);
//            throw new RuntimeException("USER_BLOCKED");
//        }
//
//        UserCredential cred = credentialRepo.findById(userId)
//                .orElseThrow(() -> new RuntimeException("CREDENTIAL_NOT_FOUND"));
//
//        // 3) Verify password
//        boolean ok = cred.getPasswordHash() != null && passwordEncoder.matches(req.getPassword(), cred.getPasswordHash());
//        if (!ok) {
//            handleFailedLogin(cred);
//            recordLoginAttempt(rawIdentifier, user.getUserId(), false, "BAD_CREDENTIALS", req);
//            throw new RuntimeException("BAD_CREDENTIALS");
//        }
//
//        // 4) Success: reset counters, update last_login
//        cred.setFailedLoginCount(0);
//        cred.setLockedUntil(null);
//        cred.setLastLoginAt(Instant.now());
//        credentialRepo.save(cred);
//
//        recordLoginAttempt(rawIdentifier, user.getUserId(), true, null, req);
//
//        // 5) Load permissions từ view auth.v_user_permissions
//        // (Nếu muốn “scope theo đơn vị”, bạn có thể tách perms global và perms theo unit)
//        List<UserPermissionRow> rows = permissionViewRepo.findPermissionsByUserId(userId);
//        List<String> permissionCodes = rows.stream()
//                .map(UserPermissionRow::getPermissionCode)
//                .distinct()
//                .sorted()
//                .toList();
//
//        // 6) Generate tokens
//        Instant accessExp = Instant.now().plus(Duration.ofMinutes(accessTtlMinutes));
//        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUserType().name(), permissionCodes, accessExp);
//
//        String refreshTokenPlain = UUID.randomUUID().toString() + "." + UUID.randomUUID(); // đủ entropy cho dev
//        String refreshHash = sha256Base64(refreshTokenPlain);
//
//        Instant refreshExp = Instant.now().plus(Duration.ofDays(refreshTtlDays));
//        Session session = new Session();
//        session.setUserId(userId);
//        session.setRefreshTokenHash(refreshHash);
//        session.setExpiresAt(refreshExp);
//        session.setIp(req.getIp());
//        session.setUserAgent(req.getUserAgent());
//        session.setDeviceId(req.getDeviceId());
//        sessionRepo.save(session);
//
//        return LoginResponse.builder()
//                .userId(userId)
//                .accessToken(accessToken)
//                .accessExpiresAt(accessExp)
//                .refreshToken(refreshTokenPlain)
//                .refreshExpiresAt(refreshExp)
//                .build();
//    }
//
//    private UUID resolveUserId(IdentityProvider provider, String identifier) {
//        String normalized = identifier == null ? null : identifier.trim();
//
//        return identityRepo.findByProviderAndIdentifier(provider, normalized)
//                .map(UserIdentity::getUserId)
//                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
//    }
//
//    private void handleFailedLogin(UserCredential cred) {
//        int next = cred.getFailedLoginCount() + 1;
//        cred.setFailedLoginCount(next);
//        if (next >= MAX_FAILED) {
//            cred.setLockedUntil(Instant.now().plus(LOCK_DURATION));
//            cred.setFailedLoginCount(0); // hoặc giữ lại tuỳ policy
//        }
//        credentialRepo.save(cred);
//    }
//
//    private void recordLoginAttempt(String identifier, UUID userId, boolean success, String reason, LoginRequest req) {
//        LoginAttempt a = new LoginAttempt();
//        a.setIdentifier(identifier);
//        a.setUserId(userId);
//        a.setSuccess(success);
//        a.setFailureReason(reason);
//        a.setIp(req.getIp());
//        a.setUserAgent(req.getUserAgent());
//        loginAttemptRepo.save(a);
//    }
//
//    private static String normalize(String s) {
//        return s == null ? null : s.trim();
//    }
//
//    private static IdentityProvider inferProvider(String identifier) {
//        if (identifier == null) return IdentityProvider.STUDENT_CODE;
//        if (identifier.contains("@")) return IdentityProvider.EMAIL;
//        if (identifier.matches("^\\+?\\d{9,15}$")) return IdentityProvider.PHONE;
//        // CARD_UID thường là hex/uid theo thiết bị; nếu bạn có format rõ, thêm rule ở đây
//        return IdentityProvider.STUDENT_CODE;
//    }
//
//    private static String sha256Base64(String plain) {
//        try {
//            MessageDigest md = MessageDigest.getInstance("SHA-256");
//            byte[] digest = md.digest(plain.getBytes(StandardCharsets.UTF_8));
//            return Base64.getEncoder().encodeToString(digest);
//        } catch (Exception e) {
//            throw new IllegalStateException("HASH_ERROR", e);
//        }
//    }
//}
