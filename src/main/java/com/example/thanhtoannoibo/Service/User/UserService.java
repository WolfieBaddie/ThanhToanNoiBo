package com.example.thanhtoannoibo.Service.User;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.DTO.Request.User.UpdateUserProfileRequest;
import com.example.thanhtoannoibo.DTO.Request.User.UserFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Entity.Role;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate; // Import
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
    private final NotificationService notificationService;
    /**
     * Lấy danh sách Users (Có phân trang & search & filter date)
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

            // 3. Lọc theo Role
            if (StringUtils.hasText(filter.getRole())) {
                Join<User, Role> roleJoin = root.join("roles");
                String roleName = filter.getRole().toUpperCase();
                if (!roleName.startsWith("ROLE_")) {
                    roleName = "ROLE_" + roleName;
                }
                predicates.add(cb.equal(roleJoin.get("roleName"), roleName));
            }

            // 4. [MỚI] Lọc theo thời gian tạo (Created Range)
            if (filter.getFromDate() != null) {
                // >= Từ ngày 00:00:00
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate().atStartOfDay()));
            }
            if (filter.getToDate() != null) {
                // <= Đến ngày 23:59:59
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate().atTime(23, 59, 59)));
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

    public UserResponse updateUserProfile(User currentUser, UpdateUserProfileRequest request) {

        // 1. Kiểm tra trạng thái tài khoản
        if (currentUser.getStatus() == UserStatus.LOCKED) {
            throw new AppException(ErrorCode.USER_LOCKED);
        }

        boolean isInfoChanged = false;

        // 2. Cập nhật thông tin cơ bản (Ai cũng được sửa)
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            currentUser.setFullName(request.getFullName());
            isInfoChanged = true;
        }
        if (request.getPhoneNumber() != null) {
            currentUser.setPhoneNumber(request.getPhoneNumber());
            isInfoChanged = true;
        }
        if (request.getImageUrl() != null) {
            currentUser.setImageUrl(request.getImageUrl());
            isInfoChanged = true;
        }

        // 3. Logic phân quyền cho qrPaymentUrl
        if (request.getQrPaymentUrl() != null) {
            // Kiểm tra xem User có Role MERCHANT không
            boolean isMerchant = currentUser.getRoles().stream()
                    .anyMatch(role -> "MERCHANT".equalsIgnoreCase(role.getRoleCode()));

            if (isMerchant) {
                currentUser.setQrPaymentUrl(request.getQrPaymentUrl());
                isInfoChanged = true;
            } else {
                // Nếu là USER thường mà cố tình gửi qrPaymentUrl -> Báo lỗi
                // Hoặc bạn có thể chọn cách lờ đi (không update), nhưng báo lỗi sẽ chặt chẽ hơn.
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        // 4. Lưu và gửi thông báo
        if (isInfoChanged) {
            User savedUser = userRepository.save(currentUser);

            // Gửi thông báo
            notificationService.createNotification(
                    savedUser,
                    "Cập nhật thông tin",
                    "Thông tin hồ sơ của bạn đã được cập nhật thành công.",
                    "ACCOUNT",
                    "/profile"
            );

            return mapToUserResponse(savedUser);
        }

        return mapToUserResponse(currentUser);
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
                .userType(user.getUserType())
                .status(user.getStatus() != null ? user.getStatus() : UserStatus.LOCKED)
                .imageUrl(user.getImageUrl())
                .roles(roles)
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}