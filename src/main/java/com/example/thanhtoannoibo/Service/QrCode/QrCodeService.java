package com.example.thanhtoannoibo.Service.QrCode;

import com.example.thanhtoannoibo.Common.QrCodeStatus;
import com.example.thanhtoannoibo.Common.QrCodeType;
import com.example.thanhtoannoibo.Common.TransactionStatus;
import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.QrCode.QrScanLog;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrScanLogRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest; // Import thêm Request
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QrCodeService {

    private final QrCodeRepository qrCodeRepository;
    private final TransactionRepository transactionRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    // --- CHANGE: Inject HttpServletRequest để lấy Token/User từ Context ---
    private final HttpServletRequest request;

    private final AuditLogRepository auditLogRepository;
    private final QrScanLogRepository qrScanLogRepository;

    @Transactional
    public QRCode generateQRCode(UUID ownerId, QrCodeType qrType, BigDecimal amount,
                                 Integer expiresInMinutes, Integer usageLimit, UUID voucherId) {

        User owner = userRepository.findByUserId(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner User not found"));

        UserVoucher linkedVoucher = null;
        if (voucherId != null) {
            linkedVoucher = userVoucherRepository.findById(voucherId)
                    .orElseThrow(() -> new RuntimeException("Linked Voucher not found"));
        }

        String codeString = "QR" + System.currentTimeMillis() +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        LocalDateTime expiresAt = null;
        if (expiresInMinutes != null && expiresInMinutes > 0) {
            expiresAt = LocalDateTime.now().plusMinutes(expiresInMinutes);
        }

        QRCode qrCode = QRCode.builder()
                .codeString(codeString)
                .type(qrType)
                .owner(owner)
                .payerVoucher(linkedVoucher)
                .ownerType("USER")
                .amount(amount)
                .expiresAt(expiresAt)
                .usageLimit(usageLimit != null ? usageLimit : 0)
                .usageCount(0)
                .status(QrCodeStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        QRCode savedQr = qrCodeRepository.save(qrCode);

        // Ghi Audit Log
        saveAuditLog(owner, "GENERATE_QR", "QR_CODE", savedQr.getQrId(),
                Map.of("codeString", codeString, "type", qrType));

        return savedQr;
    }

    @Transactional
    public Transaction processTransaction(String qrCodeValue, UUID payerVoucherId,
                                          BigDecimal amount, String description) {

        User scannerUser = null;
        QRCode targetQr = null;

        try {
            // --- CHANGE: Sử dụng AuthService.getCurrentUser(request) ---
            // Hàm này đã thực hiện logic lấy Token -> Lấy ID -> Query DB lấy User
            try {
                scannerUser = authService.getCurrentUser(request);
            } catch (Exception e) {
                log.warn("Could not identify scanner user via token: {}", e.getMessage());
                // Có thể chấp nhận null nếu logic cho phép (VD: Guest scan),
                // hoặc ném lỗi nếu bắt buộc phải login
            }

            // 1. Lấy thông tin người thanh toán (Payer Voucher)
            UserVoucher payerVoucher = userVoucherRepository.findById(payerVoucherId)
                    .orElseThrow(() -> new RuntimeException("Payer voucher not found"));

            // 2. Tìm QR Code và Lock row
            targetQr = qrCodeRepository.findActiveQRCodeForUpdate(qrCodeValue)
                    .orElseThrow(() -> new RuntimeException("QR Code invalid, expired, or limit reached"));

            BigDecimal finalAmount = amount;
            if (targetQr.getAmount() != null && targetQr.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                finalAmount = targetQr.getAmount();
            }
            if (finalAmount == null || finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Invalid transaction amount");
            }

            if (!"ACTIVE".equals(String.valueOf(payerVoucher.getStatus()))) {
                throw new RuntimeException("Voucher is not active");
            }
            if (payerVoucher.getBalance().compareTo(finalAmount) < 0) {
                throw new RuntimeException("Insufficient balance");
            }

            // 3. Thực hiện trừ tiền
            BigDecimal newBalance = payerVoucher.getBalance().subtract(finalAmount);
            payerVoucher.setBalance(newBalance);
            userVoucherRepository.save(payerVoucher);

            // 4. Lưu Transaction
            Transaction transaction = Transaction.builder()
                    .transactionRef("TXN" + System.currentTimeMillis())
                    .transactionType(TransactionType.PAYMENT) // Đảm bảo khớp Enum với Transaction.java
                    .payerVoucher(payerVoucher)
                    .payee(targetQr.getOwner())
                    .qrCode(targetQr)
                    .amount(finalAmount)
                    .balanceAfter(newBalance)
                    .status(TransactionStatus.COMPLETED)
                    .description(description)
                    .createdAt(LocalDateTime.now())
                    .build();

            Transaction savedTransaction = transactionRepository.save(transaction);
            incrementUsage(targetQr);

            // 5. Ghi Log Thành Công
            saveQrScanLog(targetQr, scannerUser, "SUCCESS", null);

            Map<String, Object> details = new HashMap<>();
            details.put("amount", finalAmount);
            details.put("ref", savedTransaction.getTransactionRef());
            saveAuditLog(scannerUser, "QR_PAYMENT", "TRANSACTION", savedTransaction.getTransactionId(), details);

            return savedTransaction;

        } catch (Exception e) {
            // 6. Ghi Log Thất Bại
            log.error("QR Transaction Failed: {}", e.getMessage());

            if (targetQr != null || scannerUser != null) {
                saveQrScanLog(targetQr, scannerUser, "FAILED", e.getMessage());
            }
            throw e;
        }
    }

    private void incrementUsage(QRCode qrCode) {
        qrCode.setUsageCount(qrCode.getUsageCount() + 1);
        qrCode.setLastUsedAt(LocalDateTime.now());
        if (qrCode.getUsageLimit() > 0 && qrCode.getUsageCount() >= qrCode.getUsageLimit()) {
            qrCode.setStatus(QrCodeStatus.EXHAUSTED);
        }
        qrCodeRepository.save(qrCode);
    }

    private void saveQrScanLog(QRCode qr, User scannedBy, String result, String reason) {
        try {
            QrScanLog scanLog = QrScanLog.builder()
                    .qrCode(qr)
                    .scannedBy(scannedBy) // Có thể null nếu không lấy được user
                    .scanResult(result)
                    .failureReason(reason)
                    .createdAt(LocalDateTime.now())
                    .ipAddress(request.getRemoteAddr()) // Tiện thể lấy luôn IP từ request
                    .build();
            qrScanLogRepository.save(scanLog);
        } catch (Exception e) {
            log.error("Could not save QR Scan Log", e);
        }
    }

    private void saveAuditLog(User actor, String action, String entityType, UUID entityId, Map<String, Object> details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .createdAt(LocalDateTime.now())
                    .ipAddress(request.getRemoteAddr()) // Tiện thể lấy luôn IP từ request
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Could not save Audit Log", e);
        }
    }

    public QRCode getQRCode(String qrCodeValue) {
        return qrCodeRepository.findByCodeString(qrCodeValue).orElse(null);
    }
}