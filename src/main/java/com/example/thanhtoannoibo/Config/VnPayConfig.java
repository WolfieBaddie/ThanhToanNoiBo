package com.example.thanhtoannoibo.Config;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "vnpay")
@Data
public class VnPayConfig {
    private String tmnCode;
    private String secretKey;
    private String apiUrl;
    private String payUrl;
    private String returnUrl;
}
