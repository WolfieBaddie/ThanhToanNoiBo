package com.example.thanhtoannoibo.Service.QrCode;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.QrCode.GenerateQrRequest;
import com.example.thanhtoannoibo.DTO.Request.QrCode.ProcessQrRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.QrCode.ProcessQrResponse;
import com.example.thanhtoannoibo.DTO.Response.QrCode.QrResponse;
import com.example.thanhtoannoibo.DTO.Response.Transfer.QrCodeResponse;
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

        // 2. Validate Trạng thái
        if (linkedVoucher.getStatus() != UserVoucherStatus.ACTIVE) {
            throw new AppException(ErrorCode.VOUCHER_USED_OR_EXPIRED);
        }

        // Check hạn sử dụng gốc của Voucher (nếu voucher hết hạn thì không cho tạo QR)
        LocalDateTime now = LocalDateTime.now();
        if (linkedVoucher.getExpiresAt() != null && linkedVoucher.getExpiresAt().isBefore(now)) {
            throw new AppException(ErrorCode.VOUCHER_USED_OR_EXPIRED);
        }

        // 3. XỬ LÝ SỐ LƯỢNG (Hướng giải quyết 1)
        // Lấy số lượng user muốn dùng từ request, mặc định là 1
        int quantityToUse = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;

        // Kiểm tra số dư voucher thực tế
        // (Lưu ý: linkedVoucher.getQuantity() là tổng số vé user đang sở hữu)
        if (linkedVoucher.getQuantity() < quantityToUse) {
            throw new AppException(ErrorCode.INVALID_REQUEST); // Không đủ số lượng
        }

        // 4. Kiểm tra Spam QR (Tùy chọn: Nếu muốn cho phép tạo nhiều QR cùng lúc thì bỏ qua)
        // Ở đây ta có thể cho phép tạo đè, hoặc chặn.
        // Tốt nhất là hủy các QR cũ đang ACTIVE của voucher này đi để tránh double spending ở client
        // (Logic hủy QR cũ - Optional)

        // 5. TÍNH TOÁN GIÁ TRỊ & HẠN DÙNG


        BigDecimal totalQrValue = linkedVoucher.getPriceAtPurchase().multiply(BigDecimal.valueOf(quantityToUse));

        LocalDateTime proposedQrExpiry = now.plusDays(1);

        if (linkedVoucher.getExpiresAt() != null && proposedQrExpiry.isAfter(linkedVoucher.getExpiresAt())) {
            proposedQrExpiry = linkedVoucher.getExpiresAt(); // Nếu voucher sắp hết hạn thì QR cũng hết theo
        }

        // 6. SINH QR CODE
        String codeString = "QR-V-" + System.currentTimeMillis() + "-" + RandomStringUtils.randomAlphanumeric(8).toUpperCase();

        QRCode qrCode = QRCode.builder()
                .codeString(codeString)
                .type(QrCodeType.VOUCHER)
                .owner(currentUser)
                .payerVoucher(linkedVoucher)
                .ownerType("USER")

                .amount(totalQrValue) // Tổng giá trị tiền tệ của QR này
                .usageLimit(quantityToUse) // [QUAN TRỌNG]: QR này chỉ có giá trị cho N gói/món
                .usageCount(0)

                .status(QrCodeStatus.ACTIVE)
                .expiresAt(proposedQrExpiry) // Hạn 1 ngày
                .createdAt(now)
                .build();

        QRCode savedQr = qrCodeRepository.save(qrCode);

        // Log Audit
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
    @Transactional(rollbackFor = Exception.class)
    public ProcessQrResponse processTransaction(ProcessQrRequest req, HttpServletRequest httpRequest) {
        User merchant = authService.getCurrentUser(httpRequest);

        // 1. Validate Merchant & Quầy
        Counter merchantCounter = counterRepository.findByManagedBy_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        // 2. Tìm & Lock QR Code
        QRCode targetQr = qrCodeRepository.findActiveQRCodeForUpdate(req.getQrCode())
                .orElseThrow(() -> new AppException(ErrorCode.QR_CODE_NOT_FOUND));

        if (targetQr.getStatus() != QrCodeStatus.ACTIVE) {
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }

        // Validate hạn sử dụng QR
        if (targetQr.getExpiresAt() != null && targetQr.getExpiresAt().isBefore(LocalDateTime.now())) {
            targetQr.setStatus(QrCodeStatus.EXPIRED); // Update luôn nếu đã hết hạn
            qrCodeRepository.save(targetQr);
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }

        UserVoucher voucher = targetQr.getPayerVoucher();

        // 3. [LOGIC MỚI] XÁC ĐỊNH SỐ LƯỢNG THỰC TẾ (ACTUAL QUANTITY)
        int limitInQr = targetQr.getUsageLimit(); // Số lượng User cho phép (VD: 2)
        int actualQtyToProcess = limitInQr;       // Mặc định là trừ hết

        // Nếu Merchant có gửi số lượng thực tế lên
        if (req.getQuantity() != null) {
            if (req.getQuantity() > limitInQr) {
                // Merchant trừ nhiều hơn User cho phép -> Chặn ngay
                throw new AppException(ErrorCode.EXCEED_QR_LIMIT);
            }
            if (req.getQuantity() <= 0) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
            actualQtyToProcess = req.getQuantity(); // Dùng số thực tế (VD: 1)
        }

        // Các biến xử lý giao dịch
        AppService targetService = null;
        BigDecimal finalTransactionAmount;
        BigDecimal refundAmount = BigDecimal.ZERO;
        String description = req.getDescription();

        // =========================================================================
        // CASE 1: SPECIFIC/PACKAGE VOUCHER (Voucher món ăn/combo)
        // =========================================================================
        // Check logic: serviceId != null HOẶC packageId != null (tùy cấu trúc DB bạn chọn trước đó)
        // Ở đây ta check theo logic "Không phải Generic" (Generic thường serviceId null và priceAtPurchase là mệnh giá tiền)

        // Nếu là Voucher Món/Gói cụ thể (Có serviceId hoặc packageId)
        if (voucher.getServiceId() != null || voucher.getPackageId() != null) {

            // Logic Validate Service (Nếu là Voucher Món Lẻ)
            if (voucher.getServiceId() != null) {
                targetService = appServiceRepository.findById(voucher.getServiceId())
                        .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

                // Check Scope Quầy
                if (!targetService.getCounter().getCounterId().equals(merchantCounter.getCounterId())) {
                    throw new AppException(ErrorCode.INVALID_SCOPE);
                }
            }
            // Nếu là Voucher Combo (Package) -> Không cần check Service Scope chặt, hoặc check theo logic Package

            // TÍNH TIỀN: Giá gốc lúc mua * Số lượng thực tế dùng
            finalTransactionAmount = voucher.getPriceAtPurchase().multiply(BigDecimal.valueOf(actualQtyToProcess));

            if (description == null) {
                description = String.format("Thanh toán qua voucher %d %s", actualQtyToProcess, voucher.getServiceName());
            }
        }
        // =========================================================================
        // CASE 2: GENERIC VOUCHER (Voucher Xu/Tiền mặt linh hoạt)
        // =========================================================================
        else {
            // Logic Generic giữ nguyên (thường Generic QR chỉ dùng 1 lần cho 1 bill, quantity luôn là 1)
            // Nếu Merchant chọn món gán vào
            if (req.getServiceId() != null) {
                targetService = appServiceRepository.findById(req.getServiceId())
                        .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
                if (!targetService.getCounter().getCounterId().equals(merchantCounter.getCounterId())) {
                    throw new AppException(ErrorCode.INVALID_SCOPE);
                }
                if (description == null) description = "Mua " + targetService.getServiceName();
            } else {
                if (description == null) description = "Thanh toán Voucher Xu";
            }

            BigDecimal billAmount = req.getBillAmount();
            BigDecimal qrTotalValue = targetQr.getAmount(); // Tổng giá trị QR (đã nhân quantity lúc gen)

            if (qrTotalValue.compareTo(billAmount) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
            }

            finalTransactionAmount = billAmount;
            refundAmount = qrTotalValue.subtract(billAmount); // Tiền thừa
        }

        // =========================================================================
        // EXECUTE TRANSACTION
        // =========================================================================

        // 1. Kiểm tra kho vé của User lần cuối (Concurrency check)
        if (voucher.getQuantity() < actualQtyToProcess) {
            throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
        }

        // 2. Trừ kho vé User
        voucher.setQuantity(voucher.getQuantity() - actualQtyToProcess);
        if (voucher.getQuantity() == 0) {
            voucher.setStatus(UserVoucherStatus.EXHAUSTED); // Hoặc EXHAUSTED
            voucher.setUsedAt(LocalDateTime.now());
        }
        // Lưu ý: Nếu voucher.getQuantity() > 0, status vẫn là ACTIVE để dùng lần sau (với QR mới)
        userVoucherRepository.save(voucher);

        // 3. Tạo Order
        Order order = Order.builder()
                .user(voucher.getOwner())
                .serviceEntity(targetService)
                .orderRef("ORD-QR-" + System.currentTimeMillis())
                .amountPaid(finalTransactionAmount)
                .paymentMethod(OrderMethod.QR_VOUCHER)
                .paymentStatus(PaymentStatus.PAID)
                .completedAt(LocalDateTime.now())
                .build();
        orderRepository.save(order);

        // 4. Tạo Transaction
        Transaction mainTxn = Transaction.builder()
                .transactionRef("TXN-" + order.getOrderRef())
                .qrCode(targetQr)
                .transactionType(TransactionType.PAYMENT)
                .payee(merchant)
                .qrCode(targetQr)
                .amount(finalTransactionAmount)
                .status(TransactionStatus.COMPLETED)
                .description(description)
                .createdAt(LocalDateTime.now())
                .build();

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("orderId", order.getOrderId().toString());
        metadata.put("quantity_processed", actualQtyToProcess); // Lưu số lượng thực tế
        metadata.put("quantity_requested_in_qr", limitInQr);    // Lưu số lượng trong QR gốc
        if (targetService != null) {
            metadata.put("serviceName", targetService.getServiceName());
        }
        mainTxn.setMetadata(metadata);
        transactionRepository.save(mainTxn);

        // 5. Lưu Payment Detail
        PaymentDetail paymentDetail = PaymentDetail.builder()
                .transaction(mainTxn)
                .service(targetService)
                .quantity(BigDecimal.valueOf(actualQtyToProcess))
                .amount(finalTransactionAmount)
                .build();
        paymentDetailRepository.save(paymentDetail);

        // 6. Xử lý Hoàn tiền (Chỉ cho Generic)
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            processRefund(voucher.getOwner(), refundAmount, voucher.getVoucherCode());
        }

        // 7. [QUAN TRỌNG] Đóng QR Code
        // Dù User cho phép 2, Merchant chỉ dùng 1 -> QR này vẫn bị hủy để bảo mật.
        targetQr.setStatus(QrCodeStatus.EXHAUSTED);
        targetQr.setUsageCount(1);
        qrCodeRepository.save(targetQr);

        // 8. Log & Return
        saveQrScanLog(targetQr, merchant, "SUCCESS", "Giao dịch thành công. SL: " + actualQtyToProcess
                + "Giá trị: " + formatMoney(finalTransactionAmount)
                , req.getImageUrl());

        return ProcessQrResponse.builder()
                .transactionId(mainTxn.getTransactionId())
                .paidAmount(finalTransactionAmount)
                .refundedAmount(refundAmount)
                .status("SUCCESS")
                .message("Thanh toán thành công. Đã trừ " + actualQtyToProcess + " vé." + " Giá trị: " + formatMoney(finalTransactionAmount))
                .build();
    }

    private String formatMoney(BigDecimal amount) {
        return amount == null ? "0" : amount.toString();
    }

    // =================================================================================
    // HELPER METHODS (PRIVATE)
    // =================================================================================

    private Order createOrderLog(User customer, AppService service, BigDecimal amount, Counter counter) {
        String orderRef = "ORD-QR-" + System.currentTimeMillis() + "-" + RandomStringUtils.randomAlphanumeric(4).toUpperCase();
        Order order = Order.builder()
                .user(customer)
                .serviceEntity(service) // Null nếu là Generic Voucher
                .orderRef(orderRef)
                .amountPaid(amount)
                .paymentMethod(OrderMethod.QR_VOUCHER) // Enum mới
                .paymentStatus(PaymentStatus.PAID)
                .orderStatus(OrderStatus.COMPLETED)
                .createdAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .build();
        return orderRepository.save(order);
    }

    private Transaction createTransactionLog(Order order, QRCode qr, User payee, BigDecimal amount, String description) {
        Transaction txn = Transaction.builder()
                .transactionRef("TXN-" + order.getOrderRef()) // Link ref với Order
                .transactionType(TransactionType.PAYMENT)
                .payee(payee) // Merchant nhận tiền
                .qrCode(qr)
                .amount(amount)
                .balanceAfter(BigDecimal.ZERO) // Voucher payment không track balance user tại đây
                .status(TransactionStatus.COMPLETED)
                .description(description)
                .createdAt(LocalDateTime.now())
                .build();

        // Lưu Metadata liên kết Order ID
        Map<String, Object> meta = new HashMap<>();
        meta.put("order_id", order.getOrderId().toString());
        txn.setMetadata(meta);

        return transactionRepository.save(txn);
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

            AuditLog audit = AuditLog.builder()
                    .user(merchant)
                    .action("PROCESS_QR")
                    .entityType("TRANSACTION")
                    .entityId(txn.getTransactionId())
                    .details(details)
                    .ipAddress(request.getRemoteAddr())
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(audit);
        } catch (Exception e) {
            log.error("Audit Error", e);
        }
    }

    private QrResponse mapToQrResponse(QRCode qr) {
        // Lấy thông tin Voucher (nếu có)
        String voucherCode = (qr.getPayerVoucher() != null) ? qr.getPayerVoucher().getVoucherCode() : null;
        UUID voucherId = (qr.getPayerVoucher() != null) ? qr.getPayerVoucher().getVoucherId() : null;

        // [MỚI] Lấy thông tin Owner
        User owner = qr.getOwner();

        List<ServiceResponse> includedServices = new ArrayList<>();
        UserVoucher voucher = qr.getPayerVoucher();

        if (voucher != null && voucher.getPackageId() != null) {
            // Gọi repository để lấy services (Lưu ý: cần inject appPackageRepository)
            appPackageRepository.findByIdWithServices(voucher.getPackageId())
                    .ifPresent(pkg -> {
                        pkg.getServices().forEach(s -> includedServices.add(
                                ServiceResponse.builder()
                                        .serviceId(s.getServiceId())
                                        .serviceName(s.getServiceName())
                                        .imageUrl(s.getImageUrl())
                                        .unitPrice(s.getUnitPrice())
                                        .build()
                        ));
                    });
        }


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

                // [MỚI] Map thông tin User
                .userId(owner != null ? owner.getUserId() : null)
                .fullName(owner != null ? owner.getFullName() : "Khách vãng lai")
                .userType(owner != null ? owner.getUserType().name() : null)
                .email(owner != null ? owner.getEmail() : null)
                .phoneNumber(owner != null ? owner.getPhoneNumber() : "")
                .imageUrl(owner != null ? owner.getImageUrl() : null)
                .includedServices(includedServices)
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