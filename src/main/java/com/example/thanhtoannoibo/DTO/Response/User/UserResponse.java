package com.example.thanhtoannoibo.DTO.Response.User;
import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.Common.UserType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
        private UUID userId;
        private String username;
        private String email;
        private String fullName;
        private String phoneNumber;
        private UserType userType;
        private UserStatus status;
        private String imageUrl;

        private LocalDateTime lastLoginAt;
        private LocalDateTime createdAt;


        private Set<String> roles;
        private Set<String> permissions;

        private BigDecimal creditBalance;
}
