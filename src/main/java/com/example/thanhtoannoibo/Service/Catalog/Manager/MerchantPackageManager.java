package com.example.thanhtoannoibo.Service.Catalog.Manager;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreatePackageRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdatePackageRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
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
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MerchantPackageManager {

    private final AppPackageRepository packageRepository;
    private final AppServiceRepository serviceRepository;
    private final CounterRepository counterRepository;

    // [MỚI] Inject thêm các Repo để xử lý khóa và log
    private final UserVoucherRepository userVoucherRepository;
    private final QrCodeRepository qrCodeRepository;
    private final AuditLogRepository auditLogRepository;

    private final AuthService authService;
    private final HttpServletRequest httpRequest;
    private final NotificationService notificationService;

    // ... (Hàm create giữ nguyên như phiên bản trước)

    @Transactional
    public PackageResponse create(CreatePackageRequest request) {
        User currentUser = validateMerchant();
        Counter counter = getMerchantCounter(currentUser);

        if (packageRepository.existsByPackageCode(request.getPackageCode())) {
            throw new AppException(ErrorCode.PACKAGE_CODE_EXISTS);
        }

        Set<AppService> selectedServices = new HashSet<>();
        if (!CollectionUtils.isEmpty(request.getServiceIds())) {
            List<AppService> services = serviceRepository.findAllById(request.getServiceIds());
            boolean allOwnedByMe = services.stream()
                    .allMatch(s -> s.getCounter() != null
                            && s.getCounter().getCounterId().equals(counter.getCounterId()));

            if (!allOwnedByMe) {
                throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
            }
            selectedServices.addAll(services);
        }

        AppPackage newPackage = AppPackage.builder()
                .packageCode(request.getPackageCode())
                .packageName(request.getPackageName())
                .description(request.getDescription())
                .packageType("ITEM_QUANTITY")
                .price(request.getPrice())
                .status(CatalogStatus.PENDING)
                .counter(counter)
                .services(selectedServices)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        AppPackage savedPackage = packageRepository.save(newPackage);

        // [MỚI] Ghi Audit Log
        logAction(currentUser, "CREATE", savedPackage.getPackageId(), "Tạo gói combo mới: " + savedPackage.getPackageName());

        sendNotification(currentUser, "Đã gửi yêu cầu duyệt",
                "Gói combo '" + savedPackage.getPackageName() + "' đang chờ Admin phê duyệt.");

        return convertToResponse(savedPackage);
    }

    /**
     * Cập nhật thông tin gói & Xử lý trạng thái
     */
    @Transactional
    public PackageResponse update(UUID packageId, UpdatePackageRequest request) {
        User currentUser = validateMerchant();
        Counter counter = getMerchantCounter(currentUser);

        AppPackage pkg = packageRepository.findByIdWithServices(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        if (!pkg.getCounter().getCounterId().equals(counter.getCounterId())) {
            throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
        }

        // [LUẬT 1] Đang chờ duyệt thì "bất động", không cho sửa gì cả
        if (pkg.getStatus() == CatalogStatus.PENDING) {
            throw new AppException(ErrorCode.ITEM_IS_PENDING);
        }

        boolean contentChanged = false;
        StringBuilder logDetails = new StringBuilder();

        // 1. Check thay đổi nội dung
        if (request.getPackageName() != null && !request.getPackageName().equals(pkg.getPackageName())) {
            pkg.setPackageName(request.getPackageName());
            contentChanged = true;
        }
        if (request.getPrice() != null && request.getPrice().compareTo(pkg.getPrice()) != 0) {
            pkg.setPrice(request.getPrice());
            contentChanged = true;
        }
        if (request.getDescription() != null && !request.getDescription().equals(pkg.getDescription())) {
            pkg.setDescription(request.getDescription());
            contentChanged = true;
        }
        if (request.getServiceIds() != null) {
            // Logic check owner services mới...
            List<AppService> newServices = serviceRepository.findAllById(request.getServiceIds());
            if (newServices.stream().anyMatch(s -> !s.getCounter().getCounterId().equals(counter.getCounterId()))) {
                throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
            }
            pkg.setServices(new HashSet<>(newServices));
            contentChanged = true;
        }

        // 2. Xử lý logic chuyển đổi
        if (contentChanged) {
            // [LUẬT 2] Có sửa nội dung -> Bắt buộc về PENDING
            pkg.setStatus(CatalogStatus.PENDING);
            logDetails.append("Cập nhật nội dung -> Chuyển về Pending.");

            // Đang bán mà sửa nội dung -> Pending -> Coi như ngừng bán -> Khóa Voucher
            processLockPackageVouchersAndNotify(pkg, "Gói đang chờ duyệt nội dung mới.");

            sendNotification(currentUser, "Đã gửi yêu cầu cập nhật",
                    "Các thay đổi cho gói '" + pkg.getPackageName() + "' đang chờ duyệt.");

        } else if (request.getStatus() != null && request.getStatus() != pkg.getStatus()) {
            // [LUẬT 3] Chỉ đổi trạng thái (ACTIVE <-> INACTIVE)
            CatalogStatus newStatus = request.getStatus();

            // Cấm tự chuyển về PENDING hoặc DELETED qua API update này
            if (newStatus == CatalogStatus.PENDING) {
                throw new AppException(ErrorCode.CANNOT_REVERT_TO_PENDING);
            }
            if (newStatus == CatalogStatus.DELETED) {
                throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION); // Phải dùng API delete
            }

            if (newStatus == CatalogStatus.INACTIVE) {
                processLockPackageVouchersAndNotify(pkg, "Nhà cung cấp tạm ngưng kinh doanh gói này.");
            }

            pkg.setStatus(newStatus);
            logDetails.append("Đổi trạng thái sang ").append(newStatus);
        }

        pkg.setUpdatedAt(LocalDateTime.now());
        AppPackage saved = packageRepository.save(pkg);
        logAction(currentUser, "UPDATE", pkg.getPackageId(), logDetails.toString());

        return convertToResponse(saved);
    }
    /**
     * [MỚI] Xóa mềm Gói Combo (Soft Delete)
     */
    @Transactional
    public void delete(UUID packageId) {
        User currentUser = validateMerchant();
        Counter counter = getMerchantCounter(currentUser);

        AppPackage pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        if (!pkg.getCounter().getCounterId().equals(counter.getCounterId())) {
            throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
        }

        // [LUẬT] Đang chờ duyệt thì không được xóa
        if (pkg.getStatus() == CatalogStatus.PENDING) {
            throw new AppException(ErrorCode.ITEM_IS_PENDING);
        }

        // Logic xóa mềm
        processLockPackageVouchersAndNotify(pkg, "Gói đã bị xóa khỏi hệ thống.");
        pkg.setStatus(CatalogStatus.DELETED);
        pkg.setUpdatedAt(LocalDateTime.now());
        packageRepository.save(pkg);

        logAction(currentUser, "DELETE", pkg.getPackageId(), "Xóa mềm gói combo");
    }
    // =========================================================================
    // PRIVATE HELPERS: SIDE EFFECTS (LOCK VOUCHER, LOGGING)
    // =========================================================================

    /**
     * Tìm tất cả voucher active của gói này -> Khóa -> Hủy QR -> Bắn Noti User
     */
    private void processLockPackageVouchersAndNotify(AppPackage pkg, String reasonMessage) {
        // 1. Tìm các voucher thuộc gói này đang còn hiệu lực
        // (Giả định repo có hàm findActiveVouchersByPackageId, hoặc bạn tự query theo logic project)
        List<UserVoucher> affectedVouchers = userVoucherRepository.findByPackageIdAndStatus(
                pkg.getPackageId(),
                UserVoucherStatus.ACTIVE
        );

        if (affectedVouchers.isEmpty()) return;

        List<UUID> voucherIds = affectedVouchers.stream()
                .map(UserVoucher::getVoucherId)
                .collect(Collectors.toList());

        // 2. Chuyển trạng thái Voucher sang LOCKED
        for (UserVoucher v : affectedVouchers) {
            v.setStatus(UserVoucherStatus.LOCKED);
        }
        userVoucherRepository.saveAll(affectedVouchers);

        // 3. Vô hiệu hóa QR Code liên quan (Chuyển sang REVOKED)
        qrCodeRepository.lockQrCodesByVoucherIds(voucherIds, QrCodeStatus.REVOKED);

        // 4. Gửi thông báo cho từng Khách hàng bị ảnh hưởng
        Map<User, List<UserVoucher>> vouchersByUser = affectedVouchers.stream()
                .collect(Collectors.groupingBy(UserVoucher::getOwner));

        for (Map.Entry<User, List<UserVoucher>> entry : vouchersByUser.entrySet()) {
            User customer = entry.getKey();
            int count = entry.getValue().size();
            sendNotification(customer, "Thông báo về gói Combo",
                    String.format("Cảnh báo: %d voucher thuộc gói '%s' của bạn đã bị khóa. Lý do: %s",
                            count, pkg.getPackageName(), reasonMessage));
        }
    }

    /**
     * Ghi Audit Log vào DB
     */
    private void logAction(User actor, String action, UUID entityId, String description) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("description", description);
            details.put("timestamp", System.currentTimeMillis());

            AuditLog log = AuditLog.builder()
                    .user(actor)
                    .action(action) // CREATE, UPDATE, DELETE
                    .entityType("APP_PACKAGE")
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

    // --- Helpers cũ ---

    private User validateMerchant() {
        User u = authService.getCurrentUser(httpRequest);
        if (u.getUserType() != UserType.MERCHANT) throw new AppException(ErrorCode.FORBIDDEN);
        return u;
    }

    private Counter getMerchantCounter(User merchant) {
        return counterRepository.findByManagedBy_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));
    }

    private void sendNotification(User user, String title, String message) {
        try {
            String url = (user.getUserType() == UserType.MERCHANT) ? "/merchant/menu" : "/user/my-vouchers";
            notificationService.createNotification(user, title, message, "SUCCESS", url);
        } catch (Exception ignored) {}
    }

    private PackageResponse convertToResponse(AppPackage entity) {
        // ... (Giữ nguyên logic mapping response của bạn)
        List<PackageResponse.PackageServiceItem> items = entity.getServices().stream()
                .map(service -> PackageResponse.PackageServiceItem.builder()
                        .serviceId(service.getServiceId())
                        .serviceName(service.getServiceName())
                        .imageUrl(service.getImageUrl())
                        .originalPrice(service.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        return PackageResponse.builder()
                .packageId(entity.getPackageId())
                .packageCode(entity.getPackageCode())
                .packageName(entity.getPackageName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .packageType(entity.getPackageType())
                .creditValue(entity.getCreditValue())
                .status(entity.getStatus())
                .items(items)
                .build();
    }
}