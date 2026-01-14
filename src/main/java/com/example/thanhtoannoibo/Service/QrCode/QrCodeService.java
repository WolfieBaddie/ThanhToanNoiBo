package com.example.thanhtoannoibo.Service.QrCode;

import com.example.thanhtoannoibo.Common.QrCodeStatus;
import com.example.thanhtoannoibo.Common.QrCodeType;
import com.example.thanhtoannoibo.Common.TransactionStatus;
import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.Common.UserVoucherStatus; // Import Enum Status
import com.example.thanhtoannoibo.Entity.Credit.UserCredit; // Import UserCredit
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.QrCode.QrScanLog;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository; // Import Repo
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrScanLogRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final UserCreditRepository userCreditRepository; // NEW: Repo quản lý Xu
    private final UserRepository userRepository;
    private final AuthService authService;
    private final HttpServletRequest request;
    private final AuditLogRepository auditLogRepository;
    private final QrScanLogRepository qrScanLogRepository;

    @Transactional
    public QRCode generateQRCode(UUID ownerId, QrCodeType qrType, BigDecimal amount,
                                 Integer expiresInMinutes, Integer usageLimit, UUID voucherId) {
        // Logic generate giữ nguyên, chỉ lưu ý voucherId ở đây là item được link vào QR
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
                .payerVoucher(linkedVoucher) // Voucher này đóng vai trò là Item được bán/mua
                .ownerType("USER")
                .amount(amount)
                .expiresAt(expiresAt)
                .usageLimit(usageLimit != null ? usageLimit : 0)
                .usageCount(0)
                .status(QrCodeStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        QRCode savedQr = qrCodeRepository.save(qrCode);

        // Log audit...
        return savedQr;
    }

    /**
     * Xử lý giao dịch khi quét QR
     * Logic mới:
     * 1. Xác định người quét (Payer).
     * 2. Trừ Xu trong UserCredits của người quét.
     * 3. Cập nhật trạng thái UserVoucher (Item) thành ACTIVE/USED.
     */
    @Transactional
    public Transaction processTransaction(String qrCodeValue, UUID voucherId,
                                          BigDecimal amount, String description) {

        User scannerUser = null;
        QRCode targetQr = null;

        try {
            // 1. Xác thực người dùng
            try {
                scannerUser = authService.getCurrentUser(request);
            } catch (Exception e) {
                throw new RuntimeException("Authentication required to pay");
            }
            UUID payerUserId = scannerUser.getUserId();

            // 2. Tìm QR Code và Lock
            targetQr = qrCodeRepository.findActiveQRCodeForUpdate(qrCodeValue)
                    .orElseThrow(() -> new RuntimeException("QR Code invalid or expired"));

            // Xác định số tiền
            BigDecimal finalAmount = amount;
            if (targetQr.getAmount() != null && targetQr.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                finalAmount = targetQr.getAmount();
            }
            if (finalAmount == null || finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Invalid transaction amount");
            }

            // 3. Trừ Xu (UserCredit)
            UserCredit payerCredit = userCreditRepository.findWithLockByUser_UserId(payerUserId)
                    .orElseThrow(() -> new RuntimeException("User Credit wallet not found"));

            payerCredit.deductBalance(finalAmount);
            userCreditRepository.save(payerCredit);

            // 4. Kích hoạt Voucher (Nếu có)
            if (voucherId != null) {
                UserVoucher targetVoucher = userVoucherRepository.findById(voucherId)
                        .orElseThrow(() -> new RuntimeException("Target Voucher not found"));
                targetVoucher.setStatus(UserVoucherStatus.ACTIVE);
                targetVoucher.setPriceAtPurchase(finalAmount);
                userVoucherRepository.save(targetVoucher);
            }

            // 5. Build Transaction (CHỈNH SỬA PHẦN NÀY)
            Transaction transaction = Transaction.builder()
                    .transactionRef("TXN" + System.currentTimeMillis())
                    .transactionType(TransactionType.PAYMENT)

                    // --- THAY ĐỔI Ở ĐÂY ---
                    // Thay vì .creditId(...), ta dùng .credit(...) để truyền Entity
                    .credit(payerCredit)
                    // -----------------------

                    .payee(targetQr.getOwner())
                    .qrCode(targetQr)
                    .amount(finalAmount)
                    .balanceAfter(payerCredit.getBalance()) // Số dư sau khi trừ
                    .status(TransactionStatus.COMPLETED)
                    .description(description)
                    .createdAt(LocalDateTime.now())
                    .build();

            Transaction savedTransaction = transactionRepository.save(transaction);

            // Cập nhật QR usage
            incrementUsage(targetQr);

            // 6. Audit & Log
            saveQrScanLog(targetQr, scannerUser, "SUCCESS", null);

            Map<String, Object> details = new HashMap<>();
            details.put("amount", finalAmount);
            details.put("creditId", payerCredit.getCreditId());
            saveAuditLog(scannerUser, "QR_PAYMENT_CREDIT", "TRANSACTION", savedTransaction.getTransactionId(), details);

            return savedTransaction;

        } catch (Exception e) {
            log.error("QR Transaction Failed: {}", e.getMessage());
            if (targetQr != null || scannerUser != null) {
                saveQrScanLog(targetQr, scannerUser, "FAILED", e.getMessage());
            }
            throw e;
        }
    }
    // Các hàm helper incrementUsage, saveQrScanLog, saveAuditLog, getQRCode giữ nguyên...
    private void incrementUsage(QRCode qrCode) {
        qrCode.setUsageCount(qrCode.getUsageCount() + 1);
        qrCode.setLastUsedAt(LocalDateTime.now());
        if (qrCode.getUsageLimit() > 0 && qrCode.getUsageCount() >= qrCode.getUsageLimit()) {
            qrCode.setStatus(QrCodeStatus.EXHAUSTED);
        }
        qrCodeRepository.save(qrCode);
    }

    private void saveQrScanLog(QRCode qr, User scannedBy, String result, String reason) {
        // ... (Giữ nguyên như cũ)
        try {
            QrScanLog scanLog = QrScanLog.builder()
                    .qrCode(qr)
                    .scannedBy(scannedBy)
                    .scanResult(result)
                    .failureReason(reason)
                    .createdAt(LocalDateTime.now())
                    .ipAddress(request.getRemoteAddr())
                    .build();
            qrScanLogRepository.save(scanLog);
        } catch (Exception e) {
            log.error("Could not save QR Scan Log", e);
        }
    }

    private void saveAuditLog(User actor, String action, String entityType, UUID entityId, Map<String, Object> details) {
        // ... (Giữ nguyên như cũ)
        try {
            AuditLog auditLog = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .createdAt(LocalDateTime.now())
                    .ipAddress(request.getRemoteAddr())
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