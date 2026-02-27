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
            throw new AppException(ErrorCode.INVALID_REQUEST); // ErrorCode.USERNAME_EXISTED
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.INVALID_REQUEST); // ErrorCode.EMAIL_EXISTED
        }

        Role selectedRole = roleRepository.findByRoleCode(request.getRole())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        UserType derivedUserType = mapRoleToUserType(selectedRole.getRoleCode());

        // [FIX] Sử dụng new HashSet<>(...) để tạo Mutable Set
        Set<Role> roles = new HashSet<>(Collections.singleton(selectedRole));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .status(UserStatus.ACTIVE)
                .userType(derivedUserType)
                .roles(roles) // <-- Đã fix
                .build();

        User savedUser = userRepository.save(user);
        createDefaultWallet(savedUser);

        saveAuditLog(admin, "CREATE_USER", savedUser.getUserId(),
                "Tạo user: " + savedUser.getUsername() + " - Role: " + selectedRole.getRoleCode());

        notifyUser(admin, "Tạo thành công", "Đã tạo User: " + savedUser.getUsername());

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

        StringBuilder changeDetails = new StringBuilder();
        boolean statusChangedToInactive = false;

        if (StringUtils.hasText(request.getFullName())) user.setFullName(request.getFullName());
        if (StringUtils.hasText(request.getPhoneNumber())) user.setPhoneNumber(request.getPhoneNumber());
        if (StringUtils.hasText(request.getImageUrl())) user.setImageUrl(request.getImageUrl());

        if (StringUtils.hasText(request.getNewPassword())) {
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            changeDetails.append("Reset mật khẩu. ");
        }

        if (request.getStatus() != null && request.getStatus() != user.getStatus()) {
            changeDetails.append("Status: ").append(user.getStatus()).append(" -> ").append(request.getStatus()).append(". ");
            user.setStatus(request.getStatus());
            if (isInactiveStatus(request.getStatus())) statusChangedToInactive = true;
        }

        // [FIX] Update Role -> Tự động update UserType & Dùng Mutable Set
        if (StringUtils.hasText(request.getRole())) {
            Role newRole = roleRepository.findByRoleCode(request.getRole())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

            String currentRoleCode = user.getRoles().stream().findFirst().map(Role::getRoleCode).orElse("");

            if (!currentRoleCode.equals(newRole.getRoleCode())) {
                // [QUAN TRỌNG] Tạo HashSet mới thay vì dùng Collections.singleton
                user.setRoles(new HashSet<>(Collections.singleton(newRole)));

                user.setUserType(mapRoleToUserType(newRole.getRoleCode()));
                changeDetails.append("Role: ").append(currentRoleCode).append(" -> ").append(newRole.getRoleCode());
            }
        }

        User savedUser = userRepository.save(user);

        if (statusChangedToInactive) {
            deactivateUserAssets(savedUser);
            saveAuditLog(admin, "DEACTIVATE_USER", savedUser.getUserId(), changeDetails.toString());
        } else if (changeDetails.length() > 0) {
            saveAuditLog(admin, "UPDATE_USER", savedUser.getUserId(), changeDetails.toString());
        }

        return mapToFullUserResponse(savedUser);
    }

    private UserType mapRoleToUserType(String roleCode) {
        if (roleCode == null) return UserType.USER;

        // Logic mapping cứng dựa trên quy ước đặt tên
        String upperRole = roleCode.toUpperCase();

        if (upperRole.contains("ADMIN")) return UserType.ADMIN;
        if (upperRole.contains("MERCHANT")) return UserType.MERCHANT;
        if (upperRole.contains("ACCOUNTANT")) return UserType.ACCOUNTANT;

        return UserType.USER; // Mặc định là Student/User thường
    }

    private void createDefaultWallet(User user) {
        UserCredit credit = UserCredit.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .totalDeposited(BigDecimal.ZERO)
                .currentDaySpending(BigDecimal.ZERO)
                .lastSpendingDate(LocalDate.now())
                // .status(CreditStatus.ACTIVE) // Nếu Entity có field status
                .build();
        userCreditRepository.save(credit);
    }

    private boolean isInactiveStatus(UserStatus status) {
        return status == UserStatus.LOCKED || status == UserStatus.SUSPENDED || status == UserStatus.DELETED;
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