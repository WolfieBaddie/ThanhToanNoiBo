package com.example.thanhtoannoibo.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {
    private final Algorithm algorithm;
    private final String issuer;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.issuer}") String issuer
    ) {
        this.algorithm = Algorithm.HMAC256(secret);
        this.issuer = issuer;
    }

    public String generateAccessToken(UUID userId, String userType, List<String> permissionCodes, Instant expiresAt)
    {
        return JWT.create()
                .withIssuer(issuer)
                .withSubject(userId.toString())
                .withClaim("type", userType)
                .withArrayClaim("perms", permissionCodes.toArray(new String[0]))
                .withIssuedAt(Instant.now())
                .withExpiresAt(expiresAt)
                .sign(algorithm);
    }
}
