package com.example.thanhtoannoibo.Service.Catalog.Manager;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.UserType;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreatePackageRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdatePackageRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Security.AuditLog; // [MỚI]
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository; // [MỚI]
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminPackageManager {

    private final AppPackageRepository appPackageRepository;
    private final AppServiceRepository appServiceRepository;
    private final AuthService authService;
    private final HttpServletRequest httpRequest;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository; // [MỚI] Inject Repo

    // =========================================================================
    // 1. READ (Lấy danh sách - Admin quyền năng nhất)
    // =========================================================================
    @Transactional(readOnly = true)
    public Page<PackageResponse> getAllPackages(ServiceFilterRequest filter, Pageable pageable) {
        validateAdmin();

        // Sử dụng Custom Specification để Admin có thể xem được cả DELETED
        Specification<AppPackage> spec = (root, query, criteriaBuilder) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();
            Join<AppPackage, AppService> servicesJoin = root.join("services", JoinType.LEFT);

            // 1. Lọc theo System/Merchant
            if (Boolean.TRUE.equals(filter.getSystem())) {
                predicates.add(criteriaBuilder.isNull(servicesJoin.get("counter")));
            }

            // 2. Lọc theo Trạng thái
            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }

            // 3. Keyword
            if (StringUtils.hasText(filter.getKeyword())) {
                String likePattern = "%" + filter.getKeyword().toLowerCase().trim() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("packageName")), likePattern);
                Predicate codeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("packageCode")), likePattern);
                predicates.add(criteriaBuilder.or(nameLike, codeLike));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return appPackageRepository.findAll(spec, pageable).map(this::convertToPackageResponse);
    }

    // =========================================================================
    // 2. CREATE (Tạo gói System)
    // =========================================================================
    @Transactional
    public PackageResponse create(CreatePackageRequest request) {
        User admin = validateAdmin();

        if (appPackageRepository.findByPackageCode(request.getPackageCode()).isPresent()) {
            throw new AppException(ErrorCode.PACKAGE_CODE_EXISTS);
        }

        // Validate Services
        List<AppService> servicesToAdd = appServiceRepository.findAllById(request.getServiceIds());
        if (servicesToAdd.isEmpty()) {
            throw new AppException(ErrorCode.SERVICE_NOT_FOUND);
        }

        AppPackage newPackage = AppPackage.builder()
                .packageCode(request.getPackageCode().toUpperCase())
                .packageName(request.getPackageName())
                .description(request.getDescription())
                .price(request.getPrice())
                .comboType(request.getComboType() != null ? request.getComboType() : "ALL_INCLUSIVE")
                .creditValue(request.getCreditValue())
                .status(CatalogStatus.ACTIVE) // Admin tạo mặc định Active
                .services(new HashSet<>(servicesToAdd))
                .build();

        AppPackage saved = appPackageRepository.save(newPackage);

        // [AUDIT LOG]
        saveAuditLog(admin, "CREATE_PACKAGE", saved.getPackageId(),
                "Tạo gói combo mới: " + saved.getPackageName() + " (" + saved.getPackageCode() + ")");

        // [NOTIFY ADMIN]
        notifyUser(admin, "Tạo gói thành công", "Bạn đã tạo gói combo hệ thống: " + saved.getPackageName());

        return convertToPackageResponse(saved);
    }

    // =========================================================================
    // 3. UPDATE (Cập nhật / Duyệt / Khóa)
    // =========================================================================
    @Transactional
    public PackageResponse update(UUID packageId, UpdatePackageRequest request) {
        User admin = validateAdmin();

        AppPackage pkg = appPackageRepository.findByIdWithServices(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));

        // --- CHECK DELETED STATUS (Logic cốt lõi) ---
        if (pkg.getStatus() == CatalogStatus.DELETED) {
            if (request.getStatus() == null || request.getStatus() == CatalogStatus.DELETED) {
                throw new AppException(ErrorCode.PACKAGE_UPDATE_RESTRICTED);
            }
        }

        StringBuilder changeDetails = new StringBuilder(); // Theo dõi thay đổi
        boolean isUpdated = false;

        // 1. Update Status (Duyệt/Khóa/Khôi phục)
        if (request.getStatus() != null && request.getStatus() != pkg.getStatus()) {
            changeDetails.append(String.format("Trạng thái: %s -> %s. ", pkg.getStatus(), request.getStatus()));
            CatalogStatus oldStatus = pkg.getStatus();
            pkg.setStatus(request.getStatus());
            isUpdated = true;

            // Logic Duyệt: Pending -> Active
            if (oldStatus == CatalogStatus.PENDING && request.getStatus() == CatalogStatus.ACTIVE) {
                // [NOTIFY MERCHANT]
                notifyOwner(pkg, "Duyệt gói thành công", "Gói combo '" + pkg.getPackageName() + "' đã được Admin phê duyệt.");
                // [NOTIFY ADMIN]
                notifyUser(admin, "Phê duyệt thành công", "Bạn đã duyệt gói combo: " + pkg.getPackageName());
            }
            else {
                // Logic đổi trạng thái khác
                String action = (request.getStatus() == CatalogStatus.DELETED) ? "Xóa" : "Cập nhật trạng thái";
                notifyUser(admin, action, "Đã đổi trạng thái gói " + pkg.getPackageName() + " sang " + request.getStatus());
            }
        }

        // 2. Update Info
        if (StringUtils.hasText(request.getPackageName()) && !request.getPackageName().equals(pkg.getPackageName())) {
            changeDetails.append(String.format("Tên: '%s' -> '%s'. ", pkg.getPackageName(), request.getPackageName()));
            pkg.setPackageName(request.getPackageName());
            isUpdated = true;
        }
        if (request.getPrice() != null && request.getPrice().compareTo(pkg.getPrice()) != 0) {
            changeDetails.append(String.format("Giá: %s -> %s. ", pkg.getPrice(), request.getPrice()));
            pkg.setPrice(request.getPrice());
            isUpdated = true;
        }
        if (StringUtils.hasText(request.getDescription()) && !request.getDescription().equals(pkg.getDescription())) {
            changeDetails.append("Cập nhật mô tả. ");
            pkg.setDescription(request.getDescription());
            isUpdated = true;
        }
        if (request.getComboType() != null && !request.getComboType().equals(pkg.getComboType())) {
            changeDetails.append(String.format("Loại Combo: %s -> %s. ", pkg.getComboType(), request.getComboType()));
            pkg.setComboType(request.getComboType());
            isUpdated = true;
        }

        // 3. Update Services List
        if (request.getServiceIds() != null) {
            List<AppService> newServices = appServiceRepository.findAllById(request.getServiceIds());
            if (newServices.isEmpty()) throw new AppException(ErrorCode.SERVICE_NOT_FOUND);

            pkg.setServices(new HashSet<>(newServices));
            changeDetails.append("Cập nhật danh sách dịch vụ trong gói. ");
            isUpdated = true;
        }

        if (isUpdated) {
            AppPackage saved = appPackageRepository.save(pkg);

            // [AUDIT LOG]
            // Xác định Action name cho log đẹp hơn
            String actionName = "UPDATE_PACKAGE";
            if (saved.getStatus() == CatalogStatus.DELETED) actionName = "DELETE_PACKAGE";
            else if (changeDetails.toString().contains("PENDING -> ACTIVE")) actionName = "APPROVE_PACKAGE";

            saveAuditLog(admin, actionName, saved.getPackageId(), changeDetails.toString());

            // Nếu chỉ update info mà ko đổi status -> báo Admin là đã update
            if (request.getStatus() == null) {
                notifyUser(admin, "Cập nhật gói", "Bạn đã sửa thông tin gói: " + saved.getPackageName());
            }
            return convertToPackageResponse(saved);
        }
        return convertToPackageResponse(pkg);
    }

    // =========================================================================
    // 4. DELETE (Xóa mềm)
    // =========================================================================
    @Transactional
    public void delete(UUID packageId) {
        User admin = validateAdmin();

        AppPackage pkg = appPackageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));

        if (pkg.getStatus() == CatalogStatus.DELETED) {
            return;
        }

        pkg.setStatus(CatalogStatus.DELETED);
        appPackageRepository.save(pkg);

        // [AUDIT LOG]
        saveAuditLog(admin, "DELETE_PACKAGE", pkg.getPackageId(), "Xóa mềm gói combo (Chuyển trạng thái sang DELETED)");

        // [NOTIFY ADMIN]
        notifyUser(admin, "Xóa gói combo", "Bạn đã xóa gói: " + pkg.getPackageName());
    }

    // =========================================================================
    // 5. APPROVE SHORTCUT
    // =========================================================================
    @Transactional
    public PackageResponse approve(UUID packageId) {
        UpdatePackageRequest req = new UpdatePackageRequest();
        req.setStatus(CatalogStatus.ACTIVE);
        return update(packageId, req); // Reuse logic update
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private User validateAdmin() {
        User u = authService.getCurrentUser(httpRequest);
        if (u.getUserType() != UserType.ADMIN) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return u;
    }

    /**
     * [MỚI] Helper ghi Audit Log
     */
    private void saveAuditLog(User actor, String action, UUID entityId, String description) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("description", description);
            details.put("timestamp", System.currentTimeMillis());

            AuditLog log = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityType("PACKAGE") // Loại đối tượng
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(getClientIp())
                    .createdAt(LocalDateTime.now())
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Lỗi lưu AuditLog Package: " + e.getMessage());
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

    private void notifyUser(User user, String title, String message) {
        try {
            String targetUrl = (user.getUserType() == UserType.ADMIN)
                    ? "/admin/packages"
                    : "/merchant/packages";
            notificationService.createNotification(user, title, message, "SUCCESS", targetUrl);
        } catch (Exception ignored) {}
    }

    private void notifyOwner(AppPackage pkg, String title, String message) {
        if (!pkg.getServices().isEmpty()) {
            AppService firstService = pkg.getServices().iterator().next();
            if (firstService.getCounter() != null && firstService.getCounter().getManagedBy() != null) {
                notifyUser(firstService.getCounter().getManagedBy(), title, message);
            }
        }
    }

    private PackageResponse convertToPackageResponse(AppPackage entity) {
        List<PackageResponse.PackageServiceItem> items = entity.getServices().stream()
                .map(service -> PackageResponse.PackageServiceItem.builder()
                        .serviceId(service.getServiceId())
                        .serviceName(service.getServiceName())
                        .imageUrl(service.getImageUrl())
                        .originalPrice(service.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        // 2. [MỚI] Map thông tin Merchant & Counter
        PackageResponse.MerchantInfo merchantInfo = null;
        if (entity.getCounter() != null) {
            User owner = entity.getCounter().getManagedBy();
            merchantInfo = PackageResponse.MerchantInfo.builder()
                    .counterId(entity.getCounter().getCounterId())
                    .counterName(entity.getCounter().getCounterName())
                    .location(entity.getCounter().getLocation()) // Quan trọng cho User
                    .merchantId(owner != null ? owner.getUserId() : null)
                    .merchantName(owner != null ? owner.getFullName() : "Unknown Merchant")
                    .build();
        }

        return PackageResponse.builder()
                .packageId(entity.getPackageId())
                .packageCode(entity.getPackageCode())
                .packageName(entity.getPackageName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .packageType(entity.getPackageType())
                .comboType(entity.getComboType())
                .creditValue(entity.getCreditValue())
                .status(entity.getStatus())
                .items(items)
                .merchantInfo(merchantInfo) // Set info vào response
                .build();
    }
}