package com.example.thanhtoannoibo.Service.User;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.UserStatus;
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
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Lấy danh sách Users (Có phân trang & search)
     */
    public PageResponse<UserResponse> getUsers(UserFilterRequest filter, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo keyword (Email, Phone, FullName, Username)
            if (StringUtils.hasText(filter.getKeyword())) {
                String key = "%" + filter.getKeyword().toLowerCase() + "%";
                Predicate namePred = cb.like(cb.lower(root.get("fullName")), key);
                Predicate emailPred = cb.like(cb.lower(root.get("email")), key);
                Predicate phonePred = cb.like(root.get("phoneNumber"), key);
                Predicate usernamePred = cb.like(cb.lower(root.get("username")), key);

                predicates.add(cb.or(namePred, emailPred, phonePred, usernamePred));
            }

            // 2. Lọc theo Status
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            // 3. Lọc theo Role (Join bảng Roles)
            if (StringUtils.hasText(filter.getRole())) {
                // Join từ User -> Roles
                Join<User, Role> roleJoin = root.join("roles");
                // So sánh tên role (Lưu ý: DB thường lưu role là ROLE_USER, ROLE_ADMIN...)
                // Nếu filter gửi lên "USER" thì có thể cần thêm "ROLE_" vào trước
                String roleName = filter.getRole().toUpperCase();
                if (!roleName.startsWith("ROLE_")) {
                    roleName = "ROLE_" + roleName;
                }
                predicates.add(cb.equal(roleJoin.get("roleName"), roleName));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> page = userRepository.findAll(spec, pageable);

        List<UserResponse> items = page.getContent().stream()
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
     * Logic map User Entity -> UserResponse
     */
    private UserResponse mapToUserResponse(User user) {
        // [FIX] Map Roles sang Set<String> thay vì String
        Set<String> roles = Collections.emptySet();
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            roles = user.getRoles().stream()
                    .map(Role::getRoleName)
                    .collect(Collectors.toSet());
        }

        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType()) // Enum khớp nhau
                .status(user.getStatus() != null ? user.getStatus() : UserStatus.LOCKED)
                .imageUrl(user.getImageUrl())
                .roles(roles) // Truyền đúng Set<String>
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                // .balance(balance) -> Đã bỏ vì UserResponse chưa có trường này
                // .updatedAt(...) -> Đã bỏ vì UserResponse chưa có trường này
                .build();
    }
}