package com.example.thanhtoannoibo.Service;
import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentDetailCreateRequest;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.Transfer.TransferRequest;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Wallet.Transaction;
import com.example.thanhtoannoibo.Entity.Wallet.Wallet;
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Transfer.TransferRequestRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Repository.Wallet.WalletRepository;
import com.example.thanhtoannoibo.Service.Wallet.PaymentDetailService; // Your PaymentDetail logic
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransferService {
    private final TransferRequestRepository transferRequestRepository;
    private final QrCodeRepository qrCodeRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentDetailService paymentDetailService;
    private final AuditLogRepository auditLogRepository;
    private final QrCodeService qrCodeService;

    // ==================================================================================
    // STEP 1: QR Code -> TransferRequest (PENDING)
    // ==================================================================================
    @Transactional
    public TransferRequest initiateQrTransfer(String qrCodeValue, UUID senderWalletId, BigDecimal inputAmount, String message) {
        // 1. Validate QR Code
        QRCode qr = qrCodeRepository.findActiveQRCode(qrCodeValue)
                .orElseThrow(() -> new RuntimeException("QR Code invalid or expired"));

        // 2. Determine Amount (Static QR overrides input)
        BigDecimal finalAmount = (qr.getQrType().equals(QrCodeType.STATIC.toString()) && qr.getAmount() != null)
                ? qr.getAmount()
                : inputAmount;

        if (finalAmount == null || finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid transfer amount");
        }

        // 3. Resolve Receiver Wallet (From QR Owner)
        Wallet receiverWallet = walletRepository.findByUserId(qr.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Receiver wallet not found"));

        if (receiverWallet.getWalletId().equals(senderWalletId)) {
            throw new RuntimeException("Cannot transfer to yourself");
        }


        TransferRequestType requestType;
        switch(qr.getQrType().toUpperCase())
        {
            case "MERCHANT":
                requestType = TransferRequestType.QR_PAYMENT;
                break;
            case "STATIC":
            case "DYNAMIC":
            default:
                requestType = TransferRequestType.QR_TRANSFER;
                break;

        }

        // 4. Create TransferRequest (State: PENDING)
        TransferRequest request = TransferRequest.builder()
                .qrId(qr.getQrId())
                .senderWalletId(senderWalletId)
                .receiverWalletId(receiverWallet.getWalletId())
                .amount(finalAmount)
                .message(message)
                .status(TransferRequestStatus.PENDING.toString()) //
                .requestType(requestType.toString())
                .expiresAt(LocalDateTime.now().plusMinutes(15)) // 15 min to confirm
                .build();

        return transferRequestRepository.save(request);
    }

    // ==================================================================================
    // STEP 2: TransferRequest -> Transactions -> PaymentDetails (COMPLETED)
    // ==================================================================================
    @Transactional
    public Transaction completeTransfer(UUID requestId, User user) {
        // 1. Load Request
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Transfer Request not found"));

        validateRequestState(request);


        // 3. Lock & Update Wallets (The Money Move)
        Wallet sender = walletRepository.findByIdForUpdate(request.getSenderWalletId())
                .orElseThrow(() -> new RuntimeException("Sender wallet not found"));
        Wallet receiver = walletRepository.findByIdForUpdate(request.getReceiverWalletId())
                .orElseThrow(() -> new RuntimeException("Receiver wallet not found"));

        if (sender.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        BigDecimal senderNewBalance = sender.getBalance().subtract(request.getAmount());
        BigDecimal receiverNewBalance = receiver.getBalance().add(request.getAmount());

        TransactionType type = TransferRequestType.QR_PAYMENT.toString().equals(request.getRequestType())
                ? TransactionType.QR_PAYMENT
                : TransactionType.QR_TRANSFER;

        // 4. Create Ledger Transactions (Debit Sender, Credit Receiver)

        // Transaction A: Sender (DEBIT)
        Transaction debitTx = Transaction.builder()
                .transactionRef(UUID.randomUUID().toString())
                .wallet(sender) // Sender's wallet
                .amount(request.getAmount().negate()) // Negative for debit
                .balanceBefore(sender.getBalance())
                .balanceAfter(senderNewBalance)
                .status(TransactionStatus.COMPLETED) //
                .transactionType(type)
                .description(request.getMessage())
                .qrCode(qrCodeRepository.findById(request.getQrId()).orElse(null))
                .build();

        Transaction savedDebitTx = transactionRepository.save(debitTx);

        // Transaction B: Receiver (CREDIT)
        Transaction creditTx = Transaction.builder()
                .transactionRef(UUID.randomUUID().toString())
                .wallet(receiver)
                .amount(request.getAmount())
                .balanceBefore(receiver.getBalance())
                .balanceAfter(receiverNewBalance)
                .status(TransactionStatus.COMPLETED) //
                .transactionType(type)
                .description(request.getMessage())
                .qrCode(qrCodeRepository.findById(request.getQrId()).orElse(null))
                .build();

        transactionRepository.save(creditTx);

        //AuditLog
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action("TRANSFER_COMPLETED")
                .entityType("TRANSACTION")
                .entityId(savedDebitTx.getTransactionId())
                .details(Map.of( // Using Map for JSONB if supported, or convert to JSON string
                        "amount", request.getAmount(),
                        "sender_wallet", sender.getWalletId(),
                        "receiver_wallet", receiver.getWalletId(),
                        "message", request.getMessage()
                ))
                .createdAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);

        sender.setBalance(senderNewBalance);
        receiver.setBalance(receiverNewBalance);

        // 5. Update Request State -> COMPLETED
        request.setStatus(TransferRequestStatus.COMPLETED.toString()); //
        request.setCompletedAt(LocalDateTime.now());
        request.setTransactionId(savedDebitTx.getTransactionId()); // Link request to the main debit tx
        transferRequestRepository.save(request);

        // 6. Create Payment Details (The Receipt)
        // Only created for the Sender's transaction (the one paying)
        PaymentDetailCreateRequest detailReq = new PaymentDetailCreateRequest();
        detailReq.setAmount(request.getAmount());
        detailReq.setQuantity(BigDecimal.ONE);
        // If your QR code had metadata about a Service/Counter, you would map it here

        paymentDetailService.createPaymentDetail(savedDebitTx, detailReq);

        //7.Update the QR usage()
        if(request.getQrId() != null)
            qrCodeService.incrementUsage(request.getQrId());

        return savedDebitTx;
    }

    private void validateRequestState(TransferRequest request)
    {
        if(!request.getStatus().equals(TransferRequestStatus.PENDING.toString()))
            throw new RuntimeException("Request is not in PENDING state");

        if(!request.getExpiresAt().isBefore(LocalDateTime.now()))
        {
            request.setStatus(TransferRequestStatus.EXPIRED.toString());
            transferRequestRepository.save(request);
            throw new RuntimeException("Transfer Request has expired");
        }
    }
}
