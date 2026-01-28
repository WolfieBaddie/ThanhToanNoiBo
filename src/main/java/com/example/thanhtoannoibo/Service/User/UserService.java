package com.example.thanhtoannoibo.Service.User;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.DTO.Request.User.UpdateAvatarRequest;
import com.example.thanhtoannoibo.DTO.Request.User.UserFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Entity.Role;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Lấy danh sách Users (Có phân trang & search & filter date)
     */
    public PageResponse<UserResponse> getUsers(UserFilterRequest filter, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword search
            if (StringUtils.hasText(filter.getKeyword())) {
                String key = "%" + filter.getKeyword().toLowerCase() + "%";
                Predicate namePred = cb.like(cb.lower(root.get("fullName")), key);
                Predicate emailPred = cb.like(cb.lower(root.get("email")), key);
                Predicate phonePred = cb.like(root.get("phoneNumber"), key);
                Predicate usernamePred = cb.like(cb.lower(root.get("username")), key);
                predicates.add(cb.or(namePred, emailPred, phonePred, usernamePred));
            }

            // 2. Status filter
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            // 3. Role filter
            if (StringUtils.hasText(filter.getRole())) {
                Join<User, Role> roleJoin = root.join("roles");
                String roleName = filter.getRole().toUpperCase();
                if (!roleName.startsWith("ROLE_")) {
                    roleName = "ROLE_" + roleName;
                }
                predicates.add(cb.equal(roleJoin.get("roleName"), roleName));
            }

            // 4. Created date range
            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        filter.getFromDate().atStartOfDay()
                ));
            }

            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("createdAt"),
                        filter.getToDate().atTime(23, 59, 59)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> page = userRepository.findAll(spec, pageable);

        List<UserResponse> items = page.getContent()
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .items(items)
                .build();
    }

    /**
     * Lấy chi tiết 1 User
     */
    public UserResponse getUserDetail(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return mapToUserResponse(user);
    }

    /**
     * ✅ Cập nhật ảnh đại diện cho user đang đăng nhập
     */
    public UserResponse updateMyAvatar(UpdateAvatarRequest request) {

        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setImageUrl(request.getImageUrl());

        userRepository.save(user);

        return mapToUserResponse(user);
    }

    /**
     * Map User Entity → UserResponse
     */
    private UserResponse mapToUserResponse(User user) {
        Set<String> roles = Collections.emptySet();

        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            roles = user.getRoles()
                    .stream()
                    .map(Role::getRoleName)
                    .collect(Collectors.toSet());
        }

        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType())
                .status(user.getStatus() != null ? user.getStatus() : UserStatus.LOCKED)
                .imageUrl(user.getImageUrl())
                .roles(roles)
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
