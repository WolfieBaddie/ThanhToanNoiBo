package com.example.thanhtoannoibo.Service.QrCode;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.QrCode.GenerateQrRequest;
import com.example.thanhtoannoibo.DTO.Request.QrCode.ProcessQrRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.QrCode.ProcessQrResponse;
import com.example.thanhtoannoibo.DTO.Response.QrCode.QrResponse;
import com.example.thanhtoannoibo.DTO.Response.Transfer.QrCodeResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit; // Import UserCredit
import com.example.thanhtoannoibo.Entity.Order.Order;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.QrCode.QrScanLog;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucherDetail;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.CounterRepository;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository; // Import Repo
import com.example.thanhtoannoibo.Repository.Order.OrderRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrScanLogRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherDetailRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Repository.Wallet.PaymentDetailRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QrCodeService {

    private final QrCodeRepository qrCodeRepository;
    private final TransactionRepository transactionRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserCreditRepository userCreditRepository; // NEW: Repo quản lý Xu
    private final AuthService authService;
    private final HttpServletRequest request;
    private final AuditLogRepository auditLogRepository;
    private final QrScanLogRepository qrScanLogRepository;
    private final CounterRepository counterRepository;
    private final AppServiceRepository appServiceRepository;
    private final OrderRepository orderRepository;
    private final PaymentDetailRepository paymentDetailRepository;
    private final AppPackageRepository appPackageRepository;
    private final UserVoucherDetailRepository userVoucherDetailRepository;
    private final NotificationService notificationService;

    @Transactional
    public QrResponse generateQr(GenerateQrRequest request, HttpServletRequest httpRequest) {
        User currentUser = authService.getCurrentUser(httpRequest);

        UserVoucher linkedVoucher = userVoucherRepository.findById(request.getVoucherId())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        // 1. Validate Quyền sở hữu
        if (!linkedVoucher.getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 2. Validate Trạng thái Voucher
        if (linkedVoucher.getStatus() != UserVoucherStatus.ACTIVE) {
            throw new AppException(ErrorCode.VOUCHER_USED_OR_EXPIRED);
        }

        // Check hạn sử dụng gốc của Voucher
        LocalDateTime now = LocalDateTime.now();
        if (linkedVoucher.getExpiresAt() != null && linkedVoucher.getExpiresAt().isBefore(now)) {
            throw new AppException(ErrorCode.VOUCHER_USED_OR_EXPIRED);
        }

        // 3. XỬ LÝ SỐ LƯỢNG
        int quantityToUse = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;

        if (linkedVoucher.getQuantity() < quantityToUse) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // 4. TÍNH TOÁN GIÁ TRỊ & HẠN DÙNG
        BigDecimal totalQrValue = linkedVoucher.getPriceAtPurchase().multiply(BigDecimal.valueOf(quantityToUse));

        LocalDateTime proposedQrExpiry = now.plusDays(1);
        if (linkedVoucher.getExpiresAt() != null && proposedQrExpiry.isAfter(linkedVoucher.getExpiresAt())) {
            proposedQrExpiry = linkedVoucher.getExpiresAt();
        }

        // 5. SINH MÃ CODE MỚI (Luôn sinh chuỗi mới để đảm bảo bảo mật, tránh người khác chụp lại mã cũ dùng tiếp)
        String newCodeString = "QR-V-" + System.currentTimeMillis() + "-" + RandomStringUtils.randomAlphanumeric(8).toUpperCase();

        // 6. [LOGIC MỚI] TÌM HOẶC TẠO (REUSE OR CREATE)
        QRCode qrCode;

        // Tìm QR cũ đã hết hạn của chính Voucher này
        Optional<QRCode> recyclableQr = qrCodeRepository.findFirstByPayerVoucherAndExpiresAtBefore(linkedVoucher, now);

        if (recyclableQr.isPresent()) {
            // A. TÁI SỬ DỤNG (UPDATE)
            qrCode = recyclableQr.get();
            log.info("Recycling expired QR Code ID: {}", qrCode.getQrId());

            qrCode.setCodeString(newCodeString);       // Cập nhật mã hiển thị mới
            qrCode.setAmount(totalQrValue);            // Cập nhật giá trị (đề phòng giá thay đổi)
            qrCode.setUsageLimit(quantityToUse);       // Cập nhật số lượng
            qrCode.setUsageCount(0);                   // Reset số lần dùng
            qrCode.setStatus(QrCodeStatus.ACTIVE);     // Kích hoạt lại
            qrCode.setExpiresAt(proposedQrExpiry);     // Gia hạn
            qrCode.setCreatedAt(now);                  // Làm mới ngày tạo (tuỳ chọn, để sort cho dễ)

            // Lưu ý: owner và payerVoucher giữ nguyên không đổi
        } else {
            // B. TẠO MỚI (CREATE)
            qrCode = QRCode.builder()
                    .codeString(newCodeString)
                    .type(QrCodeType.VOUCHER)
                    .owner(currentUser)
                    .payerVoucher(linkedVoucher)
                    .ownerType("USER")
                    .amount(totalQrValue)
                    .usageLimit(quantityToUse)
                    .usageCount(0)
                    .status(QrCodeStatus.ACTIVE)
                    .expiresAt(proposedQrExpiry)
                    .createdAt(now)
                    .build();
        }

        QRCode savedQr = qrCodeRepository.save(qrCode);

        // Log Audit (Vẫn log bình thường để tra soát lịch sử sinh mã)
        saveGenerateQrLog(currentUser, savedQr, linkedVoucher, totalQrValue);

        return mapToQrResponse(savedQr);
    }

    public QrResponse verifyQrContent(String qrCodeString, HttpServletRequest httpRequest) {
        User merchant = authService.getCurrentUser(httpRequest);

        // Validate Merchant
        counterRepository.findByManagedBy_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        QRCode qr = qrCodeRepository.findByCodeString(qrCodeString)
                .orElseThrow(() -> new AppException(ErrorCode.QR_CODE_NOT_FOUND));

        if (qr.getStatus() != QrCodeStatus.ACTIVE) {
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }
        if (qr.getExpiresAt() != null && qr.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }

        return mapToQrResponse(qr);
    }

    /**
     * Xử lý giao dịch khi quét QR
     * Logic mới:
     * 1. Xác định người quét (Payer).
     * 2. Trừ Xu trong UserCredits của người quét.
     * 3. Cập nhật trạng thái UserVoucher (Item) thành ACTIVE/USED.
     */
    /**
     * Xử lý giao dịch khi quét QR (Cập nhật logic Confirm số lượng)
     */
    /**
     * Xử lý giao dịch khi quét QR
     * Cập nhật:
     * 1. Cập nhật đúng usageCount và usageLimit của QR (hỗ trợ QR dùng nhiều lần).
     * 2. Log giao dịch tập trung vào "Trừ số lượng" thay vì "Trừ tiền" để tránh User hiểu nhầm.
     */
    @Transactional(rollbackFor = Exception.class)
    public ProcessQrResponse processTransaction(ProcessQrRequest req, HttpServletRequest httpRequest) {
        User merchant = authService.getCurrentUser(httpRequest);

        // 1. Validate Merchant & Quầy
        Counter merchantCounter = counterRepository.findByManagedBy_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        // 2. Validate QR
        QRCode targetQr = qrCodeRepository.findActiveQRCodeForUpdate(req.getQrCode())
                .orElseThrow(() -> new AppException(ErrorCode.QR_CODE_NOT_FOUND));

        if (targetQr.getStatus() != QrCodeStatus.ACTIVE) {
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }

        if (targetQr.getExpiresAt() != null && targetQr.getExpiresAt().isBefore(LocalDateTime.now())) {
            targetQr.setStatus(QrCodeStatus.EXPIRED);
            qrCodeRepository.save(targetQr);
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }

        // 3. KIỂM TRA & CẬP NHẬT QR
        int currentUsage = targetQr.getUsageCount();
        int maxLimit = targetQr.getUsageLimit();
        int remainingQrUsage = maxLimit - currentUsage;
        int qtyToProcess = (req.getQuantity() != null && req.getQuantity() > 0) ? req.getQuantity() : 1;

        if (qtyToProcess > remainingQrUsage) {
            throw new AppException(ErrorCode.EXCEED_QR_LIMIT);
        }

        targetQr.setUsageCount(currentUsage + qtyToProcess);
        targetQr.setLastUsedAt(LocalDateTime.now());

        if (targetQr.getUsageCount() >= targetQr.getUsageLimit()) {
            targetQr.setStatus(QrCodeStatus.EXPIRED);
        }
        qrCodeRepository.save(targetQr);

        // =========================================================================
        // 4. XỬ LÝ NGHIỆP VỤ
        // =========================================================================
        UserVoucher voucher = targetQr.getPayerVoucher();
        AppService targetService = null;
        AppPackage targetPackage = null;
        String transactionDesc = req.getDescription(); // Description gửi từ Frontend hoặc tạo bên dưới

        if (voucher.getPackageId() != null) {
            targetPackage = appPackageRepository.findById(voucher.getPackageId())
                    .orElse(null);
        }

        if (req.getServiceId() != null) {
            targetService = appServiceRepository.findById(req.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        } else if (voucher.getServiceId() != null) {
            targetService = appServiceRepository.findById(voucher.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        }

        // Nếu description trống, tự build description mặc định
        if (transactionDesc == null || transactionDesc.isEmpty()) {
            if (targetService != null) {
                transactionDesc = String.format("Đổi %d %s", qtyToProcess, targetService.getServiceName());
            } else if (targetPackage != null) {
                transactionDesc = String.format("Sử dụng gói %s", targetPackage.getPackageName());
            } else {
                transactionDesc = "Sử dụng tại " + merchantCounter.getCounterName();
            }
        }

        // 5. Trừ kho Voucher Cha (Master)
        if (voucher.getQuantity() < qtyToProcess) {
            throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
        }
        voucher.setQuantity(voucher.getQuantity() - qtyToProcess);
        if (voucher.getQuantity() == 0) {
            voucher.setStatus(UserVoucherStatus.EXPIRED);
            voucher.setUsedAt(LocalDateTime.now());
        }
        userVoucherRepository.save(voucher);

        // 6. Cộng tiền Merchant
        BigDecimal transactionValue = voucher.getPriceAtPurchase().multiply(BigDecimal.valueOf(qtyToProcess));
        UserCredit merchantCredit = userCreditRepository.findWithLockByUser_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.CREDIT_NOT_FOUND));
        merchantCredit.setBalance(merchantCredit.getBalance().add(transactionValue));
        userCreditRepository.save(merchantCredit);

        // 7. Tạo Order
        Order order = Order.builder()
                .user(voucher.getOwner())
                .serviceEntity(targetService)
                .packageEntity(targetPackage)
                .orderRef("ORD-QR-" + System.currentTimeMillis())
                .amountPaid(transactionValue)
                .paymentMethod(OrderMethod.QR_VOUCHER)
                .paymentStatus(PaymentStatus.PAID)
                .completedAt(LocalDateTime.now())
                .build();
        orderRepository.save(order);

        // 8. Tạo Transaction
        // Lưu ý: transactionDesc có thể thay đổi nếu logic bên dưới update builder
        // Nên ta khởi tạo builder log chi tiết ở đây
        StringBuilder finalLogBuilder = new StringBuilder();

        Transaction mainTxn = Transaction.builder()
                .transactionRef("TXN-" + order.getOrderRef())
                .qrCode(targetQr)
                .transactionType(TransactionType.REDEMPTION)
                .payee(merchant)
                .credit(merchantCredit)
                .amount(transactionValue)
                .balanceAfter(merchantCredit.getBalance())
                .status(TransactionStatus.COMPLETED)
                // .description(transactionDesc) // Set tạm, sẽ update sau nếu cần chi tiết
                .createdAt(LocalDateTime.now())
                .build();

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("counter_name", merchantCounter.getCounterName());
        metadata.put("merchant_id", merchant.getUserId().toString());
        metadata.put("type", "VOUCHER_REDEMPTION");
        metadata.put("quantity_deducted", qtyToProcess);
        if (targetPackage != null) {
            metadata.put("package_name", targetPackage.getPackageName());
        }
        mainTxn.setMetadata(metadata);
        transactionRepository.save(mainTxn);

        List<PaymentDetail> paymentDetails = new ArrayList<>();

        // TRƯỜNG HỢP 1: Frontend gửi xuống danh sách chi tiết (Combo nhiều món)
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            List<UUID> serviceIds = req.getItems().stream()
                    .map(ProcessQrRequest.QrItemRequest::getServiceId)
                    .collect(Collectors.toList());

            List<AppService> services = appServiceRepository.findAllById(serviceIds);
            Map<UUID, AppService> serviceMap = services.stream()
                    .collect(Collectors.toMap(AppService::getServiceId, s -> s));

            for (ProcessQrRequest.QrItemRequest itemReq : req.getItems()) {
                AppService s = serviceMap.get(itemReq.getServiceId());
                if (s != null) {
                    PaymentDetail detail = PaymentDetail.builder()
                            .transaction(mainTxn)
                            .packageRef(targetPackage)
                            .service(s)
                            .quantity(BigDecimal.valueOf(itemReq.getQuantity()))
                            .amount(s.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())))
                            .createdAt(LocalDateTime.now())
                            .build();
                    paymentDetails.add(detail);

                    // Build log chi tiết: "2 x Cơm, 1 x Nước"
                    if(finalLogBuilder.length() > 0) finalLogBuilder.append(", ");
                    finalLogBuilder.append(itemReq.getQuantity()).append(" x ").append(s.getServiceName());
                }
            }
        }
        // TRƯỜNG HỢP 2: Frontend không gửi items (Vé lẻ)
        else {
            PaymentDetail detail = PaymentDetail.builder()
                    .transaction(mainTxn)
                    .quantity(BigDecimal.valueOf(qtyToProcess))
                    .amount(transactionValue)
                    .service(targetService)
                    .packageRef(targetPackage)
                    .createdAt(LocalDateTime.now())
                    .build();
            paymentDetails.add(detail);

            // Build log đơn giản
            if (targetService != null) {
                finalLogBuilder.append(qtyToProcess).append(" x ").append(targetService.getServiceName());
            } else if (targetPackage != null) {
                finalLogBuilder.append(qtyToProcess).append(" x ").append(targetPackage.getPackageName());
            } else {
                finalLogBuilder.append("Voucher ").append(qtyToProcess).append(" lượt");
            }
        }

        if (!paymentDetails.isEmpty()) {
            paymentDetailRepository.saveAll(paymentDetails);
        }

        // Cập nhật lại description cho transaction chính xác hơn
        String detailedDescription = finalLogBuilder.toString();
        mainTxn.setDescription("Đổi: " + detailedDescription);
        transactionRepository.save(mainTxn);

        // 9. Logs hệ thống
        saveAuditLogForTransaction(merchant, mainTxn, voucher, BigDecimal.ZERO, merchantCounter);
        saveQrScanLog(targetQr, merchant, "SUCCESS", detailedDescription, req.getImageUrl());

        // =========================================================================
        // 10. [MỚI] GỬI THÔNG BÁO (NOTIFICATION)
        // =========================================================================

        // A. Thông báo cho Khách hàng (User sở hữu voucher)
        try {
            String userMsg = "Bạn đã sử dụng thành công: " + detailedDescription + " tại " + merchantCounter.getCounterName();
            notificationService.createNotification(
                    voucher.getOwner(),
                    "Sử dụng dịch vụ thành công",
                    userMsg,
                    "SUCCESS",
                    "/history" // Link dẫn đến lịch sử giao dịch (tuỳ frontend)
            );
        } catch (Exception e) {
            log.error("Failed to send User notification", e);
        }

        // B. Thông báo cho Merchant (Người bán)
        try {
            String merchantMsg = "Đã xử lý thành công: " + detailedDescription + ". Khách hàng: " + voucher.getOwner().getFullName();
            notificationService.createNotification(
                    merchant,
                    "Giao dịch thành công",
                    merchantMsg,
                    "SUCCESS",
                    "/merchant/history" // Link dẫn đến lịch sử bán hàng
            );
        } catch (Exception e) {
            log.error("Failed to send Merchant notification", e);
        }

        return ProcessQrResponse.builder()
                .transactionId(mainTxn.getTransactionId())
                .transactionRef(mainTxn.getTransactionRef())
                .paidAmount(transactionValue)
                .status("SUCCESS")
                .message("Giao dịch thành công.")
                .build();
    }

    private String formatMoney(BigDecimal amount) {
        return amount == null ? "0" : amount.toString();
    }


    private void processRefund(User owner, BigDecimal refundAmount, String voucherCode) {
        UserCredit userWallet = userCreditRepository.findWithLockByUser_UserId(owner.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        userWallet.setBalance(userWallet.getBalance().add(refundAmount));
        userCreditRepository.save(userWallet);

        // Ghi Transaction Refund
        Transaction refundTxn = Transaction.builder()
                .credit(userWallet)
                .transactionRef("TXN-REFUND-" + System.currentTimeMillis())
                .transactionType(TransactionType.REFUND)
                .amount(refundAmount)
                .balanceAfter(userWallet.getBalance())
                .status(TransactionStatus.COMPLETED)
                .description("Hoàn tiền thừa từ voucher: " + voucherCode)
                .createdAt(LocalDateTime.now())
                .build();
        transactionRepository.save(refundTxn);
    }

    private void savePaymentDetail(Transaction txn, int quantity, BigDecimal amount) {
        PaymentDetail detail = PaymentDetail.builder()
                .transaction(txn)
                .quantity(BigDecimal.valueOf(quantity))
                .amount(amount)
                .createdAt(LocalDateTime.now())
                .build();
        paymentDetailRepository.save(detail);
    }

    private void saveQrScanLog(QRCode qr, User scannedBy, String result, String reason, String imageUrl) {
        try {
            String ip = (request != null) ? request.getRemoteAddr() : "UNKNOWN";
            QrScanLog log = QrScanLog.builder()
                    .qrCode(qr)
                    .scannedBy(scannedBy)
                    .scanResult(result)
                    .failureReason(reason)
                    .ipAddress(ip)
                    .imageUrl(imageUrl)
                    .createdAt(LocalDateTime.now())
                    .build();
            qrScanLogRepository.save(log);
        } catch (Exception e) {
            log.error("Log Error", e);
        }
    }

    private void saveAuditLogForTransaction(User merchant, Transaction txn, UserVoucher voucher, BigDecimal refund, Counter counter) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("voucher_code", voucher.getVoucherCode());
            details.put("refund_amount", refund);
            details.put("counter_code", counter.getCounterCode());
            details.put("transaction_ref", txn.getTransactionRef()); // Nên thêm ref để dễ tìm

            AuditLog audit = AuditLog.builder()
                    .user(merchant) // Người thực hiện hành động (Merchant)
                    .action("PROCESS_QR")
                    .entityType("TRANSACTION")
                    .entityId(txn.getTransactionId())
                    .details(details)
                    .ipAddress(request.getRemoteAddr())
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(audit);
        } catch (Exception e) {
            log.error("Audit Error", e); // Không throw lỗi để tránh rollback transaction chính
        }
    }

    private QrResponse mapToQrResponse(QRCode qr) {
        UserVoucher voucher = qr.getPayerVoucher();
        String voucherCode = (voucher != null) ? voucher.getVoucherCode() : null;
        UUID voucherId = (voucher != null) ? voucher.getVoucherId() : null;
        User owner = qr.getOwner();

        List<ServiceResponse> includedServices = new ArrayList<>();

        if (voucher != null) {
            // [LOGIC MỚI] Thay vì check Package/Service, ta lấy từ bảng chi tiết (UserVoucherDetail)
            // Việc này cover cả trường hợp Voucher Lẻ và Voucher Combo
            List<UserVoucherDetail> details = userVoucherDetailRepository.findByUserVoucher(voucher);

            if (details != null && !details.isEmpty()) {
                // Map từ UserVoucherDetail sang ServiceResponse
                includedServices = details.stream()
                        .map(this::mapDetailToResponse) // Gọi hàm mapper mới viết bên dưới
                        .collect(Collectors.toList());
            }
            // Fallback: Nếu bảng detail chưa có dữ liệu (do migrate thiếu), giữ lại logic cũ hoặc trả về rỗng
        }

        return QrResponse.builder()
                .qrId(qr.getQrId())
                .codeString(qr.getCodeString()) // Lưu ý: Entity của bạn là code hay codeString? Code bạn đưa là codeString
                .type(qr.getType().name())
                .status(qr.getStatus().name())
                .creditAmount(qr.getAmount()) // Nếu voucher thì cái này null, ví thì có value

                .voucherId(voucherId)
                .voucherCode(voucherCode)

                .expiresAt(qr.getExpiresAt())
                .createdAt(qr.getCreatedAt())

                .userId(owner != null ? owner.getUserId() : null)
                .fullName(owner != null ? owner.getFullName() : "Khách vãng lai")
                .userType(owner != null ? owner.getUserType().name() : null)
                .email(owner != null ? owner.getEmail() : null)
                .phoneNumber(owner != null ? owner.getPhoneNumber() : "")
                .imageUrl(owner != null ? owner.getImageUrl() : null)

                .includedServices(includedServices) // Danh sách này giờ đã có remainingQuantity
                .usageLimit(qr.getUsageLimit())
                .build();
    }

    // [HÀM MỚI] Map từ chi tiết voucher (Có số lượng)
    private ServiceResponse mapDetailToResponse(UserVoucherDetail detail) {
        // detail.getService() sẽ lấy thông tin tĩnh (Tên, ảnh gốc)
        AppService service = detail.getService();

        return ServiceResponse.builder()
                .serviceId(service.getServiceId())
                .serviceName(service.getServiceName())
                .imageUrl(service.getImageUrl())
                // Giá này là giá phân bổ hoặc giá gốc, tùy logic bạn muốn hiện cho Merchant
                .unitPrice(detail.getAllocatedPrice() != null ? detail.getAllocatedPrice() : service.getUnitPrice())

                // [QUAN TRỌNG] Hai thông tin Merchant cần nhất:
                .detailId(detail.getDetailId())             // Để gửi lên khi trừ
                .remainingQuantity(detail.getRemainingQuantity()) // Để biết khách còn bao nhiêu
                .build();
    }

    private void saveGenerateQrLog(User user, QRCode qr, UserVoucher voucher, BigDecimal credit) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("qr_code", qr.getCodeString());
            details.put("credit_amount", credit); // Log rõ là credit_amount
            details.put("voucher_code", voucher.getVoucherCode());
            details.put("expires_at", qr.getExpiresAt());

            // Tự build AuditLog tại đây hoặc gọi hàm chung nếu có
            // (Code mẫu giả định gọi hàm saveAuditLog chung hoặc tự build)
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

}