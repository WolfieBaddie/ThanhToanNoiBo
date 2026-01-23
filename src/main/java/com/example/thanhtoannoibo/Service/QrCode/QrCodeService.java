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
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Repository.Wallet.PaymentDetailRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
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

        // 1. Validate Merchant & Quầy (Giữ nguyên)
        Counter merchantCounter = counterRepository.findByManagedBy_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        // 2. Validate QR (Giữ nguyên)
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

        // 3. KIỂM TRA & CẬP NHẬT QR (Giữ nguyên)
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
        // 4. XỬ LÝ NGHIỆP VỤ (CẬP NHẬT LOGIC PACKAGE)
        // =========================================================================
        UserVoucher voucher = targetQr.getPayerVoucher();
        AppService targetService = null;
        AppPackage targetPackage = null;
        String transactionDesc = req.getDescription();

        // [MỚI] 4.1. Lấy thông tin Package nếu Voucher thuộc gói
        if (voucher.getPackageId() != null) {
            targetPackage = appPackageRepository.findById(voucher.getPackageId())
                    .orElse(null); // Có thể log warning nếu không tìm thấy, nhưng không nên chặn giao dịch
        }

        // [CŨ] 4.2. Logic xác định Service (Món hàng cụ thể)
        // Ưu tiên 1: Lấy từ request (Merchant chọn món khi khách dùng Voucher Package)
        if (req.getServiceId() != null) {
            targetService = appServiceRepository.findById(req.getServiceId()) // req.getServiceId() là UUID
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        }
        // Ưu tiên 2: Lấy từ voucher (Voucher món lẻ đã định danh sẵn)
        else if (voucher.getServiceId() != null) {
            targetService = appServiceRepository.findById(voucher.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        }

        // Tối ưu Description
        if (transactionDesc == null || transactionDesc.isEmpty()) {
            if (targetService != null) {
                transactionDesc = String.format("Đổi %d %s", qtyToProcess, targetService.getServiceName());
            } else if (targetPackage != null) {
                transactionDesc = String.format("Sử dụng gói %s", targetPackage.getPackageName());
            } else {
                transactionDesc = "Sử dụng tại " + merchantCounter.getCounterName();
            }
        }

        // 5. Trừ kho Voucher (Giữ nguyên)
        if (voucher.getQuantity() < qtyToProcess) {
            throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
        }
        voucher.setQuantity(voucher.getQuantity() - qtyToProcess);
        if (voucher.getQuantity() == 0) {
            voucher.setStatus(UserVoucherStatus.EXPIRED);
            voucher.setUsedAt(LocalDateTime.now());
        }
        userVoucherRepository.save(voucher);

        // 6. Cộng tiền Merchant (Giữ nguyên)
        BigDecimal transactionValue = voucher.getPriceAtPurchase().multiply(BigDecimal.valueOf(qtyToProcess));
        UserCredit merchantCredit = userCreditRepository.findWithLockByUser_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.CREDIT_NOT_FOUND));
        merchantCredit.setBalance(merchantCredit.getBalance().add(transactionValue));
        userCreditRepository.save(merchantCredit);

        // 7. Tạo Order (CẬP NHẬT: Lưu targetPackage)
        Order order = Order.builder()
                .user(voucher.getOwner())
                .serviceEntity(targetService)
                .packageEntity(targetPackage) // [QUAN TRỌNG] Lưu Package vào Order
                .orderRef("ORD-QR-" + System.currentTimeMillis())
                .amountPaid(transactionValue)
                .paymentMethod(OrderMethod.QR_VOUCHER)
                .paymentStatus(PaymentStatus.PAID)
                .completedAt(LocalDateTime.now())
                .build();
        orderRepository.save(order);

        // 8. Tạo Transaction (Giữ nguyên)
        Transaction mainTxn = Transaction.builder()
                .transactionRef("TXN-" + order.getOrderRef())
                .qrCode(targetQr)
                .transactionType(TransactionType.REDEMPTION)
                .payee(merchant)
                .credit(merchantCredit)
                .amount(transactionValue)
                .balanceAfter(merchantCredit.getBalance())
                .status(TransactionStatus.COMPLETED)
                .description(transactionDesc)
                .createdAt(LocalDateTime.now())
                .build();

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("counter_name", merchantCounter.getCounterName());
        metadata.put("merchant_id", merchant.getUserId().toString());
        metadata.put("type", "VOUCHER_REDEMPTION");
        metadata.put("quantity_deducted", qtyToProcess);
        // Lưu thêm tên gói vào metadata để dễ trace
        if (targetPackage != null) {
            metadata.put("package_name", targetPackage.getPackageName());
        }
        mainTxn.setMetadata(metadata);
        transactionRepository.save(mainTxn);

        // 9. Payment Detail (CẬP NHẬT: Lưu packageRef)
        PaymentDetail detail = PaymentDetail.builder()
                .transaction(mainTxn)
                .quantity(BigDecimal.valueOf(qtyToProcess))
                .amount(transactionValue)
                .service(targetService)
                .packageRef(targetPackage) // [QUAN TRỌNG] Lưu Package vào PaymentDetail
                .createdAt(LocalDateTime.now())
                .build();
        paymentDetailRepository.save(detail);

        // Log logs...
        saveAuditLogForTransaction(merchant, mainTxn, voucher, BigDecimal.ZERO, merchantCounter);
        saveQrScanLog(targetQr, merchant, "SUCCESS", transactionDesc, req.getImageUrl());

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
        String voucherCode = (qr.getPayerVoucher() != null) ? qr.getPayerVoucher().getVoucherCode() : null;
        UUID voucherId = (qr.getPayerVoucher() != null) ? qr.getPayerVoucher().getVoucherId() : null;
        User owner = qr.getOwner();

        List<ServiceResponse> includedServices = new ArrayList<>();
        UserVoucher voucher = qr.getPayerVoucher();

        if (voucher != null) {
            // Case 1: Voucher là Package
            if (voucher.getPackageId() != null) {
                appPackageRepository.findByIdWithServices(voucher.getPackageId())
                        .ifPresent(pkg -> {
                            pkg.getServices().forEach(s -> includedServices.add(mapServiceToResponse(s)));
                        });
            }
            // Case 2: [MỚI] Voucher là Service đơn lẻ (Cần hiển thị để Merchant biết)
            else if (voucher.getServiceId() != null) {
                appServiceRepository.findById(voucher.getServiceId())
                        .ifPresent(service -> {
                            includedServices.add(mapServiceToResponse(service));
                        });
            }
        }

        // Backend nên trả về cả usageLimit để Frontend biết
        // Ở đây giả sử DTO QrResponse có trường usageLimit (như file qr.type.ts bên frontend)
        // Nếu DTO chưa có, hãy thêm field: private Integer usageLimit; vào QrResponse.java

        return QrResponse.builder()
                .qrId(qr.getQrId())
                .codeString(qr.getCodeString())
                .type(qr.getType().name())
                .status(qr.getStatus().name())
                .creditAmount(qr.getAmount())
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
                .includedServices(includedServices)
                .usageLimit(qr.getUsageLimit())
                .build();
    }

    private ServiceResponse mapServiceToResponse(AppService s) {
        return ServiceResponse.builder()
                .serviceId(s.getServiceId())
                .serviceName(s.getServiceName())
                .imageUrl(s.getImageUrl())
                .unitPrice(s.getUnitPrice())
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

    public QRCode getQRCode(String qrCodeValue) {
        return qrCodeRepository.findByCodeString(qrCodeValue).orElse(null);
    }
}