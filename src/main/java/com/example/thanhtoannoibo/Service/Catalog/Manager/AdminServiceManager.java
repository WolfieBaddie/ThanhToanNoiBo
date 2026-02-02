package com.example.thanhtoannoibo.Service.Catalog.Manager;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreateMasterServiceRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdateServiceRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.AdminServiceResponse;
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
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceManager {

    private final MasterServiceRepository masterServiceRepository;
    private final AppServiceRepository appServiceRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final CounterRepository counterRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;
    private final AuthService authService;
    private final HttpServletRequest httpRequest;
    private final QrCodeRepository qrCodeRepository;
    private final UserVoucherRepository userVoucherRepository;
    // --- 1. READ ---
    @Transactional(readOnly = true)
    public Page<AdminServiceResponse> getAllServices(ServiceFilterRequest filter, Pageable pageable) {
        validateAdmin();

        String searchKey = null;
        if (StringUtils.hasText(filter.getKeyword())) {
            searchKey = "%" + filter.getKeyword().trim().toLowerCase() + "%";
        }

        // [QUAN TRỌNG] Tạo một Pageable mới CHỈ CÓ trang và kích thước, BỎ Sort.
        // Vì Query trong Repository đã tự handle việc sort theo MAX(createdAt).
        Pageable unsafePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        Page<String> codePage = appServiceRepository.findDistinctServiceCodes(
                searchKey,
                filter.getCategoryId(),
                filter.getStatus(),
                unsafePageable // Truyền unsafePageable thay vì pageable gốc
        );

        List<AdminServiceResponse> items = codePage.getContent().stream()
                .map(this::buildServiceGroup)
                .collect(Collectors.toList());

        // Trả về PageImpl dùng pageable gốc để Frontend vẫn thấy được thông tin trang hiện tại
        return new PageImpl<>(items, pageable, codePage.getTotalElements());
    }

    // --- 1. READ ---
    @Transactional(readOnly = true)
    public Page<AppService> getAllAppServices(ServiceFilterRequest filter, Pageable pageable) {
        validateAdmin();

        Specification<AppService> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }

            if (StringUtils.hasText(filter.getKeyword())) {
                String pattern = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                Predicate codeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceCode")), pattern);
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceName")), pattern);
                predicates.add(criteriaBuilder.or(codeLike, nameLike));
            }

            if (filter.getCategoryId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("categoryId"), filter.getCategoryId()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return appServiceRepository.findAll(spec, pageable);
    }

    @Transactional
    public ServiceResponse updateAppServiceStatus(UUID serviceId, CatalogStatus newStatus) {
        User admin = validateAdmin();
        AppService service = appServiceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        // Nếu trạng thái không đổi thì return luôn
        if (service.getStatus() == newStatus) {
            return convertToResponse(service);
        }

        CatalogStatus oldStatus = service.getStatus();
        String actionLog = "UPDATE_MERCHANT_SERVICE_STATUS";
        String descriptionLog = "";

        // --- XỬ LÝ THEO CÁC CASE TRẠNG THÁI ---

        // CASE 1: DUYỆT (PENDING -> ACTIVE)
        if (oldStatus == CatalogStatus.PENDING && newStatus == CatalogStatus.ACTIVE) {
            service.setStatus(CatalogStatus.ACTIVE);
            actionLog = "APPROVE_MERCHANT_SERVICE";
            descriptionLog = "Duyệt dịch vụ của Merchant: " + service.getServiceName();

            // Thông báo cho Merchant
            if (service.getCounter() != null && service.getCounter().getManagedBy() != null) {
                notifyUser(service.getCounter().getManagedBy(), "Duyệt dịch vụ thành công",
                        String.format("Dịch vụ '%s' của bạn đã được Admin phê duyệt và đang hoạt động.", service.getServiceName()));
            }
        }

        // CASE 2: KHÓA HOẶC XÓA MỀM (ACTIVE/PENDING -> INACTIVE/DELETED)
        else if (newStatus == CatalogStatus.INACTIVE || newStatus == CatalogStatus.DELETED) {
            service.setStatus(newStatus);
            actionLog = (newStatus == CatalogStatus.DELETED) ? "DELETE_MERCHANT_SERVICE" : "LOCK_MERCHANT_SERVICE";
            descriptionLog = String.format("Admin chuyển trạng thái dịch vụ '%s' sang %s", service.getServiceName(), newStatus);

            // [QUAN TRỌNG] Gọi hàm xử lý dây chuyền: Khóa Voucher -> Khóa QR -> Báo User
            // Lý do hiển thị cho User: "Dịch vụ ngừng hoạt động"
            processLockVouchersAndNotify(
                    Collections.singletonList(serviceId),
                    String.format("Dịch vụ '%s' đã ngừng hoạt động hoặc bị gỡ bỏ bởi hệ thống.", service.getServiceName())
            );

            // Thông báo cho Merchant biết là bị khóa
            if (service.getCounter() != null && service.getCounter().getManagedBy() != null) {
                notifyUser(service.getCounter().getManagedBy(), "Dịch vụ bị khóa/gỡ bỏ",
                        String.format("CẢNH BÁO: Dịch vụ '%s' đã bị Admin chuyển sang trạng thái %s. Các voucher liên quan của khách hàng đã bị thu hồi.", service.getServiceName(), newStatus));
            }
        }

        // CASE 3: CÁC TRƯỜNG HỢP KHÁC (Ví dụ: Active -> Pending...)
        else {
            service.setStatus(newStatus);
            descriptionLog = String.format("Đổi trạng thái dịch vụ từ %s sang %s", oldStatus, newStatus);
        }

        // --- LƯU & GHI LOG ---
        service.setUpdatedAt(LocalDateTime.now());
        AppService saved = appServiceRepository.save(service);

        // Ghi Audit Log hành động của Admin
        saveAuditLog(admin, actionLog, saved.getServiceId(), "APP_SERVICE", descriptionLog);

        return convertToResponse(saved);
    }


    // --- HELPER: Gom nhóm (Logic giữ nguyên) ---
    private AdminServiceResponse buildServiceGroup(String serviceCode) {
        List<AppService> instances = appServiceRepository.findAllByServiceCode(serviceCode);

        if (instances.isEmpty()) return null;

        AppService representative = instances.get(0);
        String categoryName = representative.getCategory() != null ? representative.getCategory().getCategoryName() : "Unknown";

        BigDecimal minPrice = instances.stream()
                .map(AppService::getUnitPrice)
                .min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        BigDecimal maxPrice = instances.stream()
                .map(AppService::getUnitPrice)
                .max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        List<AdminServiceResponse.MerchantInfo> merchantInfos = instances.stream()
                .map(svc -> {
                    String merchantName = "N/A";
                    String counterName = "N/A";
                    UUID merchantId = null;
                    if (svc.getCounter() != null) {
                        counterName = svc.getCounter().getCounterName();
                        if (svc.getCounter().getManagedBy() != null) {
                            merchantName = svc.getCounter().getManagedBy().getFullName();
                            merchantId = svc.getCounter().getManagedBy().getUserId();
                        }
                    }
                    return AdminServiceResponse.MerchantInfo.builder()
                            .serviceId(svc.getServiceId())
                            .merchantId(merchantId)
                            .merchantName(merchantName)
                            .counterName(counterName)
                            .unitPrice(svc.getUnitPrice())
                            .status(svc.getStatus())
                            .build();
                })
                .collect(Collectors.toList());

        return AdminServiceResponse.builder()
                .serviceCode(serviceCode)
                .serviceName(representative.getServiceName())
                .imageUrl(representative.getImageUrl())
                .categoryName(categoryName)
                .minPrice(minPrice)
                .status(representative.getStatus())
                .maxPrice(maxPrice)
                .merchants(merchantInfos)
                .build();
    }

    private void processLockVouchersAndNotify(List<UUID> serviceIds, String reasonMessage) {
        if (serviceIds == null || serviceIds.isEmpty()) return;

        // 1. Tìm tất cả Voucher đang Active liên quan tới các Service này
        List<UserVoucher> affectedVouchers = userVoucherRepository.findActiveVouchersByServiceIds(serviceIds);

        if (affectedVouchers.isEmpty()) return;

        List<UUID> voucherIds = affectedVouchers.stream()
                .map(UserVoucher::getVoucherId)
                .collect(Collectors.toList());

        // 2. Khóa Voucher (Chuyển sang LOCKED hoặc REVOKED tùy nghiệp vụ)
        // Ở đây tôi dùng vòng lặp để save thay vì @Modifying query để đảm bảo Audit/Listener nếu có
        // Tuy nhiên để tối ưu performance update số lượng lớn, tôi dùng query update hàng loạt ở repository nếu bạn đã có,
        // hoặc update thủ công như dưới đây:
        for (UserVoucher v : affectedVouchers) {
            v.setStatus(UserVoucherStatus.LOCKED);
        }
        userVoucherRepository.saveAll(affectedVouchers);

        // 3. Khóa QR Code liên quan
        qrCodeRepository.lockQrCodesByVoucherIds(voucherIds, QrCodeStatus.REVOKED);

        // 4. Gửi thông báo cho User
        // Gom nhóm theo User để không spam thông báo nếu họ có nhiều vé bị hủy
        Map<User, List<UserVoucher>> vouchersByUser = affectedVouchers.stream()
                .collect(Collectors.groupingBy(UserVoucher::getOwner));

        for (Map.Entry<User, List<UserVoucher>> entry : vouchersByUser.entrySet()) {
            User user = entry.getKey();
            int count = entry.getValue().size();
            String msg = String.format("Có %d voucher của bạn đã bị khóa do dịch vụ ngừng cung cấp/bảo trì. %s", count, reasonMessage);
            notifyUser(user, "Voucher bị tạm khóa", msg);
        }
    }


    // =========================================================================
    // 1. TẠO MASTER -> TẠO LUÔN 1 APP_SERVICE (SYSTEM)
    // =========================================================================
    @Transactional
    public MasterService createMasterService(CreateMasterServiceRequest request) {
        User admin = validateAdmin();

        if (masterServiceRepository.existsByServiceCode(request.getServiceCode())) {
            throw new AppException(ErrorCode.SERVICE_EXISTED);
        }

        ServiceCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // B1: Lưu Master Service
        MasterService master = MasterService.builder()
                .serviceCode(request.getServiceCode())
                .serviceName(request.getServiceName())
                .fixedPrice(request.getFixedPrice())
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .category(category)
                .status(CatalogStatus.ACTIVE)
                .build();
        master = masterServiceRepository.save(master);

        // B2: Tạo ngay 1 AppService con (System Record) - KHÔNG GẮN COUNTER
        createSystemAppService(master);

        saveAuditLog(admin, "CREATE_MASTER", master.getMasterId(), "SERVICE",  "Tạo Master & System AppService: " + master.getServiceCode());
        return master;
    }

    // =========================================================================
    // 2. UPDATE THÔNG TIN / COUNTER / TRẠNG THÁI
    // =========================================================================
    @Transactional
    public MasterService updateMasterService(String serviceCode, UpdateServiceRequest request) {
        User admin = validateAdmin();

        // 1. Tìm theo Service Code
        MasterService master = masterServiceRepository.findByServiceCode(serviceCode)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        boolean isStatusChanged = false;
        boolean isInfoChanged = false;
        StringBuilder logDetails = new StringBuilder("Update. ");

        // 2. Cập nhật thông tin (Giữ nguyên)
        if (StringUtils.hasText(request.getServiceName()) && !request.getServiceName().equals(master.getServiceName())) {
            master.setServiceName(request.getServiceName());
            isInfoChanged = true;
        }
        if (request.getUnitPrice() != null && request.getUnitPrice().compareTo(master.getFixedPrice()) != 0) {
            master.setFixedPrice(request.getUnitPrice());
            isInfoChanged = true;
        }
        if (request.getImageUrl() != null && !request.getImageUrl().equals(master.getImageUrl())) {
            master.setImageUrl(request.getImageUrl());
            isInfoChanged = true;
        }
        if (request.getDescription() != null && !request.getDescription().equals(master.getDescription())) {
            master.setDescription(request.getDescription());
            isInfoChanged = true;
        }
        if (StringUtils.hasText(request.getCategoryId().toString())) { // Lưu ý: request.getCategoryId() nên trả về String hoặc UUID tùy DTO của bạn
            ServiceCategory cat = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            if (!master.getCategory().getCategoryId().equals(cat.getCategoryId())) {
                master.setCategory(cat);
                isInfoChanged = true;
            }
        }

        // 3. Kiểm tra thay đổi trạng thái
        if (request.getStatus() != null && request.getStatus() != master.getStatus()) {
            master.setStatus(request.getStatus());
            isStatusChanged = true;
        }

        MasterService savedMaster = masterServiceRepository.save(master);

        // 4. Gọi lại các hàm Helper (ĐÃ SỬA ĐỔI)

        // a. Gán quầy: Request gửi lên List<MerchantId>, cần map sang List<CounterId>
        if (request.getAssignedCounterIds() != null) {
            List<UUID> merchantIds = request.getAssignedCounterIds();
            List<UUID> targetCounterIds = new ArrayList<>();

            for (UUID merchantId : merchantIds) {
                // Tìm Counter dựa trên Merchant ID (User ID)
                // Hàm findByManagedBy_UserId đã có trong CounterRepository bạn cung cấp
                counterRepository.findByManagedBy_UserId(merchantId)
                        .ifPresent(counter -> targetCounterIds.add(counter.getCounterId()));
            }

            // Gọi hàm sync với danh sách Counter ID thực tế
            handleCounterSync(master, targetCounterIds, logDetails);
        }

        // b. Đồng bộ trạng thái xuống con
        if (isStatusChanged) {
            updateStatusAllChildren(savedMaster.getServiceCode(), savedMaster.getStatus());
        }

        // 5. Audit Log
        if (isInfoChanged || isStatusChanged) {
            saveAuditLog(admin, "UPDATE_MASTER", master.getMasterId(), "SERVICE", logDetails.toString());
        }

        return savedMaster;
    }

    // =========================================================================
    // LOGIC ĐỒNG BỘ (SYNC) THEO YÊU CẦU
    // =========================================================================

    private void handleCounterSync(MasterService master, List<UUID> targetCounterIds, StringBuilder log) {
        // Loại bỏ trùng lặp trong request
        List<UUID> targets = targetCounterIds.stream().distinct().collect(Collectors.toList());

        // Lấy AppService Hệ thống (Con đầu tiên, counter = null)
        Optional<AppService> systemServiceOpt = appServiceRepository.findByMasterServiceCodeAndCounterIsNull(master.getServiceCode());

        // Lấy danh sách các AppService đã gắn quầy (Counter != null) đang tồn tại
        List<AppService> merchantServices = appServiceRepository.findAllByMasterServiceCode(master.getServiceCode())
                .stream().filter(s -> s.getCounter() != null).collect(Collectors.toList());

        Map<UUID, AppService> existingMerchantMap = merchantServices.stream()
                .collect(Collectors.toMap(s -> s.getCounter().getCounterId(), s -> s));

        // --- BƯỚC 1: GÁN QUẦY ---
        if (!targets.isEmpty()) {
            int startIndex = 0;

            // QUY TẮC: "Lấy cái thằng đầu tiên (System) gắn cho counter đầu tiên"
            // Điều kiện: Phải có System Service VÀ Counter đầu tiên chưa có service này
            UUID firstCounterId = targets.get(0);

            if (systemServiceOpt.isPresent() && !existingMerchantMap.containsKey(firstCounterId)) {
                // Biến đổi System Service -> Merchant Service
                AppService systemService = systemServiceOpt.get();
                Counter c = counterRepository.findById(firstCounterId).orElse(null);
                if (c != null) {
                    systemService.setCounter(c); // GẮN COUNTER
                    systemService.setStatus(CatalogStatus.ACTIVE);
                    appServiceRepository.save(systemService);

                    log.append("Convert System->").append(c.getCounterName()).append("; ");
                    existingMerchantMap.put(firstCounterId, systemService); // Đánh dấu đã có
                    startIndex = 1; // Counter đầu tiên đã xử lý xong
                }
            }

            // QUY TẮC: "Còn lại tạo mới thêm các AppService vào"
            for (int i = startIndex; i < targets.size(); i++) {
                UUID counterId = targets.get(i);

                if (existingMerchantMap.containsKey(counterId)) {
                    // Đã có -> Khôi phục nếu đang bị xóa
                    AppService existing = existingMerchantMap.get(counterId);
                    if (existing.getStatus() == CatalogStatus.DELETED) {
                        existing.setStatus(CatalogStatus.ACTIVE);
                        appServiceRepository.save(existing);
                        log.append("Restore ").append(existing.getCounter().getCounterName()).append("; ");
                    }
                } else {
                    // Chưa có -> Tạo mới hoàn toàn
                    counterRepository.findById(counterId).ifPresent(counter -> {
                        createAppServiceCopy(master, counter);
                        log.append("Add New ").append(counter.getCounterName()).append("; ");
                        notifyUser(counter.getManagedBy(), "Sản phẩm mới", "Món '" + master.getServiceName() + "' đã được thêm.");
                    });
                }
            }
        }

        // --- BƯỚC 2: LOẠI BỎ MERCHANT KHỎI DANH SÁCH BÁN ---
        // Duyệt qua map các quầy đang có, nếu không nằm trong target list -> Xóa mềm
        for (AppService s : merchantServices) {
            if (!targets.contains(s.getCounter().getCounterId())) {
                if (s.getStatus() != CatalogStatus.DELETED) {
                    s.setStatus(CatalogStatus.DELETED);
                    appServiceRepository.save(s);
                    log.append("Remove ").append(s.getCounter().getCounterName()).append("; ");
                    notifyUser(s.getCounter().getManagedBy(), "Gỡ sản phẩm", "Món '" + master.getServiceName() + "' đã bị gỡ.");
                }
            }
        }
    }

    private void createAppServiceCopy(MasterService master, Counter counter) {
        // 1. Kiểm tra an toàn dữ liệu
        if (master.getCategory() == null) {
            // Tùy chọn: Log lỗi hoặc Throw exception nếu dữ liệu Master bị lỗi
            System.err.println("Lỗi: Master Service " + master.getServiceCode() + " không có Category!");
            return;
        }

        // 2. Build đối tượng AppService mới
        AppService child = AppService.builder()
                .serviceCode(master.getServiceCode())      // Giữ nguyên code để biết là con của ai
                .masterServiceCode(master.getServiceCode())
                .serviceName(master.getServiceName())      // Copy tên
                .unitPrice(master.getFixedPrice())         // Copy giá gốc
                .imageUrl(master.getImageUrl())            // Copy ảnh

                // [QUAN TRỌNG] Copy Category object sang (Fix lỗi null column "service_category")
                .category(master.getCategory())
                .serviceCategory(master.getCategory().getCategoryName())
                .status(CatalogStatus.ACTIVE)              // Mặc định là Active
                .counter(counter)                          // [QUAN TRỌNG] Gán cho Quầy cụ thể
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // 3. Lưu xuống DB
        appServiceRepository.save(child);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    // Tạo AppService "System" (Counter = null)
    private void createSystemAppService(MasterService master) {
        AppService sys = AppService.builder()
                .serviceCode(master.getServiceCode())
                .masterServiceCode(master.getServiceCode())
                .serviceName(master.getServiceName())
                .unitPrice(master.getFixedPrice())
                .imageUrl(master.getImageUrl())
                .category(master.getCategory())
                .status(CatalogStatus.ACTIVE)
                .counter(null) // KEY POINT: Counter NULL
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        appServiceRepository.save(sys);
    }

    // Đồng bộ thông tin từ Cha xuống TẤT CẢ Con (System + Merchant)
    private void propagateInfoToAllChildren(MasterService master) {
        List<AppService> children = appServiceRepository.findAllByMasterServiceCode(master.getServiceCode());
        for (AppService child : children) {
            // Chỉ update info, không đổi status ở đây
            child.setServiceName(master.getServiceName());
            child.setUnitPrice(master.getFixedPrice());
            child.setImageUrl(master.getImageUrl());
            child.setCategory(master.getCategory());
            child.setUpdatedAt(LocalDateTime.now());
            appServiceRepository.save(child);
        }
    }

    // Đồng bộ Trạng thái (Tắt/Xóa mềm) từ Cha xuống TẤT CẢ Con
    private void updateStatusAllChildren(String masterCode, CatalogStatus status) {
        List<AppService> children = appServiceRepository.findAllByMasterServiceCode(masterCode);

        // [MỚI] Nếu trạng thái là Khóa hoặc Xóa -> Trigger logic khóa Voucher
        if (status == CatalogStatus.INACTIVE || status == CatalogStatus.DELETED) {
            List<UUID> childrenIds = children.stream().map(AppService::getServiceId).collect(Collectors.toList());
            processLockVouchersAndNotify(childrenIds, "Dịch vụ hệ thống đã ngừng hoạt động.");
        }

        for (AppService child : children) {
            child.setStatus(status);
            child.setUpdatedAt(LocalDateTime.now());
            appServiceRepository.save(child);
        }
    }

    @Transactional
    public void deleteMasterService(String serviceCode) {
        User admin = validateAdmin();

        // Tìm theo Service Code
        MasterService master = masterServiceRepository.findByServiceCode(serviceCode)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        // Xóa mềm
        master.setStatus(CatalogStatus.DELETED);
        masterServiceRepository.save(master);

        // Tái sử dụng logic đồng bộ trạng thái xuống con (Con cũng bị xóa mềm theo)
        updateStatusAllChildren(serviceCode, CatalogStatus.DELETED);

        saveAuditLog(admin, "DELETE", master.getMasterId(), "MASTER_SERVIE",
                "Xóa mềm Master Service: " + serviceCode);
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

    // ... (Validate Admin, AuditLog, Notify giữ nguyên) ...
    private User validateAdmin() { return authService.getCurrentUser(httpRequest); }
    private void saveAuditLog(User actor, String action, UUID entityId, String entityType, String description) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("description", description);
            details.put("timestamp", System.currentTimeMillis());

            AuditLog log = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityType(entityType) // "MASTER_SERVICE" hoặc "APP_SERVICE"
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(getClientIp())
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

    private void notifyUser(User user, String title, String message) {
        try {
            String url = (user.getUserType() == UserType.ADMIN) ? "/admin/services" : "/merchant/menu";
            notificationService.createNotification(user, title, message, "SUCCESS", url);
        } catch (Exception ignored) {}
    }
}