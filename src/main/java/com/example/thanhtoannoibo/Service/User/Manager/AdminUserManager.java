package com.example.thanhtoannoibo.Service.User.Manager;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.User.CreateUserRequest;
import com.example.thanhtoannoibo.DTO.Request.User.UpdateUserRequest;
import com.example.thanhtoannoibo.DTO.Request.User.UserFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.Role;
import com.example.thanhtoannoibo.Entity.Security.AuditLog; // [MỚI]
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.CounterRepository;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository; // [MỚI]
import com.example.thanhtoannoibo.Repository.Security.RoleRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserManager {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserCreditRepository userCreditRepository;
    private final UserSpecificationBuilder userSpecificationBuilder;
    private final AuditLogRepository auditLogRepository; // [MỚI] Repository ghi log

    // Repositories cho việc deactivate
    private final CounterRepository counterRepository;
    private final AppServiceRepository serviceRepository;
    private final AppPackageRepository packageRepository;
    private final UserVoucherRepository voucherRepository;
    private final QrCodeRepository qrCodeRepository;

    private final AuthService authService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final HttpServletRequest httpRequest;

    // =========================================================================
    // 1. GET USERS (READ)
    // =========================================================================
    public PageResponse<UserResponse> getUsers(UserFilterRequest filter, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword (Username, Email, FullName, Phone)
            if (StringUtils.hasText(filter.getKeyword())) {
                String searchKey = "%" + filter.getKeyword().toLowerCase() + "%";
                Predicate username = cb.like(cb.lower(root.get("username")), searchKey);
                Predicate email = cb.like(cb.lower(root.get("email")), searchKey);
                Predicate fullName = cb.like(cb.lower(root.get("fullName")), searchKey);
                Predicate phone = cb.like(cb.lower(root.get("phoneNumber")), searchKey);
                predicates.add(cb.or(username, email, fullName, phone));
            }

            // 2. Status
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            // 3. UserType (MERCHANT / USER / ADMIN) [QUAN TRỌNG]
            if (filter.getUserType() != null) {
                predicates.add(cb.equal(root.get("userType"), filter.getUserType()));
            }

            // 4. Role (Join bảng roles)
            if (StringUtils.hasText(filter.getRole())) {
                Join<User, Role> roleJoin = root.join("roles", JoinType.INNER);
                predicates.add(cb.equal(roleJoin.get("roleCode"), filter.getRole()));
            }

            // 5. Date Range (createdAt)
            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt").as(java.time.LocalDate.class), filter.getFromDate()));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt").as(java.time.LocalDate.class), filter.getToDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> page = userRepository.findAll(spec, pageable);
        List<UserResponse> items = page.getContent().stream()
                .map(this::mapToFullUserResponse)
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserDetail(UUID userId) {
        validateAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return mapToFullUserResponse(user);
    }

    // =========================================================================
    // 2. CREATE USER
    // =========================================================================
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        User admin = validateAdmin();

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null) {
            for (String roleName : request.getRoles()) {
                Role role = roleRepository.findByRoleCode(roleName)
                        .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
                roles.add(role);
            }
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .userType(request.getUserType())
                .status(UserStatus.ACTIVE)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        // Tạo ví
        UserCredit credit = UserCredit.builder()
                .user(savedUser)
                .balance(BigDecimal.ZERO)
                .totalDeposited(BigDecimal.ZERO)
                .currentDaySpending(BigDecimal.ZERO)
                .lastSpendingDate(LocalDate.now())
                .status(CreditStatus.ACTIVE)
                .build();
        userCreditRepository.save(credit);

        // [AUDIT LOG] Ghi log tạo mới
        saveAuditLog(admin, "CREATE_USER", savedUser.getUserId(),
                "Tạo người dùng mới: " + savedUser.getUsername() + " (" + savedUser.getUserType() + ")");

        // Notification
        notifyUser(admin, "Tạo người dùng thành công",
                "Đã tạo tài khoản " + savedUser.getUsername());
        notifyUser(savedUser, "Chào mừng",
                "Tài khoản của bạn đã được tạo bởi quản trị viên.");

        return mapToFullUserResponse(savedUser);
    }

    // =========================================================================
    // 3. UPDATE USER
    // =========================================================================
    @Transactional
    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {
        User admin = validateAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // StringBuilder để ghi lại chi tiết thay đổi cho AuditLog
        StringBuilder changeDetails = new StringBuilder();
        boolean statusChangedToInactive = false;

        // 1. Update Basic Info
        if (StringUtils.hasText(request.getFullName()) && !request.getFullName().equals(user.getFullName())) {
            changeDetails.append(String.format("Tên: '%s' -> '%s'. ", user.getFullName(), request.getFullName()));
            user.setFullName(request.getFullName());
        }
        if (StringUtils.hasText(request.getPhoneNumber()) && !request.getPhoneNumber().equals(user.getPhoneNumber())) {
            changeDetails.append(String.format("SĐT: '%s' -> '%s'. ", user.getPhoneNumber(), request.getPhoneNumber()));
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (StringUtils.hasText(request.getImageUrl())) {
            user.setImageUrl(request.getImageUrl());
        }

        // 2. Update Status
        if (request.getStatus() != null && request.getStatus() != user.getStatus()) {
            changeDetails.append(String.format("Trạng thái: %s -> %s. ", user.getStatus(), request.getStatus()));
            user.setStatus(request.getStatus());

            if (request.getStatus() == UserStatus.LOCKED ||
                    request.getStatus() == UserStatus.SUSPENDED ||
                    request.getStatus() == UserStatus.DELETED) {
                statusChangedToInactive = true;
            }
        }

        // 3. Update Roles
        if (request.getRoles() != null) {
            Set<Role> newRoles = new HashSet<>();
            for (String roleName : request.getRoles()) {
                Role role = roleRepository.findByRoleCode(roleName)
                        .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
                newRoles.add(role);
            }
            user.setRoles(newRoles);
            changeDetails.append("Cập nhật danh sách quyền hạn. ");
        }

        User savedUser = userRepository.save(user);

        // 4. Handle Deactivation Logic
        if (statusChangedToInactive) {
            deactivateUserAssets(savedUser);

            // [AUDIT LOG] Ghi log khóa/xóa riêng biệt để dễ tracking
            String actionType = (request.getStatus() == UserStatus.DELETED) ? "DELETE_USER" : "DEACTIVATE_USER";
            saveAuditLog(admin, actionType, savedUser.getUserId(),
                    "Vô hiệu hóa tài khoản và tài sản liên quan. Lý do: " + changeDetails.toString());
        } else {
            // [AUDIT LOG] Ghi log cập nhật thông thường nếu có thay đổi
            if (changeDetails.length() > 0) {
                saveAuditLog(admin, "UPDATE_USER", savedUser.getUserId(), changeDetails.toString());
            }
        }

        // Notification
        notifyUser(admin, "Cập nhật người dùng", "Đã cập nhật thông tin user " + savedUser.getUsername());
        notifyUser(savedUser, "Tài khoản cập nhật", "Thông tin tài khoản của bạn vừa được cập nhật bởi QTV.");

        return mapToFullUserResponse(savedUser);
    }

    // =========================================================================
    // 4. DEACTIVATE LOGIC (Private Helper)
    // =========================================================================
    private void deactivateUserAssets(User user) {
        // 1. Khóa tài sản cá nhân của User (Voucher đang sở hữu, QR, Ví)
        voucherRepository.updateStatusByUserId(user.getUserId(), UserVoucherStatus.INACTIVE);
        qrCodeRepository.updateStatusByUserId(user.getUserId(), QrCodeStatus.INACTIVE);

        userCreditRepository.findByUser_UserId(user.getUserId()).ifPresent(credit -> {
            if (credit.getStatus() != CreditStatus.LOCKED) {
                credit.setStatus(CreditStatus.LOCKED);
                userCreditRepository.save(credit);
            }
        });

        // 2. Nếu User là MERCHANT -> Kích hoạt luồng khóa Quầy & Sản phẩm & Voucher của khách
        if (user.getUserType() == UserType.MERCHANT) {
            counterRepository.findByManagedBy_UserId(user.getUserId()).ifPresent(counter -> {

                // A. Khóa Quầy
                counter.setStatus(CatalogStatus.INACTIVE.toString());
                counterRepository.save(counter);

                // B. Lấy danh sách Service & Package thuộc Quầy
                List<AppService> services = serviceRepository.findAllByCounter_CounterId(counter.getCounterId());
                // Logic lấy package: Tìm các package chứa service của counter này
                List<AppPackage> packages = packageRepository.findByServices_Counter_CounterId(counter.getCounterId());

                // C. Khóa Services
                if (!services.isEmpty()) {
                    List<UUID> serviceIds = services.stream().map(AppService::getServiceId).collect(Collectors.toList());

                    // C1. Update status Service -> INACTIVE
                    services.forEach(s -> s.setStatus(CatalogStatus.INACTIVE));
                    serviceRepository.saveAll(services);

                    // C2. [QUAN TRỌNG] Khóa tất cả Voucher của KHÁCH HÀNG liên quan đến các Service này
                    voucherRepository.updateStatusByServiceIds(serviceIds, UserVoucherStatus.INACTIVE);
                }

                // D. Khóa Packages
                if (!packages.isEmpty()) {
                    List<UUID> packageIds = packages.stream().map(AppPackage::getPackageId).collect(Collectors.toList());

                    // D1. Update status Package -> INACTIVE
                    packages.forEach(p -> p.setStatus(CatalogStatus.INACTIVE));
                    packageRepository.saveAll(packages);

                    // D2. [QUAN TRỌNG] Khóa tất cả Voucher của KHÁCH HÀNG liên quan đến các Package này
                    voucherRepository.updateStatusByPackageIds(packageIds, UserVoucherStatus.INACTIVE);
                }
            });
        }
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * [MỚI] Helper ghi Audit Log
     */
    private void saveAuditLog(User actor, String action, UUID targetEntityId, String description) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("description", description);
            details.put("timestamp", System.currentTimeMillis());

            AuditLog log = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityType("USER")
                    .entityId(targetEntityId)
                    .details(details)
                    .ipAddress(getClientIp())
                    .createdAt(LocalDateTime.now())
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Lỗi khi lưu AuditLog: " + e.getMessage());
        }
    }

    private String getClientIp() {
        String remoteAddr = "";
        if (httpRequest != null) {
            remoteAddr = httpRequest.getHeader("X-FORWARDED-FOR");
            if (!StringUtils.hasText(remoteAddr)) {
                remoteAddr = httpRequest.getRemoteAddr();
            }
        }
        return remoteAddr;
    }

    private User validateAdmin() {
        User u = authService.getCurrentUser(httpRequest);
        if (u.getUserType() != UserType.ADMIN) throw new AppException(ErrorCode.FORBIDDEN);
        return u;
    }

    private void notifyUser(User user, String title, String message) {
        try {
            notificationService.createNotification(user, title, message, "INFO", "/profile");
        } catch (Exception ignored) {}
    }

    private UserResponse mapToFullUserResponse(User user) {
        Set<String> roles = new HashSet<>();
        Set<String> permissions = new HashSet<>();

        if (user.getRoles() != null) {
            for (Role role : user.getRoles()) {
                roles.add(role.getRoleName());
                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(p -> permissions.add(p.getPermissionCode()));
                }
            }
        }

        BigDecimal balance = BigDecimal.ZERO;
        // CreditStatus creditStatus = CreditStatus.ACTIVE; // Có thể dùng nếu cần return status ví

        try {
            UserCredit credit = userCreditRepository.findByUser_UserId(user.getUserId()).orElse(null);
            if (credit != null) {
                balance = credit.getBalance();
            }
        } catch (Exception ignored) {}

        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType())
                .status(user.getStatus())
                .imageUrl(user.getImageUrl())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .roles(roles)
                .permissions(permissions)
                .creditBalance(balance)
                .build();

    }
}