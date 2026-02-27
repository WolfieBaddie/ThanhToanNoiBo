package com.example.thanhtoannoibo.Service.Catalog.Manager;
import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Counter.CreateCounterRequest;
import com.example.thanhtoannoibo.DTO.Request.Counter.UpdateCounterRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.CounterResponse;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MerchantCounterManager {
    private final CounterRepository counterRepository;
    private final AppServiceRepository appServiceRepository;
    private final AppPackageRepository appPackageRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final QrCodeRepository qrCodeRepository;
    private final AuditLogRepository auditLogRepository;

    private final AuthService authService;
    private final HttpServletRequest httpRequest;
    private final NotificationService notificationService;

    // --- 1. CREATE COUNTER ---
    @Transactional
    public Counter create(CreateCounterRequest request) {
        User currentUser = validateMerchant();

        // 1. Validate: Mỗi Merchant chỉ được quản lý 1 Counter (hoặc tùy logic)
        if (counterRepository.findByManagedBy_UserId(currentUser.getUserId()).isPresent()) {
            throw new AppException(ErrorCode.COUNTER_ALREADY_EXISTS);
        }

        // 2. Validate Input
        if (!StringUtils.hasText(request.getCounterCode())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (counterRepository.findByCounterCode(request.getCounterCode()).isPresent()) {
            throw new AppException(ErrorCode.COUNTER_CODE_EXISTS);
        }

        // 3. Tạo Entity
        Counter newCounter = Counter.builder()
                .counterCode(request.getCounterCode())
                .counterName(request.getCounterName())
                .counterType(request.getCounterType() != null ? request.getCounterType() : "KIOSK")
                .location(request.getLocation())
                .status("ACTIVE") // Mặc định Active
                .managedBy(currentUser) // Gán Merchant quản lý
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Counter savedCounter = counterRepository.save(newCounter);

        // 4. Audit Log & Noti
        logAction(currentUser, "CREATE", savedCounter.getCounterId(), "Tạo quầy hàng mới: " + savedCounter.getCounterName());

        return savedCounter;
    }

    // --- 2. UPDATE COUNTER ---
    @Transactional
    public Counter update(UUID counterId, UpdateCounterRequest request) {
        User currentUser = validateMerchant();

        // 1. Tìm Counter & Validate quyền sở hữu
        Counter counter = counterRepository.findById(counterId)
                .orElseThrow(() -> new AppException(ErrorCode.COUNTER_NOT_FOUND));

        if (!counter.getManagedBy().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
        }

        boolean statusChangedToInactive = false;
        StringBuilder logDetails = new StringBuilder();

        // 2. Update thông tin cơ bản
        if (StringUtils.hasText(request.getCounterName()) && !request.getCounterName().equals(counter.getCounterName())) {
            counter.setCounterName(request.getCounterName());
            logDetails.append("Đổi tên thành: ").append(request.getCounterName()).append(". ");
        }
        if (request.getLocation() != null) {
            counter.setLocation(request.getLocation());
        }
        if (request.getDeviceIdentifier() != null) {
            counter.setDeviceIdentifier(request.getDeviceIdentifier());
        }

        // 3. Xử lý thay đổi trạng thái
        if (request.getStatus() != null && !request.getStatus().equals(counter.getStatus())) {
            String newStatus = request.getStatus();

            // Nếu chuyển sang INACTIVE hoặc MAINTENANCE -> Kích hoạt logic khóa dây chuyền
            if ("INACTIVE".equals(newStatus) || "MAINTENANCE".equals(newStatus)) {
                // Chỉ xử lý nếu trạng thái cũ đang là ACTIVE
                if ("ACTIVE".equals(counter.getStatus())) {
                    statusChangedToInactive = true;
                }
            }

            counter.setStatus(newStatus);
            logDetails.append("Đổi trạng thái sang: ").append(newStatus);
        }
        counter.setUpdatedAt(LocalDateTime.now());
        Counter savedCounter = counterRepository.save(counter);

        // 4. Logic khóa dây chuyền (Side Effect)
        if (statusChangedToInactive) {
            processLockCounterResources(savedCounter, "Quầy hàng tạm ngưng hoạt động.");
        }

        logAction(currentUser, "UPDATE", savedCounter.getCounterId(), logDetails.toString());
        return savedCounter;
    }

    // --- 3. DELETE (SOFT DELETE) ---
    @Transactional
    public void delete(UUID counterId) {
        User currentUser = validateMerchant();

        Counter counter = counterRepository.findById(counterId)
                .orElseThrow(() -> new AppException(ErrorCode.COUNTER_NOT_FOUND));

        if (!counter.getManagedBy().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
        }

        // Xóa mềm = Set INACTIVE
        if (!"INACTIVE".equals(counter.getStatus())) {
            counter.setStatus("INACTIVE");
            counter.setUpdatedAt(LocalDateTime.now());
            counterRepository.save(counter);

            // Kích hoạt khóa dây chuyền
            processLockCounterResources(counter, "Quầy hàng đã bị xóa (ngưng hoạt động).");

            logAction(currentUser, "DELETE", counterId, "Xóa mềm quầy hàng (Set Inactive)");
        }
    }

    public CounterResponse getDetail() {
        User currentUser = validateMerchant();

        // Tìm quầy do Merchant này quản lý
        Counter counter = counterRepository.findByManagedBy_UserId(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));
        // ErrorCode.MERCHANT_NO_COUNTER ("Bạn chưa sở hữu quầy hàng nào")

        return convertToResponse(counter);
    }

    // --- Helper Mapping ---
    private CounterResponse convertToResponse(Counter counter) {
        return CounterResponse.builder()
                .counterId(counter.getCounterId())
                .counterCode(counter.getCounterCode())
                .counterName(counter.getCounterName())
                .counterType(counter.getCounterType())
                .location(counter.getLocation())
                .deviceIdentifier(counter.getDeviceIdentifier())
                .status(counter.getStatus())
                .createdBy(counter.getManagedBy().getFullName())
                .build();
    }

    // =========================================================================
    // PRIVATE HELPERS: LOCKING LOGIC (CORE REQUIREMENT)
    // =========================================================================

    /**
     * Logic khóa toàn bộ Voucher + QR liên quan đến Quầy này
     * Bao gồm: Voucher mua Service lẻ thuộc Quầy OR Voucher mua Package thuộc Quầy
     */
    private void processLockCounterResources(Counter counter, String reason) {
        // Bước 1: Lấy danh sách ID của tất cả Service thuộc quầy
        List<AppService> services = appServiceRepository.findByCounter_CounterId(counter.getCounterId());
        List<UUID> serviceIds = services.stream().map(AppService::getServiceId).collect(Collectors.toList());

        // Bước 2: Lấy danh sách ID của tất cả Package thuộc quầy
        List<AppPackage> packages = appPackageRepository.findByCounter_CounterId(counter.getCounterId());
        List<UUID> packageIds = packages.stream().map(AppPackage::getPackageId).collect(Collectors.toList());

        if (serviceIds.isEmpty() && packageIds.isEmpty()) return;

        // Bước 3: Tìm tất cả UserVoucher đang ACTIVE liên quan đến Service hoặc Package trên
        // (Sử dụng hàm query OR đã viết trong Repo)
        List<UserVoucher> affectedVouchers = userVoucherRepository.findActiveVouchersByServiceIdsOrPackageIds(
                serviceIds.isEmpty() ? List.of(UUID.randomUUID()) : serviceIds, // Tránh lỗi list rỗng
                packageIds.isEmpty() ? List.of(UUID.randomUUID()) : packageIds
        );

        if (affectedVouchers.isEmpty()) return;

        List<UUID> voucherIds = affectedVouchers.stream()
                .map(UserVoucher::getVoucherId)
                .collect(Collectors.toList());

        // Bước 4: Khóa Voucher (Chuyển sang LOCKED)
        for (UserVoucher v : affectedVouchers) {
            v.setStatus(com.example.thanhtoannoibo.Common.UserVoucherStatus.LOCKED);
        }
        userVoucherRepository.saveAll(affectedVouchers);

        // Bước 5: Khóa QR Code (Chuyển sang REVOKED)
        // (Hàm này đã có sẵn trong QrCodeRepository từ các file mẫu)
        qrCodeRepository.lockQrCodesByVoucherIds(voucherIds, QrCodeStatus.REVOKED);

        // Bước 6: Gửi thông báo cho User (Gom nhóm để không spam)
        Map<User, Long> countByUser = affectedVouchers.stream()
                .collect(Collectors.groupingBy(UserVoucher::getOwner, Collectors.counting()));

        for (Map.Entry<User, Long> entry : countByUser.entrySet()) {
            User customer = entry.getKey();
            Long count = entry.getValue();
            String msg = String.format("Thông báo: %d voucher của bạn tại quầy '%s' đã bị tạm khóa. Lý do: %s",
                    count, counter.getCounterName(), reason);

            try {
                notificationService.createNotification(customer, "Gián đoạn dịch vụ", msg, "WARNING", "/user/my-vouchers");
            } catch (Exception ignored) {}
        }
    }

    // --- Helpers ---

    private User validateMerchant() {
        User u = authService.getCurrentUser(httpRequest);
        if (u.getUserType() != UserType.MERCHANT) throw new AppException(ErrorCode.FORBIDDEN);
        return u;
    }

    private void logAction(User actor, String action, UUID entityId, String description) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("description", description);
            details.put("timestamp", System.currentTimeMillis());

            AuditLog log = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityType("COUNTER")
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(httpRequest.getRemoteAddr())
                    .createdAt(LocalDateTime.now())
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            log.error("Lỗi lưu AuditLog Counter: {}", e.getMessage());
        }
    }
}
