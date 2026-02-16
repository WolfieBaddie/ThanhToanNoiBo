package com.example.thanhtoannoibo.Service.Catalog.Manager;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Admin.AdminUpdateCounterRequest;
import com.example.thanhtoannoibo.DTO.Request.Admin.UpdateMerchantItemStatusRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdatePackageRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdateServiceRequest;
import com.example.thanhtoannoibo.DTO.Response.Admin.AdminMerchantDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Admin.MerchantSummaryResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.CounterRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
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
public class AdminMerchantManager {

    private final UserRepository userRepository;
    private final CounterRepository counterRepository;
    private final AppServiceRepository appServiceRepository;
    private final AppPackageRepository appPackageRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final QrCodeRepository qrCodeRepository;

    // System Services
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;
    private final AuthService authService;
    private final HttpServletRequest httpRequest;

    public Page<MerchantSummaryResponse> getMerchants(String keyword, UserStatus status, Pageable pageable) {
        // 1. Tạo Specification (Giữ nguyên logic lọc)
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("userType"), UserType.MERCHANT));

            if (StringUtils.hasText(keyword)) {
                String key = "%" + keyword.toLowerCase() + "%";
                Predicate namePred = cb.like(cb.lower(root.get("fullName")), key);
                Predicate emailPred = cb.like(cb.lower(root.get("email")), key);
                // ... các điều kiện tìm kiếm khác
                predicates.add(cb.or(namePred, emailPred));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // 2. Query DB -> Lấy Page<User>
        Page<User> userPage = userRepository.findAll(spec, pageable);

        // 3. Map từ Page<User> -> Page<MerchantSummaryResponse>
        // Dùng hàm .map() của Page interface cực kỳ gọn
        return userPage.map(user -> {
            String counterName = "Chưa thiết lập";
            String counterLocation = "-";
            long serviceCount = 0;
            long packageCount = 0;

            // Logic tìm quầy và count (Có thể tối ưu bằng @Formula hoặc Join query sau này)
            Optional<Counter> counterOpt = counterRepository.findByManagedBy_UserId(user.getUserId());
            if (counterOpt.isPresent()) {
                Counter c = counterOpt.get();
                counterName = c.getCounterName();
                counterLocation = c.getLocation();
                serviceCount = appServiceRepository.countByCounter_CounterId(c.getCounterId());
                packageCount = appPackageRepository.countByCounter_CounterId(c.getCounterId());
            }

            return MerchantSummaryResponse.builder()
                    .userId(user.getUserId())
                    .fullName(user.getFullName())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .phoneNumber(user.getPhoneNumber())
                    .status(user.getStatus())
                    .imageUrl(user.getImageUrl())
                    .createdAt(user.getCreatedAt())
                    .counterName(counterName)
                    .counterLocation(counterLocation)
                    .totalServices(serviceCount)
                    .totalPackages(packageCount)
                    .build();
        });
    }


    public AdminMerchantDetailResponse getMerchantDetail(UUID merchantId) {
        // 1. Lấy thông tin User
        User merchant = userRepository.findById(merchantId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (merchant.getUserType() != UserType.MERCHANT) {
            throw new AppException(ErrorCode.INVALID_REQUEST); // Error: Not a merchant
        }

        // 2. Lấy thông tin Counter
        Counter counter = counterRepository.findByManagedBy_UserId(merchantId).orElse(null);

        AdminMerchantDetailResponse.CounterInfo counterInfo = null;
        List<AdminMerchantDetailResponse.ItemInfo> serviceInfos = new ArrayList<>();
        List<AdminMerchantDetailResponse.ItemInfo> packageInfos = new ArrayList<>();

        if (counter != null) {
            counterInfo = AdminMerchantDetailResponse.CounterInfo.builder()
                    .counterId(counter.getCounterId())
                    .counterName(counter.getCounterName())
                    .counterCode(counter.getCounterCode())
                    .location(counter.getLocation())
                    .status(counter.getStatus())
                    .build();

            // 3. Lấy Services
            List<AppService> services = appServiceRepository.findAllByCounter_CounterId(counter.getCounterId());
            serviceInfos = services.stream().map(s -> AdminMerchantDetailResponse.ItemInfo.builder()
                    .itemId(s.getServiceId())
                    .itemCode(s.getServiceCode())
                    .itemName(s.getServiceName())
                    .price(s.getUnitPrice())
                    .status(s.getStatus())
                    .imageUrl(s.getImageUrl())
                    .type("SERVICE")
                    .build()).collect(Collectors.toList());

            // 4. Lấy Packages
            List<AppPackage> packages = appPackageRepository.findByServices_Counter_CounterId(counter.getCounterId());
            // Note: Cần query distinct hoặc xử lý logic tùy repo
            packageInfos = packages.stream().map(p -> AdminMerchantDetailResponse.ItemInfo.builder()
                    .itemId(p.getPackageId())
                    .itemCode(p.getPackageCode())
                    .itemName(p.getPackageName())
                    .price(p.getPrice())
                    .status(p.getStatus())
                    .type("PACKAGE")
                    .build()).collect(Collectors.toList());
        }

        return AdminMerchantDetailResponse.builder()
                .userId(merchant.getUserId())
                .fullName(merchant.getFullName())
                .email(merchant.getEmail())
                .phoneNumber(merchant.getPhoneNumber())
                .userStatus(merchant.getStatus())
                .counter(counterInfo)
                .services(serviceInfos)
                .packages(packageInfos)
                .build();
    }

    /**
     * 2. CẬP NHẬT ĐỊA CHỈ / THÔNG TIN QUẦY
     */
    @Transactional
    public void updateCounterInfo(UUID merchantId, AdminUpdateCounterRequest request) {
        User admin = authService.getCurrentUser(httpRequest);
        Counter counter = counterRepository.findByManagedBy_UserId(merchantId)
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        String oldLocation = counter.getLocation();

        counter.setCounterName(request.getCounterName());
        counter.setLocation(request.getLocation());
        if (request.getStatus() != null) {
            counter.setStatus(request.getStatus());
        }

        counterRepository.save(counter);

        // Audit Log
        logAction(admin, "UPDATE_COUNTER", counter.getCounterId(),
                "Cập nhật quầy: " + counter.getCounterCode() + ". Địa chỉ cũ: " + oldLocation + " -> Mới: " + request.getLocation());

        // Notify Merchant
        notifyUser(counter.getManagedBy(), "Cập nhật thông tin quầy",
                "Quản trị viên đã cập nhật thông tin quầy hàng của bạn.");
    }

    @Transactional
    public void updateMerchantPackage(UUID packageId, UpdatePackageRequest request) {
        User admin = authService.getCurrentUser(httpRequest);

        AppPackage appPackage = appPackageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));

        if (appPackage.getCounter() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        StringBuilder logDesc = new StringBuilder();

        // 1. Update Info Basic
        if (StringUtils.hasText(request.getPackageName())) appPackage.setPackageName(request.getPackageName());
        if (request.getPrice() != null) appPackage.setPrice(request.getPrice());
        if (StringUtils.hasText(request.getDescription())) appPackage.setDescription(request.getDescription());

        // 2. Update Composition (Thêm/Xóa Service khỏi Package)
        if (request.getServiceIds() != null) {
            // Lấy danh sách Service mới
            List<AppService> newServices = appServiceRepository.findAllById(request.getServiceIds());

            // Validate: Tất cả service phải thuộc về CÙNG 1 Counter của Merchant này
            UUID merchantCounterId = appPackage.getCounter().getCounterId();
            boolean invalidService = newServices.stream()
                    .anyMatch(s -> s.getCounter() == null || !s.getCounter().getCounterId().equals(merchantCounterId));

            if (invalidService) {
                throw new AppException(ErrorCode.INVALID_REQUEST); // Service không thuộc về merchant này
            }

            // Update Relation (JPA sẽ tự handle xóa cũ thêm mới trong bảng trung gian)
            appPackage.setServices(new HashSet<>(newServices));
            logDesc.append("Updated services list. ");
        }

        // 3. Handle Status Change
        if (request.getStatus() != null && request.getStatus() != appPackage.getStatus()) {
            handlePackageStatusChange(appPackage, request.getStatus(), admin, logDesc);
            appPackage.setStatus(request.getStatus());
        }

        appPackageRepository.save(appPackage);

        logAction(admin, "UPDATE_MERCHANT_PACKAGE", packageId, "Update details. " + logDesc);
    }

    @Transactional
    public void updateMerchantService(UUID serviceId, UpdateServiceRequest request) {
        User admin = authService.getCurrentUser(httpRequest);

        AppService service = appServiceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        // Validation: Chỉ sửa service của Merchant (có Counter), không sửa Master
        if (service.getCounter() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        StringBuilder logDesc = new StringBuilder();

        // 1. Update Info
        if (StringUtils.hasText(request.getServiceName())) service.setServiceName(request.getServiceName());
        if (request.getUnitPrice() != null) service.setUnitPrice(request.getUnitPrice());
        if (StringUtils.hasText(request.getImageUrl())) service.setImageUrl(request.getImageUrl());

        // 2. Handle Status Change (Duyệt / Từ chối / Khóa / Xóa)
        if (request.getStatus() != null && request.getStatus() != service.getStatus()) {
            handleStatusChange(service, request.getStatus(), admin, logDesc);
            service.setStatus(request.getStatus());
        }

        appServiceRepository.save(service);

        logAction(admin, "UPDATE_MERCHANT_SERVICE", serviceId, "Update details. " + logDesc);
    }

    /**
     * 3. QUẢN LÝ SERVICE (Duyệt / Khóa / Xóa)
     */
    @Transactional
    public void updateServiceStatus(UUID serviceId, UpdateMerchantItemStatusRequest request) {
        User admin = authService.getCurrentUser(httpRequest);
        AppService service = appServiceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        CatalogStatus oldStatus = service.getStatus();
        CatalogStatus newStatus = request.getStatus();

        // Nếu trạng thái mới là KHÓA hoặc XÓA -> Kích hoạt Cascade Lock
        if (isLockOrDelete(newStatus)) {
            lockRelatedVouchersAndQRs(Collections.singletonList(serviceId), Collections.emptyList(), request.getReason());
        }

        service.setStatus(newStatus);
        appServiceRepository.save(service);

        // Log & Notify
        String reason = request.getReason() != null ? request.getReason() : "Thay đổi bởi Admin";
        logAction(admin, "UPDATE_SERVICE_STATUS", serviceId,
                "Service: " + service.getServiceName() + ". Status: " + oldStatus + " -> " + newStatus + ". Lý do: " + reason);

        if (service.getCounter() != null) {
            notifyUser(service.getCounter().getManagedBy(), "Trạng thái dịch vụ thay đổi",
                    "Dịch vụ " + service.getServiceName() + " đã chuyển sang trạng thái: " + newStatus);
        }
    }

    /**
     * 4. QUẢN LÝ PACKAGE (Duyệt / Khóa / Xóa)
     */
    @Transactional
    public void updatePackageStatus(UUID packageId, UpdateMerchantItemStatusRequest request) {
        User admin = authService.getCurrentUser(httpRequest);
        AppPackage appPackage = appPackageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));

        CatalogStatus oldStatus = appPackage.getStatus();
        CatalogStatus newStatus = request.getStatus();

        // Cascade Lock
        if (isLockOrDelete(newStatus)) {
            lockRelatedVouchersAndQRs(Collections.emptyList(), Collections.singletonList(packageId), request.getReason());
        }

        appPackage.setStatus(newStatus);
        appPackageRepository.save(appPackage);

        // Log & Notify
        String reason = request.getReason() != null ? request.getReason() : "Thay đổi bởi Admin";
        logAction(admin, "UPDATE_PACKAGE_STATUS", packageId,
                "Package: " + appPackage.getPackageName() + ". Status: " + oldStatus + " -> " + newStatus);

        if (appPackage.getCounter() != null) {
            notifyUser(appPackage.getCounter().getManagedBy(), "Trạng thái gói dịch vụ thay đổi",
                    "Gói " + appPackage.getPackageName() + " đã chuyển sang trạng thái: " + newStatus);
        }
    }

    private void handleStatusChange(AppService service, CatalogStatus newStatus, User admin, StringBuilder log) {
        User merchant = service.getCounter().getManagedBy();

        // A. Logic Duyệt (PENDING -> ACTIVE/REJECTED)
        if (service.getStatus() == CatalogStatus.PENDING) {
            if (newStatus == CatalogStatus.ACTIVE) {
                notifyUser(merchant, "Dịch vụ được duyệt", "Dịch vụ " + service.getServiceName() + " đã được Admin phê duyệt.");
                log.append("Action: APPROVE. ");
            }
        }

        // B. Logic Khóa/Xóa (Cascade Lock)
        if (isLockOrDelete(newStatus)) {
            lockRelatedVouchersAndQRs(Collections.singletonList(service.getServiceId()), Collections.emptyList(), "Admin Action");
            log.append("Action: LOCK/DELETE. ");
        }
    }

    private void handlePackageStatusChange(AppPackage pkg, CatalogStatus newStatus, User admin, StringBuilder log) {
        User merchant = pkg.getCounter().getManagedBy();

        if (pkg.getStatus() == CatalogStatus.PENDING) {
            if (newStatus == CatalogStatus.ACTIVE) {
                notifyUser(merchant, "Gói được duyệt", "Gói " + pkg.getPackageName() + " đã được Admin phê duyệt.");
                log.append("Action: APPROVE. ");
            }
        }

        if (isLockOrDelete(newStatus)) {
            lockRelatedVouchersAndQRs(Collections.emptyList(), Collections.singletonList(pkg.getPackageId()), "Admin Action");
            log.append("Action: LOCK/DELETE. ");
        }
    }

    // =========================================================================
    // PRIVATE HELPERS: CASCADING LOCK & UTILS
    // =========================================================================

    private boolean isLockOrDelete(CatalogStatus status) {
        return status == CatalogStatus.INACTIVE || status == CatalogStatus.DELETED || status == CatalogStatus.PENDING;
    }

    /**
     * Logic Khóa Dây Chuyền: Tìm Voucher liên quan -> Khóa Voucher -> Hủy QR
     */
    private void lockRelatedVouchersAndQRs(List<UUID> serviceIds, List<UUID> packageIds, String reason) {
        Set<UserVoucher> vouchersToLock = new HashSet<>();

        // 1. Tìm Voucher theo Service
        if (!serviceIds.isEmpty()) {
            vouchersToLock.addAll(userVoucherRepository.findActiveVouchersByServiceIds(serviceIds));
        }
        // 2. Tìm Voucher theo Package
        if (!packageIds.isEmpty()) {
            vouchersToLock.addAll(userVoucherRepository.findActiveVouchersByPackageIds(packageIds));
        }

        if (vouchersToLock.isEmpty()) return;

        List<UUID> voucherIds = vouchersToLock.stream().map(UserVoucher::getVoucherId).collect(Collectors.toList());

        // 3. Update Voucher Status -> LOCKED
        vouchersToLock.forEach(v -> v.setStatus(UserVoucherStatus.LOCKED));
        userVoucherRepository.saveAll(vouchersToLock);

        // 4. Revoke QRs
        qrCodeRepository.lockQrCodesByVoucherIds(voucherIds, QrCodeStatus.REVOKED);

        // 5. Notify Customers (Người đang giữ voucher bị khóa)
        Map<User, Long> affectedCustomers = vouchersToLock.stream()
                .collect(Collectors.groupingBy(UserVoucher::getOwner, Collectors.counting()));

        affectedCustomers.forEach((customer, count) -> {
            notifyUser(customer, "Cảnh báo dịch vụ",
                    "Cảnh báo: " + count + " voucher của bạn đã bị tạm khóa do dịch vụ gốc bị Admin vô hiệu hóa. Lý do: " + reason);
        });
    }

    private void logAction(User actor, String action, UUID targetId, String description) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("description", description);
            AuditLog log = AuditLog.builder()
                    .user(actor).action(action).entityType("MERCHANT_MGMT").entityId(targetId)
                    .details(details).ipAddress("0.0.0.0").createdAt(LocalDateTime.now()).build();
            auditLogRepository.save(log);
        } catch (Exception ignored) {}
    }

    private void notifyUser(User user, String title, String message) {
        try {
            notificationService.createNotification(user, title, message, "SYSTEM", "/notifications");
        } catch (Exception ignored) {}
    }
}