package com.example.thanhtoannoibo.Service.Voucher;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Voucher.BuyVoucherRequest;
import com.example.thanhtoannoibo.DTO.Request.Voucher.ExchangeVoucherRequest;
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
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserVoucherService {

    private final AppServiceRepository serviceRepository;
    private final UserCreditService userCreditService;
    private final AuthService authService;
    private final HttpServletRequest httpRequest;
    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentDetailRepository paymentDetailRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    @Transactional(rollbackFor = Exception.class)
    public BuyVoucherResponse buyVoucher(BuyVoucherRequest request) {
        // 1. Validate
        if (request == null || request.getServiceId() == null || request.getAmount() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // 2. Lấy User & Service (để lấy giá và tên)
        User user = authService.getCurrentUser(httpRequest);
        AppService appService = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        if (!Boolean.TRUE.equals(appService.getIsActive())) {
            throw new AppException(ErrorCode.SERVICE_INACTIVE);
        }

        // 3. Tính tiền
        BigDecimal unitPrice = appService.getUnitPrice();
        BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(request.getAmount()));

        // 4. Trừ tiền
        UserCredit currentCredit = userCreditService.getUserCredit(user.getUserId());
        if (currentCredit.getBalance().compareTo(totalAmount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }
        UserCredit updatedCredit = userCreditService.deductBalance(user.getUserId(), totalAmount);

        // 5. Tạo Order (Chỉ lưu snapshot text vào description nếu muốn, hoặc null serviceEntity)
        String orderRef = "ORD-" + System.currentTimeMillis() + "-" + RandomStringUtils.randomAlphanumeric(4).toUpperCase();
        Order order = Order.builder()
                .user(user)
                .serviceEntity(null) // [YC]: Không lưu serviceId vào DB
                .orderRef(orderRef)
                .amountPaid(totalAmount)
                .paymentMethod(OrderMethod.CREDIT)
                .paymentStatus(PaymentStatus.PAID)
                .createdAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .build();
        orderRepository.save(order);

        // 6. Tạo Transaction
        String txnRef = "TXN-" + System.currentTimeMillis();
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("orderId", order.getOrderId().toString());
        metadata.put("quantity", request.getAmount());
        metadata.put("serviceName", appService.getServiceName()); // Lưu tên vào metadata

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

        // 7. PaymentDetail (Có thể để service là null nếu muốn triệt để, nhưng thường table này cần link)
        // Nếu muốn không lưu serviceId cả ở đây thì set null
        PaymentDetail paymentDetail = PaymentDetail.builder()
                .transaction(transaction)
                .service(null) // [YC]: Không lưu serviceId
                .quantity(BigDecimal.valueOf(request.getAmount()))
                .amount(totalAmount)
                .build();
        paymentDetailRepository.save(paymentDetail);

        // --- 8. TẠO VOUCHER (LƯU SNAPSHOT NAME) ---
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusDays(30);

        UserVoucher voucher = createVoucherEntity(
                user,
                appService, // Truyền service vào chỉ để lấy tên/ảnh
                unitPrice,
                transaction,
                now,
                expiresAt,
                request.getAmount()
        );
        userVoucherRepository.save(voucher);

        notificationService.createNotification(
                user,
                "Mua vé thành công",
                "Bạn đã mua thành công " + request.getAmount() + " vé " + appService.getServiceName(),
                "SUCCESS",
                "/vouchers/" + voucher.getVoucherId() // Link tới chi tiết vé
        );

        // 9. Audit Log
        saveAuditLog(user, order, voucher, totalAmount);

        return BuyVoucherResponse.builder()
                .orderId(order.getOrderId())
                .transactionId(transaction.getTransactionId())
                .totalAmount(totalAmount)
                .quantity(request.getAmount())
                .voucherCodes(Collections.singletonList(voucher.getVoucherCode()))
                .purchasedAt(now)
                .build();
    }

    // Helper tạo entity: Set Service ID = NULL, Set Service Name = Có giá trị
    private UserVoucher createVoucherEntity(User user, AppService appService, BigDecimal unitPrice,
                                            Transaction transaction, LocalDateTime now, LocalDateTime expiresAt,
                                            Integer quantity) {
        String voucherCode = String.format("%s-%d-%s",
                appService.getServiceCode().toUpperCase(),
                System.currentTimeMillis(),
                RandomStringUtils.randomAlphanumeric(4).toUpperCase());

        String catName = (appService.getCategory() != null) ? appService.getCategory().getCategoryName() : "";

        return UserVoucher.builder()
                .owner(user)
                .serviceId(appService.getServiceId())
                .voucherCode(voucherCode)
                .status(UserVoucherStatus.ACTIVE)
                .quantity(quantity)
                .priceAtPurchase(unitPrice)
                .purchaseTransaction(transaction)
                .createdAt(now)
                .expiresAt(expiresAt)

                // [QUAN TRỌNG]: Snapshot thông tin, không lưu ID
                .serviceName(appService.getServiceName())
                .imageUrl(appService.getImageUrl())
                .categoryName(catName)
                .build();
    }

    // --- Helper Mapping (Đọc trực tiếp từ Voucher, không query AppService) ---
    private UserVoucherResponse mapToResponse(UserVoucher voucher) {
        boolean isExpired = voucher.getExpiresAt() != null && voucher.getExpiresAt().isBefore(LocalDateTime.now());

        return UserVoucherResponse.builder()
                .voucherId(voucher.getVoucherId())
                .voucherCode(voucher.getVoucherCode())
                .status(voucher.getStatus().name())

                // Map từ các trường snapshot trong DB
                .serviceId(voucher.getServiceId()) // Sẽ là null
                .serviceName(voucher.getServiceName())
                .imageUrl(voucher.getImageUrl())
                .categoryName(voucher.getCategoryName())

                .priceAtPurchase(voucher.getPriceAtPurchase())
                .createdAt(voucher.getCreatedAt())
                .expiresAt(voucher.getExpiresAt())
                .usedAt(voucher.getUsedAt())
                .isExpired(isExpired)
                .qrContent(voucher.getVoucherCode())
                .quantity(voucher.getQuantity() != null ? voucher.getQuantity() : 1)
                .build();
    }

    // --- Get List (Không cần xử lý N+1 query nữa vì data đã nằm trong UserVoucher) ---
    public Page<UserVoucherResponse> getMyVouchers(VoucherFilterRequest filter, Pageable pageable) {
        User currentUser = authService.getCurrentUser(httpRequest);
        Specification<UserVoucher> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("owner").get("userId"), currentUser.getUserId()));

            if (filter != null) {
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
                if (filter.getVoucherCode() != null && !filter.getVoucherCode().isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("voucherCode")), "%" + filter.getVoucherCode().toLowerCase() + "%"));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<UserVoucher> pageResult = userVoucherRepository.findAll(spec, pageable);

        // Map trực tiếp, không cần fetch Services
        return pageResult.map(this::mapToResponse);
    }

    // ... (Giữ nguyên các hàm getVoucherDetail, saveAuditLog)
    public UserVoucherResponse getVoucherDetail(UUID voucherId) {
        User currentUser = authService.getCurrentUser(httpRequest);
        UserVoucher voucher = userVoucherRepository.findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        if (!voucher.getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return mapToResponse(voucher);
    }

    private void saveAuditLog(User user, Order order, UserVoucher voucher, BigDecimal totalAmount) {
        try {
            Map<String, Object> details = new HashMap<>();
            // Lấy tên từ voucher thay vì order.serviceEntity (vì order.serviceEntity giờ là null)
            details.put("service_name", voucher.getServiceName());
            details.put("quantity", voucher.getQuantity());
            details.put("total_amount", totalAmount);
            details.put("voucher_code", voucher.getVoucherCode());
            details.put("order_ref", order.getOrderRef());

            String ipAddress = (httpRequest != null) ? httpRequest.getRemoteAddr() : "UNKNOWN";

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action("BUY_VOUCHER")
                    .entityType("ORDER")
                    .entityId(order.getOrderId())
                    .details(details)
                    .ipAddress(ipAddress)
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public BuyVoucherResponse exchangeVoucher(ExchangeVoucherRequest request) {
        // 1. Validate Input
        if (request == null || request.getQuantity() <= 0 ||
                request.getCreditValue() == null || request.getCreditValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // 2. Lấy User từ Request Context
        User user = authService.getCurrentUser(httpRequest);

        // 3. Tính toán tổng tiền cần trừ
        BigDecimal unitValue = request.getCreditValue();
        BigDecimal totalAmount = unitValue.multiply(BigDecimal.valueOf(request.getQuantity()));

        // 4. Kiểm tra số dư UserCredit
        UserCredit currentCredit = userCreditService.getUserCredit(user.getUserId());
        if (currentCredit.getBalance().compareTo(totalAmount) < 0) {
            // Báo lỗi nếu không đủ tiền
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // 5. Trừ tiền (Deduct Balance)
        UserCredit updatedCredit = userCreditService.deductBalance(user.getUserId(), totalAmount);

        // 6. Tạo Order (Service = NULL)
        String orderRef = "EXC-" + System.currentTimeMillis() + "-" + RandomStringUtils.randomAlphanumeric(4).toUpperCase();
        Order order = Order.builder()
                .user(user)
                .serviceEntity(null) // [QUAN TRỌNG]: Không gắn service
                .orderRef(orderRef)
                .amountPaid(totalAmount)
                .paymentMethod(OrderMethod.CREDIT)
                .paymentStatus(PaymentStatus.PAID)
                .createdAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .build();
        orderRepository.save(order);

        // 7. Tạo Transaction
        String txnRef = "TXN-EXC-" + System.currentTimeMillis();
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("orderId", order.getOrderId().toString());
        metadata.put("quantity", request.getQuantity());
        metadata.put("unitValue", unitValue);
        metadata.put("type", "BUY_VOUCHER");

        Transaction transaction = Transaction.builder()
                .credit(updatedCredit)
                .transactionRef(txnRef)
                .amount(totalAmount.negate()) // Số âm
                .balanceAfter(updatedCredit.getBalance())
                .transactionType(TransactionType.BUY_VOUCHER)
                .status(TransactionStatus.COMPLETED)
                .description("Đổi voucher mệnh giá " + unitValue)
                .metadata(metadata)
                .createdAt(LocalDateTime.now())
                .build();
        transactionRepository.save(transaction);

        // 8. Tạo PaymentDetail
        PaymentDetail paymentDetail = PaymentDetail.builder()
                .transaction(transaction)
                .service(null) // Không có service cụ thể
                .quantity(BigDecimal.valueOf(request.getQuantity()))
                .amount(totalAmount)
                .build();
        paymentDetailRepository.save(paymentDetail);

        // 9. Sinh Voucher (Generic)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusDays(90); // Ví dụ: Hạn 3 tháng

        UserVoucher voucher = createGenericVoucherEntity(
                user,
                unitValue,
                transaction,
                now,
                expiresAt,
                request.getQuantity()
        );
        userVoucherRepository.save(voucher);

        long xuValue = unitValue.divide(BigDecimal.valueOf(1000), 0, RoundingMode.FLOOR).longValue();

        // 10. Thông báo & Audit Log
        notificationService.createNotification(
                user,
                "Đổi voucher thành công",
                "Bạn đã đổi " + request.getQuantity() + " voucher trị giá " + xuValue + " Xu.",
                "SUCCESS",
                "/vouchers/" + voucher.getVoucherId()
        );

        saveAuditLogGeneric(user, order, voucher, totalAmount);

        // 11. Trả về Response
        return BuyVoucherResponse.builder()
                .orderId(order.getOrderId())
                .transactionId(transaction.getTransactionId())
                .totalAmount(totalAmount)
                .quantity(request.getQuantity())
                .voucherCodes(Collections.singletonList(voucher.getVoucherCode()))
                .purchasedAt(now)
                .build();
    }

    private UserVoucher createGenericVoucherEntity(User user, BigDecimal creditValue,
                                                   Transaction transaction, LocalDateTime now, LocalDateTime expiresAt,
                                                   Integer quantity) {
        // Mã voucher bắt đầu bằng GEN (Generic)
        String voucherCode = String.format("GEN-%d-%s",
                System.currentTimeMillis(),
                RandomStringUtils.randomAlphanumeric(4).toUpperCase());
        long xuValue = creditValue.divide(BigDecimal.valueOf(1000), 0, RoundingMode.FLOOR).longValue();
        return UserVoucher.builder()
                .owner(user)
                .serviceId(null) // [QUAN TRỌNG]: Null
                .voucherCode(voucherCode)
                .status(UserVoucherStatus.ACTIVE)
                .quantity(quantity)
                .priceAtPurchase(creditValue) // Lưu giá trị quy đổi vào đây
                .purchaseTransaction(transaction)
                .createdAt(now)
                .expiresAt(expiresAt)

                // Snapshot thông tin hiển thị
                .serviceName("Voucher " + xuValue + " Xu")
                .build();
    }

    // Helper Audit Log riêng cho Generic Voucher
    private void saveAuditLogGeneric(User user, Order order, UserVoucher voucher, BigDecimal totalAmount) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("service_name", "GENERIC_VOUCHER");
            details.put("quantity", voucher.getQuantity());
            details.put("total_amount", totalAmount);
            details.put("voucher_code", voucher.getVoucherCode());
            details.put("order_ref", order.getOrderRef());

            String ipAddress = (httpRequest != null) ? httpRequest.getRemoteAddr() : "UNKNOWN";

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action("EXCHANGE_VOUCHER") // Action riêng
                    .entityType("ORDER")
                    .entityId(order.getOrderId())
                    .details(details)
                    .ipAddress(ipAddress)
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }
}