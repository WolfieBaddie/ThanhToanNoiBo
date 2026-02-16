package com.example.thanhtoannoibo.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource; // Import Interface này
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() { // Đổi tên và kiểu trả về
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        // 1. Cho phép Frontend (Thay đổi port nếu FE chạy port khác)
        corsConfiguration.setAllowedOrigins(List.of(
                "http://localhost:3000", // Cho lúc dev local
                "https://swallet.pages.dev",
                "https://spx-wallet.pages.dev" // Domain Cloudflare của bạn (Thay bằng link thật)
        ));
        // 2. Cho phép gửi Cookie/Credential (QUAN TRỌNG NHẤT)
        corsConfiguration.setAllowCredentials(true);

        // 3. Cho phép các Header và Method cần thiết
        corsConfiguration.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type"));
        corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);

        return source; // Trả về Source, KHÔNG trả về new CorsFilter(source)
    }
}