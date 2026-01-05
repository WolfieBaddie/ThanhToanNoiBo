package com.example.thanhtoannoibo.Config;
import lombok.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    private String secretKey;
    private Long expiration;
    private Long refreshExpiration;
    public String issuer = "thanhtoannoibo";
}
