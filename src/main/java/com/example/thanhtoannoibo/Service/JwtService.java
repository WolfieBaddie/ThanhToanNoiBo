//package com.example.thanhtoannoibo.Service;
//
//import io.jsonwebtoken.Claims;
//import com.auth0.jwt.JWT;
//import com.auth0.jwt.algorithms.Algorithm;
//import com.example.thanhtoannoibo.Config.JwtProperties;
//import lombok.RequiredArgsConstructor;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.stereotype.Service;
//import java.time.Instant;
//import java.util.List;
//import java.util.Map;
//import java.util.UUID;
//import java.util.function.Function;
//
//@Service
//public class JwtService {
//    private final JwtProperties jwtProperties;
//    private final Algorithm algorithm;
//    private final String issuer;
//
//    public JwtService(
//            @Value("${app.jwt.secret}") String secret,
//            @Value("${app.jwt.issuer}") String issuer
//    ) {
//        this.algorithm = Algorithm.HMAC256(secret);
//        this.issuer = issuer;
//    }
//
//    public String extractUsername(String token)
//    {
//        return extractClaim(token, Claims::getSubject);
//    }
//
//    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver)
//    {
//        return generateToken();
//    }
//
//    public String generateToken(Map<String, Object> extraClaims, UserDetails){}
//
////    public String generateAccessToken(UUID userId, String userType, List<String> permissionCodes, Instant expiresAt)
////    {
////        return JWT.create()
////                .withIssuer(issuer)
////                .withSubject(userId.toString())
////                .withClaim("type", userType)
////                .withArrayClaim("perms", permissionCodes.toArray(new String[0]))
////                .withIssuedAt(Instant.now())
////                .withExpiresAt(expiresAt)
////                .sign(algorithm);
////    }
//}
