package com.example.thanhtoannoibo.Service.Catalog.Manager;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.QrCodeStatus;
import com.example.thanhtoannoibo.Common.UserType;
import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreateServiceRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdateServiceRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Entity.Catalog.MasterService;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.CounterRepository;
import com.example.thanhtoannoibo.Repository.Catalog.MasterServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.ServiceCategoryRepository;
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
public class MerchantServiceManager {

    private final AppServiceRepository appServiceRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final CounterRepository counterRepository;
    private final MasterServiceRepository masterServiceRepository;

    // [MỚI] Inject thêm Repo để xử lý khóa Voucher/QR
    private final UserVoucherRepository userVoucherRepository;
    private final QrCodeRepository qrCodeRepository;

    private final AuthService authService;
    private final HttpServletRequest httpRequest;
    private final NotificationService notificationService;
    private final AuditLogRepository  auditLogRepository;


    @Transactional
    public List<ServiceResponse> create(CreateServiceRequest request) {
        User currentUser = validateMerchant();
        Counter counter = getMerchantCounter(currentUser);

        List<AppService> resultServices = new ArrayList<>();

        // =====================================================================
        // CASE 1: ĐĂNG KÝ TỪ DANH SÁCH CÓ SẴN (SYSTEM / OTHER MERCHANTS)
        // =====================================================================
        if (!CollectionUtils.isEmpty(request.getMasterServiceIds())) {
            // Tìm danh sách các service nguồn dựa trên ID gửi lên
            List<AppService> sourceServices = appServiceRepository.findAllById(request.getMasterServiceIds());

            for (AppService source : sourceServices) {
                // [FIX LỖI 23502] Bỏ qua nếu dữ liệu nguồn bị lỗi (thiếu Category)
                if (source.getCategory() == null) {
                    continue;
                }

                // 1. Kiểm tra xem Merchant hiện tại đã sở hữu món này chưa (Dựa trên ServiceCode)
                // Mục đích: Tránh việc 1 người đăng ký 2 lần cùng 1 món
                Optional<AppService> existingMyService = appServiceRepository
                        .findByServiceCodeAndCounter_CounterId(source.getServiceCode(), counter.getCounterId());

                if (existingMyService.isPresent()) {
                    AppService myService = existingMyService.get();
                    // Nếu đã có nhưng đang xóa/ẩn -> Kích hoạt lại
                    if (myService.getStatus() == CatalogStatus.DELETED || myService.getStatus() == CatalogStatus.INACTIVE) {
                        myService.setStatus(CatalogStatus.ACTIVE);
                        myService.setUpdatedAt(LocalDateTime.now());
                        resultServices.add(appServiceRepository.save(myService));
                    }
                    // Nếu đang Active rồi thì bỏ qua, không làm gì cả
                    continue;
                }

                // 2. LOGIC CHÍNH: CLAIM (Nhận) hoặc CLONE (Tạo mới)

                // Tình huống A: Bản ghi nguồn CHƯA CÓ chủ sở hữu (Counter == null)
                // -> Đây là bản ghi gốc/hệ thống chưa ai nhận -> Merchant "nhận" luôn bản ghi này
                if (source.getCounter() == null) {
                    source.setCounter(counter); // Gán chủ sở hữu
                    source.setStatus(CatalogStatus.ACTIVE);
                    source.setUpdatedAt(LocalDateTime.now());
                    resultServices.add(appServiceRepository.save(source));
                }
                // Tình huống B: Bản ghi nguồn ĐÃ CÓ chủ (Của Merchant khác hoặc Admin đã claim)
                // -> Tạo ra một bản sao mới (Clone) cho Merchant hiện tại
                else {
                    AppService newService = AppService.builder()
                            .serviceCode(source.getServiceCode()) // Giữ nguyên code để mapping
                            .masterServiceCode(source.getServiceCode())
                            .serviceName(source.getServiceName())
                            .unitPrice(source.getUnitPrice())
                            .category(source.getCategory()) // Đã check null ở trên
                            .serviceCategory(source.getCategory().getCategoryName())
                            .imageUrl(source.getImageUrl())
                            .counter(counter) // Gán cho mình
                            .status(CatalogStatus.ACTIVE)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    resultServices.add(appServiceRepository.save(newService));
                }
            }

            if (!resultServices.isEmpty()) {
                String msg = String.format(ErrorCode.NOTIFY_REGISTER_SUCCESS.getMessage(), resultServices.size());
                sendNotification(currentUser, "Đăng ký thành công", msg);
            }
        }

        // =====================================================================
        // CASE 2: TẠO MÓN CUSTOM (MERCHANT TỰ NHẬP TAY)
        // =====================================================================
        else {
            // Validate dữ liệu đầu vào
            if (!StringUtils.hasText(request.getServiceName()) || request.getUnitPrice() == null) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }

            ServiceCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));

            // Tạo mã dịch vụ custom (Prefix REQ_)
            String customCode = "REQ_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            AppService customService = AppService.builder()
                    .serviceCode(customCode)
                    .masterServiceCode(null) // Không có master
                    .serviceName(request.getServiceName())
                    .unitPrice(request.getUnitPrice())
                    .category(category)
                    .serviceCategory(category.getCategoryCode())
                    .imageUrl(request.getImageUrl())
                    .counter(counter)
                    .status(CatalogStatus.PENDING) // Chờ duyệt
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            resultServices.add(appServiceRepository.save(customService));

            String msg = String.format(ErrorCode.NOTIFY_REQUEST_SUCCESS.getMessage(), request.getServiceName());
            sendNotification(currentUser, "Đã gửi yêu cầu",
                    "Món '" + customService.getServiceName() + "' đang chờ Admin phê duyệt.");
        }

        return resultServices.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    /**
     * Cập nhật dịch vụ (Bao gồm khóa Voucher nếu Inactive)
     */
    @Transactional
    public ServiceResponse update(UUID serviceId, UpdateServiceRequest request) {
        User currentUser = validateMerchant();
        Counter counter = getMerchantCounter(currentUser);

        AppService service = appServiceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        if (!service.getCounter().getCounterId().equals(counter.getCounterId())) {
            throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
        }

        // [LUẬT 1] Đang chờ duyệt -> Chặn mọi thao tác
        if (service.getStatus() == CatalogStatus.PENDING) {
            throw new AppException(ErrorCode.ITEM_IS_PENDING);
        }

        boolean contentChanged = false;
        StringBuilder logDetails = new StringBuilder();

        // 1. Check thay đổi nội dung
        if (request.getServiceName() != null && !request.getServiceName().equals(service.getServiceName())) {
            service.setServiceName(request.getServiceName());
            contentChanged = true;
        }
        if (request.getUnitPrice() != null && request.getUnitPrice().compareTo(service.getUnitPrice()) != 0) {
            service.setUnitPrice(request.getUnitPrice());
            contentChanged = true;
        }
        if (request.getImageUrl() != null && !request.getImageUrl().equals(service.getImageUrl())) {
            service.setImageUrl(request.getImageUrl());
            contentChanged = true;
        }
        if (request.getCategoryId() != null) {
            // Logic check category change...
            ServiceCategory cat = categoryRepository.findById((request.getCategoryId())).orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            if (cat != null && (service.getCategory() == null || !service.getCategory().getCategoryId().equals(cat.getCategoryId()))) {
                service.setCategory(cat);
                contentChanged = true;
            }
        }

        if (contentChanged) {
            // [LUẬT 2] Có sửa nội dung -> Về Pending
            service.setStatus(CatalogStatus.PENDING);
            logDetails.append("Cập nhật nội dung -> Chuyển về Pending.");

            // Nếu đang Active mà về Pending -> Coi như tạm ngưng -> Khóa Voucher
            lockRelatedVouchersAndNotify(service, "Món ăn đang chờ duyệt nội dung mới.");

            sendNotification(currentUser, "Đã gửi yêu cầu cập nhật",
                    "Các thay đổi cho món '" + service.getServiceName() + "' đang chờ duyệt.");
        }
        else if (request.getStatus() != null && request.getStatus() != service.getStatus()) {
            // [LUẬT 3] Chỉ đổi trạng thái
            CatalogStatus newStatus = request.getStatus();

            // Cấm chuyển về Pending hoặc Deleted ở đây
            if (newStatus == CatalogStatus.PENDING) {
                throw new AppException(ErrorCode.CANNOT_REVERT_TO_PENDING);
            }
            if (newStatus == CatalogStatus.DELETED) {
                throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            }

            if (newStatus == CatalogStatus.INACTIVE) {
                lockRelatedVouchersAndNotify(service, "Nhà cung cấp tạm ngưng phục vụ món này.");
            }

            service.setStatus(newStatus);
            logDetails.append("Đổi trạng thái sang ").append(newStatus);
        }

        service.setUpdatedAt(LocalDateTime.now());
        AppService saved = appServiceRepository.save(service);

        logAction(currentUser, "UPDATE", saved.getServiceId(), logDetails.toString());
        return convertToResponse(saved);
    }

    /**
     * Bật/Tắt trạng thái kinh doanh (Active <-> Inactive)
     * Logic mở rộng:
     * - Nếu tắt (INACTIVE) -> Tìm voucher active -> Khóa -> Hủy QR -> Bắn Noti cho User sở hữu.
     * - Ghi Audit Log hành động.
     * - Thông báo cho Merchant kết quả.
     */
    @Transactional
    public ServiceResponse toggleStatus(UUID serviceId, CatalogStatus status) {
        User currentUser = validateMerchant();
        Counter counter = getMerchantCounter(currentUser);

        AppService service = appServiceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        if (!service.getCounter().getCounterId().equals(counter.getCounterId())) {
            throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
        }

        // [LUẬT] Đang Pending -> Không được toggle
        if (service.getStatus() == CatalogStatus.PENDING) {
            throw new AppException(ErrorCode.ITEM_IS_PENDING);
        }

        // Validate status đích
        if (status == CatalogStatus.PENDING || status == CatalogStatus.DELETED) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        // Logic phụ
        if (status == CatalogStatus.INACTIVE) {
            lockRelatedVouchersAndNotify(service, "Nhà cung cấp tạm ngưng phục vụ món này.");
        }

        service.setStatus(status);
        service.setUpdatedAt(LocalDateTime.now());
        AppService saved = appServiceRepository.save(service);

        logAction(currentUser, "TOGGLE_STATUS", serviceId, "Đổi nhanh trạng thái sang " + status);
        return convertToResponse(saved);
    }

    // =========================================================================
    // PRIVATE HELPERS (Copy thêm các hàm này vào cuối class nếu chưa có)
    // =========================================================================

    /**
     * Xử lý khóa Voucher + QR và thông báo User khi món ăn bị tắt
     */
    private void lockRelatedVouchersAndNotify(AppService service, String reason) {
        // 1. Tìm tất cả voucher Active có chứa món ăn này (Vé lẻ hoặc Vé gói có món này)
        List<UserVoucher> affectedVouchers = userVoucherRepository.findActiveVouchersByServiceIds(List.of(service.getServiceId()));

        if (CollectionUtils.isEmpty(affectedVouchers)) return;

        List<UUID> voucherIds = affectedVouchers.stream()
                .map(UserVoucher::getVoucherId)
                .collect(Collectors.toList());

        // 2. Khóa Voucher (Chuyển sang LOCKED)
        userVoucherRepository.updateStatusByServiceIds(List.of(service.getServiceId()), UserVoucherStatus.LOCKED);

        // 3. Hủy QR Code (Chuyển sang REVOKED)
        qrCodeRepository.lockQrCodesByVoucherIds(voucherIds, QrCodeStatus.REVOKED);

        // 4. Gửi thông báo cho từng khách hàng
        // Group voucher theo User để không spam thông báo nếu họ có nhiều vé
        Map<User, Long> countByUser = affectedVouchers.stream()
                .collect(Collectors.groupingBy(UserVoucher::getOwner, Collectors.counting()));

        for (Map.Entry<User, Long> entry : countByUser.entrySet()) {
            User customer = entry.getKey();
            Long count = entry.getValue();
            String msg = String.format("Cảnh báo: %d voucher chứa món '%s' đã bị tạm khóa. Lý do: %s",
                    count, service.getServiceName(), reason);

            // Gọi service noti (đường dẫn trỏ về ví voucher của user)
            try {
                notificationService.createNotification(customer, "Gián đoạn dịch vụ", msg, "WARNING", "/user/my-vouchers");
            } catch (Exception ignored) {}
        }
    }

    /**
     * Helper ghi Audit Log
     */
    private void logAction(User actor, String action, UUID entityId, String description) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("description", description);
            details.put("target_service_name", entityId); // Hoặc query name nếu cần chi tiết
            details.put("timestamp", System.currentTimeMillis());

            AuditLog log = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityType("APP_SERVICE")
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(getClientIp()) // Hàm getClientIp() có thể lấy từ request
                    .createdAt(LocalDateTime.now())
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Lỗi lưu AuditLog Service: " + e.getMessage());
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

    /**
     * [MỚI] Xóa mềm dịch vụ (Merchant xóa)
     */
    @Transactional
    public void delete(UUID serviceId) {
        User currentUser = validateMerchant();
        Counter counter = getMerchantCounter(currentUser);

        AppService service = appServiceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        if (!service.getCounter().getCounterId().equals(counter.getCounterId())) {
            throw new AppException(ErrorCode.MERCHANT_NOT_OWNER);
        }

        // [LUẬT] Đang chờ duyệt -> Không được xóa
        if (service.getStatus() == CatalogStatus.PENDING) {
            throw new AppException(ErrorCode.ITEM_IS_PENDING);
        }

        // Xử lý hệ quả
        lockRelatedVouchersAndNotify(service, "Món ăn đã bị xóa khỏi thực đơn.");

        service.setStatus(CatalogStatus.DELETED);
        service.setUpdatedAt(LocalDateTime.now());
        appServiceRepository.save(service);

        logAction(currentUser, "DELETE", serviceId, "Xóa mềm dịch vụ");
    }

    // =========================================================================
    // HELPER: KHÓA VOUCHER & QR (LOGIC CHUNG)
    // =========================================================================

    private void processLockVouchersAndNotify(List<UUID> serviceIds, String reasonMessage) {
        if (serviceIds == null || serviceIds.isEmpty()) return;

        // 1. Tìm các voucher đang active chứa service này
        List<UserVoucher> affectedVouchers = userVoucherRepository.findActiveVouchersByServiceIds(serviceIds);
        if (affectedVouchers.isEmpty()) return;

        List<UUID> voucherIds = affectedVouchers.stream()
                .map(UserVoucher::getVoucherId)
                .collect(Collectors.toList());

        // 2. Khóa Voucher (Chuyển sang LOCKED)
        for (UserVoucher v : affectedVouchers) {
            v.setStatus(UserVoucherStatus.LOCKED);
        }
        userVoucherRepository.saveAll(affectedVouchers);

        // 3. Khóa QR Code (Chuyển sang REVOKED)
        qrCodeRepository.lockQrCodesByVoucherIds(voucherIds, QrCodeStatus.REVOKED);

        // 4. Bắn thông báo cho Khách hàng
        Map<User, List<UserVoucher>> vouchersByUser = affectedVouchers.stream()
                .collect(Collectors.groupingBy(UserVoucher::getOwner));

        for (Map.Entry<User, List<UserVoucher>> entry : vouchersByUser.entrySet()) {
            User customer = entry.getKey();
            int count = entry.getValue().size();
            sendNotification(customer, "Thông báo dịch vụ",
                    String.format("Cảnh báo: %d voucher của bạn bị tạm khóa. Lý do: %s", count, reasonMessage));
        }
    }

    // --- Common Helpers ---

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
            // URL đích tùy thuộc user type
            String url = (user.getUserType() == UserType.MERCHANT) ? "/merchant/menu" : "/user/my-vouchers";
            notificationService.createNotification(user, title, message, "SUCCESS", url);
        } catch (Exception ignored) {}
    }

    private ServiceResponse convertToResponse(AppService entity) {
        String catName = entity.getCategory() != null ? entity.getCategory().getCategoryName() : "Unknown";
        return ServiceResponse.builder()
                .serviceId(entity.getServiceId())
                .serviceCode(entity.getServiceCode())
                .serviceName(entity.getServiceName())
                .unitPrice(entity.getUnitPrice())
                .categoryName(catName)
                .imageUrl(entity.getImageUrl())
                .status(entity.getStatus())
                .build();
    }
}