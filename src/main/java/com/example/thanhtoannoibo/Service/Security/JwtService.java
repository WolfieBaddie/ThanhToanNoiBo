package com.example.thanhtoannoibo.Service.Security;

import com.example.thanhtoannoibo.Common.UserType;
import com.example.thanhtoannoibo.Config.JwtProperties;
import com.example.thanhtoannoibo.Entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JwtService {
    private final JwtProperties jwtProperties;

    public String extractUsername(String token) {
        // CŨ: return extractClaim(token, Claims::getSubject); -> Lấy "student1" (gây lỗi)

        // MỚI: Lấy custom claim "userId" -> Trả về "10000000-..." (UUID chuẩn)
        return extractClaim(token, claims -> claims.get("userId", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtProperties.getExpiration());
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails, jwtProperties.getRefreshExpiration());
    }

    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String extractedId = extractUsername(token); // Đây là chuỗi UUID từ token

        // Kiểm tra xem userDetails có phải là Entity User của mình không
        if (userDetails instanceof User) {
            String dbUserId = ((User) userDetails).getUserId().toString();
            // So sánh UUID trong token với UUID trong Database
            return (extractedId.equals(dbUserId)) && !isTokenExpired(token);
        }

        // Fallback cho trường hợp khác (ít dùng)
        return (extractedId.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecretKey());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateAccessToken(String username, UUID userId, UserType userType, List<String> permissionCodes, List<String> roleCodes, Instant expiresAt) {

        return Jwts.builder()
                .setIssuer(jwtProperties.getIssuer())
                .setSubject(username)       // Standard subject is now Username (for Security)
                .claim("userId", userId)    // Custom claim stores the ID (for Business Logic)
                .claim("type", userType)
                .claim("perms", permissionCodes)
                .claim("roles", roleCodes)
                .setIssuedAt(Date.from(Instant.now()))
                .setExpiration(Date.from(expiresAt))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public UUID extractUserId(String token) {
        // 1. Lấy chuỗi UUID từ custom claim "userId" (thay vì lấy Subject)
        String userIdString = extractClaim(token, claims -> claims.get("userId", String.class));

        // 2. Chuyển đổi String thành UUID
        return UUID.fromString(userIdString);
    }

}