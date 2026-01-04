package com.example.thanhtoannoibo.Service;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.Transfer.TransferRequest;
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.Transfer.TransferRequestRepository;
import com.example.thanhtoannoibo.Common.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QrCodeService {
    private final QrCodeRepository qrCodeRepository;
    private final TransferRequestRepository transferRequestRepository;
    private final WalletService walletService;

    @Transactional
    public QRCode generateQRCode(UUID ownerId, String qrType, BigDecimal amount,
                                 Integer expiresInMinutes, Integer usageLimit) {

        String qrCodeValue = "QR" + System.currentTimeMillis() +
                UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        LocalDateTime expiresAt = null;
        if (expiresInMinutes != null) {
            expiresAt = LocalDateTime.now().plusMinutes(expiresInMinutes);
        }

        QRCode qrCode = QRCode.builder()
                .qrCode(qrCodeValue)
                .qrType(qrType)
                .ownerId(ownerId)
                .ownerType("USER")
                .amount(amount)
                .expiresAt(expiresAt)
                .usageLimit(usageLimit)
                .usageCount(0)
                .status("ACTIVE")
                .build();

        return qrCodeRepository.save(qrCode);
    }

    @Transactional
    public TransferRequest processQRTransfer(String qrCodeValue, UUID senderWalletId,
                                             BigDecimal amount, String message, UUID currentUserId) { // Renamed userId to currentUserId for clarity

        // 1. Find active QR code
        QRCode qrCode = qrCodeRepository.findActiveQRCode(qrCodeValue)
                .orElseThrow(() -> new RuntimeException("Invalid or expired QR code"));

        // 2. FIX: Get receiver wallet from QR CODE OWNER, not the current user
        UUID receiverWalletId = walletService.getWalletIdByUserId(qrCode.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Receiver wallet (QR Owner) not found"));

        // 3. Prevent sending money to yourself (Optional safety check)
        if (receiverWalletId.equals(senderWalletId)) {
            throw new RuntimeException("Cannot transfer money to yourself via QR code");
        }

        // For static QR, use predefined amount
        if ("STATIC".equals(qrCode.getQrType()) && qrCode.getAmount() != null) {
            amount = qrCode.getAmount();
        }

        // Validate sender wallet balance
        walletService.validateWalletBalance(senderWalletId, amount);

        // Create transfer request
        TransferRequest transferRequest = TransferRequest.builder()
                .qrId(qrCode.getQrId())
                .senderWalletId(senderWalletId)
                .receiverWalletId(receiverWalletId) // Now correctly points to QR Owner
                .amount(amount)
                .requestType("QR_TRANSFER")
                .message(message)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .status("COMPLETED")
                .build();

        TransferRequest savedRequest = transferRequestRepository.save(transferRequest);

        // Update QR code usage
        qrCode.setUsageCount(qrCode.getUsageCount() + 1);
        qrCode.setLastUsedAt(LocalDateTime.now());

        if (qrCode.getUsageLimit() != null && qrCode.getUsageCount() >= qrCode.getUsageLimit()) {
            qrCode.setStatus("EXHAUSTED");
        }

        qrCodeRepository.save(qrCode);

        return savedRequest;
    }

    public QRCode validateQrCode(String qrCodeValue) {
        return qrCodeRepository.findActiveQRCode(qrCodeValue)
                .orElseThrow(() -> new RuntimeException("Invalid or expired QR code"));
    }

    @Transactional
    public void incrementUsage(UUID qrId)
    {
        QRCode qrCode = qrCodeRepository.findById(qrId).orElseThrow(() -> new RuntimeException("QR Code not found during update"));

        qrCode.setUsageCount(qrCode.getUsageCount() + 1);
        if(qrCode.getUsageLimit() != null && qrCode.getUsageCount() >= qrCode.getUsageLimit())
            qrCode.setStatus(QrCodeStatus.EXHAUSTED.toString());

        qrCodeRepository.save(qrCode);

    }

    public Optional<QRCode> getQRCode(String qrCode) {
        return qrCodeRepository.findByQrCode(qrCode);
    }
}
