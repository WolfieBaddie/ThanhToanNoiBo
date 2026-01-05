package com.example.thanhtoannoibo.Service.Security;

import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.DTO.LoginRequest;
import com.example.thanhtoannoibo.DTO.LoginResponse;
import com.example.thanhtoannoibo.Entity.*;
import com.example.thanhtoannoibo.Entity.Wallet.Wallet;
import com.example.thanhtoannoibo.Repository.Security.SessionRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Wallet.WalletRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
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
    private final WalletRepository walletRepository;

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
        String accessToken = jwtService.generateAccessToken(
                user.getUsername(), // <--- Change this to getUsername()
                user.getUserId(),
                user.getUserType().name(),
                permissionCodes,
                roleCodes,
                accessExp
        );

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
                .refreshExpiresAt(refreshExp)
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
    public LoginResponse refreshToken(String refreshToken, String ip, String userAgent, String deviceId) {
        String refreshHash = sha256Base64(refreshToken);

        UserSession session = sessionRepository.findByToken(refreshHash)
                .orElseThrow(() -> new RuntimeException("INVALID_REFRESH_TOKEN"));

        if (session.isRevoked()) {
            throw new RuntimeException("REVOKED_REFRESH_TOKEN");
        }

        if (session.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("EXPIRED_REFRESH_TOKEN");
        }

        User user = session.getUser();

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("USER_NOT_ACTIVE");
        }

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
        String newAccessToken = jwtService.generateAccessToken(
                user.getUsername(),
                user.getUserId(),
                user.getUserType().name(),
                permissionCodes,
                roleCodes,
                accessExp
        );

        // Generate new refresh token
        String newRefreshTokenPlain = UUID.randomUUID().toString() + "." + UUID.randomUUID();
        String newRefreshHash = sha256Base64(newRefreshTokenPlain);

        Instant newRefreshExp = Instant.now().plus(Duration.ofDays(refreshTtlDays));

        // Update session with new refresh token
        session.setToken(newRefreshHash);
        session.setExpiresAt(java.time.LocalDateTime.now().plusDays(refreshTtlDays));
        session.setIpAddress(ip);
        sessionRepository.save(session);

        return LoginResponse.builder()
                .userId(user.getUserId())
                .accessToken(newAccessToken)
                .accessExpiresAt(accessExp)
                .refreshToken(newRefreshTokenPlain)
                .refreshExpiresAt(newRefreshExp)
                .build();
    }

    /**
     * Extracts the User from the JWT in the Authorization header.
     */
    public User getCurrentUser(HttpServletRequest request) { // Changed return type to UserAccount to match repo
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            throw new RuntimeException("MISSING_OR_INVALID_TOKEN");
        }

        String token = header.substring(7);

        // Assuming JwtService has a method to extract the Subject (UserId)
        // If your JwtService returns a String, we parse it to UUID
        UUID userId = jwtService.extractUserId(token);

        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
    }

    public UUID getWalletIdByUser(User user) {
        return walletRepository.findByUserId(user.getUserId())
                .map(Wallet::getWalletId)
                .orElseThrow(() -> new RuntimeException("WALLET_NOT_FOUND_FOR_USER"));
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