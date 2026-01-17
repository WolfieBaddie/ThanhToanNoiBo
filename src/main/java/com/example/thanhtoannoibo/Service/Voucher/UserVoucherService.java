package com.example.thanhtoannoibo.Service.Voucher;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Voucher.BuyVoucherRequest;
import com.example.thanhtoannoibo.DTO.Request.Voucher.VoucherFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Voucher.BuyVoucherResponse;
import com.example.thanhtoannoibo.DTO.Response.Voucher.UserVoucherResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.Order.Order;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Order.OrderRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Repository.Wallet.PaymentDetailRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Service.Credit.UserCreditService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserVoucherService {
    private final AppServiceRepository serviceRepository;
    private final UserCreditService userCreditService;
    private final AuthService authService;
    private final HttpServletRequest httpRequest;

    // Repositories
    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentDetailRepository paymentDetailRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(rollbackFor = Exception.class)
    public BuyVoucherResponse buyVoucher(BuyVoucherRequest request) {
        // --- 1. VALIDATE DỮ LIỆU ĐẦU VÀO ---
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getServiceId() == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getAmount() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // 2. Lấy User hiện tại
        User user = authService.getCurrentUser(httpRequest);

        // 3. Lấy thông tin Dịch vụ (Vé)
        AppService appService = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        if (!Boolean.TRUE.equals(appService.getIsActive())) {
            throw new AppException(ErrorCode.SERVICE_INACTIVE);
        }

        // 4. Tính toán số tiền cần thanh toán
        BigDecimal unitPrice = appService.getUnitPrice();
        BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(request.getAmount()));

        // 5. Trừ tiền trong ví
        UserCredit updatedCredit = userCreditService.deductBalance(user.getUserId(), totalAmount);

        // 6. Tạo Order (Trạng thái COMPLETED)
        String orderRef = "ORD-" + System.currentTimeMillis() + "-" + RandomStringUtils.randomAlphanumeric(4).toUpperCase();

        Order order = Order.builder()
                .user(user)
                .serviceEntity(appService)
                .orderRef(orderRef)
                .amountPaid(totalAmount)
                .paymentMethod(OrderMethod.CREDIT)
                .paymentStatus(PaymentStatus.PAID)
                .createdAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .build();
        orderRepository.save(order);

        // 7. Tạo Transaction (Trừ tiền - SPENDING)
        String txnRef = "TXN-" + System.currentTimeMillis();

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("orderId", order.getOrderId().toString());
        metadata.put("gateway", "SWallet");
        metadata.put("quantity", request.getAmount());
        metadata.put("unitPrice", unitPrice);
        metadata.put("serviceCode", appService.getServiceCode());

        Transaction transaction = Transaction.builder()
                .credit(updatedCredit)
                .transactionRef(txnRef)
                .amount(totalAmount.negate())
                .balanceAfter(updatedCredit.getBalance())
                .transactionType(TransactionType.BUY_VOUCHER)
                .status(TransactionStatus.COMPLETED)
                .description("Mua " + request.getAmount() + " x " + appService.getServiceName())
                .metadata(metadata)
                .createdAt(LocalDateTime.now())
                .build();
        transactionRepository.save(transaction);

        // 8. Tạo PaymentDetail
        PaymentDetail paymentDetail = PaymentDetail.builder()
                .transaction(transaction)
                .service(appService)
                .quantity(BigDecimal.valueOf(request.getAmount()))
                .amount(totalAmount)
                .build();
        paymentDetailRepository.save(paymentDetail);

        // --- 9. XỬ LÝ SINH VÉ (TÁCH LUỒNG BULK / SINGLE) ---
        List<UserVoucher> vouchers = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusDays(30);

        if (request.getAmount() > 1) {
            // TRƯỜNG HỢP > 1: BULK INSERT
            for (int i = 0; i < request.getAmount(); i++) {
                vouchers.add(createVoucherEntity(user, appService, unitPrice, transaction, now, expiresAt));
            }
            // Lưu 1 lần (Batch insert)
            userVoucherRepository.saveAll(vouchers);
        } else {
            // TRƯỜNG HỢP = 1: SINGLE INSERT
            UserVoucher voucher = createVoucherEntity(user, appService, unitPrice, transaction, now, expiresAt);
            // Lưu đơn lẻ
            userVoucherRepository.save(voucher);
            // Add vào list để dùng chung logic trả về response
            vouchers.add(voucher);
        }

        // 10. Ghi AuditLog (Truyền List vào để tái sử dụng hàm cũ)
        saveAuditLog(user, order, vouchers, totalAmount);

        // 11. Trả về Response
        List<String> codes = vouchers.stream()
                .map(UserVoucher::getVoucherCode)
                .collect(Collectors.toList());

        return BuyVoucherResponse.builder()
                .orderId(order.getOrderId())
                .transactionId(transaction.getTransactionId())
                .totalAmount(totalAmount)
                .quantity(request.getAmount())
                .voucherCodes(codes)
                .purchasedAt(now)
                .build();
    }

    private UserVoucher createVoucherEntity(User user, AppService appService, BigDecimal unitPrice,
                                            Transaction transaction, LocalDateTime now, LocalDateTime expiresAt) {
        String voucherCode = String.format("%s-%d-%s",
                appService.getServiceCode().toUpperCase(),
                System.currentTimeMillis(),
                RandomStringUtils.randomAlphanumeric(4).toUpperCase());

        return UserVoucher.builder()
                .owner(user)
                .serviceId(appService.getServiceId())
                .voucherCode(voucherCode)
                .status(UserVoucherStatus.ACTIVE)
                .priceAtPurchase(unitPrice)
                .purchaseTransaction(transaction)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();
    }

    private void saveAuditLog(User user, Order order, List<UserVoucher> vouchers, BigDecimal totalAmount) {
        try {
            Map<String, Object> details = new HashMap<>();
            // Check null serviceEntity để tránh NullPointerException
            if (order.getServiceEntity() != null) {
                details.put("service_name", order.getServiceEntity().getServiceName());
            }
            details.put("quantity", vouchers.size());
            details.put("total_amount", totalAmount);
            if (!vouchers.isEmpty()) {
                details.put("first_voucher_code", vouchers.get(0).getVoucherCode());
            }
            details.put("order_ref", order.getOrderRef());

            // Lấy IP an toàn
            String ipAddress = "UNKNOWN";
            if (httpRequest != null) {
                ipAddress = httpRequest.getRemoteAddr();
            }

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action("BUY_VOUCHER")
                    .entityType("ORDER") // Link tới Order hoặc UserVoucher
                    .entityId(order.getOrderId())
                    .details(details)
                    .ipAddress(ipAddress)
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log for voucher purchase: {}", e.getMessage());
            // Không throw exception để tránh rollback giao dịch chính
        }
    }

    // Các hàm helper khác giữ nguyên...
    /**
     * HÀM MỚI: Lấy danh sách Voucher của tôi (Phân trang + Filter)
     */
    public Page<UserVoucherResponse> getMyVouchers(VoucherFilterRequest filter, Pageable pageable) {
        // 1. Lấy User hiện tại
        User currentUser = authService.getCurrentUser(httpRequest);

        // 2. Build Specification (Query Động)
        Specification<UserVoucher> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Bắt buộc: Chỉ lấy vé của user này
            predicates.add(cb.equal(root.get("owner").get("userId"), currentUser.getUserId()));

            if (filter != null) {
                // Lọc theo trạng thái (nếu có)
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
                // Tìm theo mã code
                if (filter.getVoucherCode() != null && !filter.getVoucherCode().isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("voucherCode")), "%" + filter.getVoucherCode().toLowerCase() + "%"));
                }
            }
            // Sắp xếp mặc định: Mới nhất lên đầu (nếu Pageable chưa có sort)
            // query.orderBy(cb.desc(root.get("createdAt")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // 3. Query DB lấy Page Voucher
        Page<UserVoucher> pageResult = userVoucherRepository.findAll(spec, pageable);

        // 4. TỐI ƯU: Lấy thông tin Service (Tránh lỗi N+1 Query)
        // Collect tất cả serviceId từ danh sách voucher
        List<UUID> serviceIds = pageResult.getContent().stream()
                .map(UserVoucher::getServiceId)
                .distinct()
                .collect(Collectors.toList());

        // Query bảng Service 1 lần duy nhất
        List<AppService> services = serviceRepository.findAllById(serviceIds);

        // Convert List Service thành Map<UUID, AppService> để tra cứu nhanh
        Map<UUID, AppService> serviceMap = services.stream()
                .collect(Collectors.toMap(AppService::getServiceId, Function.identity()));

        // 5. Map sang DTO Response
        return pageResult.map(voucher -> mapToResponse(voucher, serviceMap.get(voucher.getServiceId())));
    }

    public UserVoucherResponse getVoucherDetail(UUID voucherId) {
        // 1. Lấy User hiện tại
        User currentUser = authService.getCurrentUser(httpRequest);

        // 2. Tìm Voucher trong DB
        UserVoucher voucher = userVoucherRepository.findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        // 3. Security Check: Vé này có phải của user đang đăng nhập không?
        if (!voucher.getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
            // Hoặc ném VOUCHER_NOT_FOUND để giấu luôn sự tồn tại của vé
        }

        // 4. Lấy thông tin Service đi kèm
        AppService service = null;
        if (voucher.getServiceId() != null) {
            service = serviceRepository.findById(voucher.getServiceId()).orElse(null);
        }

        // 5. Map sang DTO Response (Tái sử dụng hàm mapToResponse đã viết)
        return mapToResponse(voucher, service);
    }

    public UserVoucher getVoucherByCode(String code) {
        return userVoucherRepository.findByVoucherCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
    }

    // Helper mapping
    private UserVoucherResponse mapToResponse(UserVoucher voucher, AppService service) {
        String serviceName = "Dịch vụ không xác định";
        String imageUrl = null;
        String categoryName = "";

        if (service != null) {
            serviceName = service.getServiceName();
            imageUrl = service.getImageUrl();
            if (service.getCategory() != null) {
                categoryName = service.getCategory().getCategoryName();
            }
        }

        // Check hết hạn
        boolean isExpired = voucher.getExpiresAt() != null && voucher.getExpiresAt().isBefore(LocalDateTime.now());

        return UserVoucherResponse.builder()
                .voucherId(voucher.getVoucherId())
                .voucherCode(voucher.getVoucherCode())
                .status(voucher.getStatus().name())
                .serviceId(voucher.getServiceId())
                .serviceName(serviceName)
                .imageUrl(imageUrl)
                .categoryName(categoryName)
                .priceAtPurchase(voucher.getPriceAtPurchase())
                .createdAt(voucher.getCreatedAt())
                .expiresAt(voucher.getExpiresAt())
                .usedAt(voucher.getUsedAt())
                .isExpired(isExpired)
                .qrContent(voucher.getVoucherCode())
                .build();
    }
}