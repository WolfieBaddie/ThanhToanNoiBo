package com.example.thanhtoannoibo.DTO;
import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.Common.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private UserType userType;
    private UserStatus status;
    private String username;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private Set<String> roles;
    private Set<String> permissions;

}
