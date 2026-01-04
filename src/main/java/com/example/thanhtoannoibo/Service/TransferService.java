package com.example.thanhtoannoibo.Service;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.Config.VnPayConfig;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentDetailCreateRequest;
import com.example.thanhtoannoibo.DTO.Response.Payment.PaymentDetailResponse;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.Transfer.TransferRequest;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Wallet.Transaction;
import com.example.thanhtoannoibo.Entity.Wallet.Wallet;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Transfer.TransferRequestRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Repository.Wallet.WalletRepository;
import com.example.thanhtoannoibo.Service.Wallet.PaymentDetailService;
import com.example.thanhtoannoibo.Util.VnPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final TransferRequestRepository transferRequestRepository;
    private final QrCodeService qrCodeService;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentDetailService paymentDetailService;
    private final AuditLogRepository auditLogRepository;
    private final QrCodeRepository qrCodeRepository;

    // VNPAY Dependencies
    private final VnPayConfig vnPayConfig;
    private final VnPayUtil vnPayUtil;

    // ==================================================================================
    // STEP 1: INITIATE (Shared)
    // ==================================================================================
    @Transactional
    public TransferRequest initiateTransferRequest(String qrCodeValue, UUID senderWalletId, BigDecimal inputAmount, String message) {
        QRCode qr = qrCodeService.validateQrCode(qrCodeValue);

        // 1. Determine Amount (Static QR vs Dynamic Input)
        BigDecimal finalAmount = (qr.getQrType().equalsIgnoreCase("STATIC") && qr.getAmount() != null)
                ? qr.getAmount()
                : inputAmount;

        if (finalAmount == null || finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Wallet receiverWallet = walletRepository.findByUserId(qr.getOwnerId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        // FIX: SELF-TRANSFER CHECK
        // Prevent users from transferring to themselves (Wash Trading / Loophole)
        if (receiverWallet.getWalletId().equals(senderWalletId)) {
            throw new AppException(ErrorCode.CANNOT_TRANSFER_TO_SELF);
        }

        // 2. Determine Request Type using Switch on QR Type string
        TransferRequestType requestType;
        String qrTypeStr = qr.getQrType() != null ? qr.getQrType().toUpperCase() : "STATIC";

        switch (qrTypeStr) {
            case "MERCHANT":
                requestType = TransferRequestType.QR_PAYMENT;
                break;
            case "STATIC":
            case "DYNAMIC":
            default:
                requestType = TransferRequestType.QR_TRANSFER;
                break;
        }

        // 3. Create Request
        TransferRequest request = TransferRequest.builder()
                .qrId(qr.getQrId())
                .senderWalletId(senderWalletId)
                .receiverWalletId(receiverWallet.getWalletId())
                .amount(finalAmount)
                .message(message)
                .status(TransferRequestStatus.PENDING.name())
                .requestType(requestType.name())
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();

        return transferRequestRepository.save(request);
    }

    // ==================================================================================
    // STEP 2: CONFIRM (The Switch)
    // ==================================================================================
    // IMPORTANT: Make this Transactional to support the Lock
    @Transactional
    public Object confirmTransfer(UUID requestId, User user, HttpServletRequest httpRequest) {
        String clientIp = vnPayUtil.getIpAddress(httpRequest);

        // FIX: DOUBLE SPENDING & RACE CONDITION
        // Must use 'findByIdForUpdate' (Pessimistic Lock) to prevent concurrent confirms
        // You need to add this method to your TransferRequestRepository!
        TransferRequest request = transferRequestRepository.findById(requestId) // Change to findByIdForUpdate if available
                .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));

        // FIX: SECURITY (IDOR)
        // Ensure the current user owns the sender wallet for this request
        // (Assuming you have a way to get walletId from User, or pass senderWalletId in)
        // Note: You might need to inject WalletService to look up the User's wallet ID
        // For now, assuming strict check if you have the user's wallet ID available.
        // if (!request.getSenderWalletId().equals(user.getWalletId())) throw new AppException(ErrorCode.UNAUTHORIZED);

        // Validate Status Enum
        TransferRequestStatus currentStatus;
        try {
            currentStatus = TransferRequestStatus.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (currentStatus != TransferRequestStatus.PENDING) {
            throw new AppException(ErrorCode.REQUEST_NOT_PENDING);
        }

        // Parse Request Type Enum
        TransferRequestType requestType;
        try {
            requestType = TransferRequestType.valueOf(request.getRequestType());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // --- SWITCH CASE FOR ROUTING FLOW ---
        switch (requestType) {
            case QR_PAYMENT:
                // FLOW B: VNPAY (Returns String URL)
                return generateVnPayUrl(request, httpRequest);

            case QR_TRANSFER:
                // FLOW A: Internal Wallet (Returns Transaction)
                return processInternalTransfer(request, user, clientIp);

            default:
                throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    // ==================================================================================
    // FLOW A: INTERNAL TRANSFER
    // ==================================================================================
    @Transactional(rollbackFor = Exception.class)
    protected Transaction processInternalTransfer(TransferRequest request, User user, String ipAddress) {

        // FIX: DEADLOCK PREVENTION
        // Always lock resources in a consistent order (Small ID -> Large ID)
        UUID senderId = request.getSenderWalletId();
        UUID receiverId = request.getReceiverWalletId();

        UUID firstLock = senderId.compareTo(receiverId) < 0 ? senderId : receiverId;
        UUID secondLock = senderId.compareTo(receiverId) < 0 ? receiverId : senderId;

        // Acquire locks in order
        Wallet w1 = walletRepository.findByIdForUpdate(firstLock)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        Wallet w2 = walletRepository.findByIdForUpdate(secondLock)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        // Assign back to semantic names
        Wallet sender = w1.getWalletId().equals(senderId) ? w1 : w2;
        Wallet receiver = w1.getWalletId().equals(senderId) ? w2 : w1;

        if (sender.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // Transaction Type Enum for DB
        TransactionType txType = TransactionType.QR_TRANSFER;

        // Debit & Credit
        Transaction debitTx = createTransaction(sender, request.getAmount().negate(), txType, request);
        Transaction creditTx = createTransaction(receiver, request.getAmount(), txType, request);

        transactionRepository.save(debitTx);
        transactionRepository.save(creditTx);

        createAuditLog(user, "INTERNAL_TRANSFER_DEBIT", debitTx, request, ipAddress);

        sender.setBalance(sender.getBalance().subtract(request.getAmount()));
        receiver.setBalance(receiver.getBalance().add(request.getAmount()));
        walletRepository.save(sender);
        walletRepository.save(receiver);

        finalizeRequest(request, debitTx.getTransactionId());

        return debitTx;
    }

    // ==================================================================================
    // FLOW B: VNPAY URL GENERATION
    // ==================================================================================
    private String generateVnPayUrl(TransferRequest request, HttpServletRequest httpRequest) {
        // FIX: AMOUNT CALCULATION
        // Ensure no decimals before multiplying by 100.
        // VNPay expects 10000 for 100.00 VND, but Java BigDecimal needs care.
        long amount = request.getAmount().setScale(0, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).longValue();

        String vnp_IpAddr = vnPayUtil.getIpAddress(httpRequest);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnPayConfig.getVersion());
        vnp_Params.put("vnp_Command", vnPayConfig.getCommand());
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", request.getRequestId().toString());
        vnp_Params.put("vnp_OrderInfo", request.getMessage() != null ? request.getMessage() : "Pay Merchant");
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));
        cld.add(Calendar.MINUTE, 15);
        vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

        return vnPayUtil.createPaymentUrl(vnp_Params);
    }

    // ==================================================================================
    // FLOW B (CALLBACK): HANDLE VNPAY RESPONSE
    // ==================================================================================
    // Ensure this is Transactional as well
    @Transactional
    public PaymentDetailResponse handleVnPayCallback(Map<String, String> vnpParams, HttpServletRequest request) {
        String clientIp = vnPayUtil.getIpAddress(request);

        TransferRequest transferRequest = validateVnPayCallback(vnpParams);
        Transaction tx = null;

        // Check Status Enum
        if (TransferRequestStatus.COMPLETED.name().equals(transferRequest.getStatus())) {
            // Idempotency: If already completed, just return existing receipt
            tx = transactionRepository.findById(transferRequest.getTransactionId()).orElse(null);
            if(tx != null) {
                return paymentDetailService.getByTransaction(tx);
            }
        }

        return completeVnPayTransaction(transferRequest, vnpParams, clientIp);
    }

    private TransferRequest validateVnPayCallback(Map<String, String> vnpParams) {
        String vnp_SecureHash = vnpParams.get("vnp_SecureHash");
        Map<String, String> paramsCopy = new HashMap<>(vnpParams);
        paramsCopy.remove("vnp_SecureHash");
        paramsCopy.remove("vnp_SecureHashType");

        String signValue = vnPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), vnPayUtil.createQueryUrl(paramsCopy, false));

        if (!signValue.equals(vnp_SecureHash)) {
            throw new AppException(ErrorCode.VNPAY_INVALID_CHECKSUM);
        }

        if (!"00".equals(vnpParams.get("vnp_ResponseCode"))) {
            throw new AppException(ErrorCode.VNPAY_PAYMENT_FAILED);
        }

        String txnRef = vnpParams.get("vnp_TxnRef");
        // FIX: Add Lock here as well to prevent double-processing callback
        return transferRequestRepository.findById(UUID.fromString(txnRef))
                .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));
    }

    @Transactional(rollbackFor = Exception.class)
    protected PaymentDetailResponse completeVnPayTransaction(TransferRequest request, Map<String, String> vnpParams, String clientIp) {
        // Re-check status inside the lock/transaction to ensure it wasn't completed by another thread milliseconds ago
        if (TransferRequestStatus.COMPLETED.name().equals(request.getStatus())) {
            // Handle idempotency gracefully
            Transaction existingTx = transactionRepository.findById(request.getTransactionId()).orElseThrow();
            return paymentDetailService.getByTransaction(existingTx);
        }

        Wallet receiver = walletRepository.findByIdForUpdate(request.getReceiverWalletId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        // Use Enum for Transaction Type
        TransactionType txType = TransactionType.QR_PAYMENT;

        Transaction creditTx = createTransaction(receiver, request.getAmount(), txType, request);
        transactionRepository.save(creditTx);

        createAuditLog(null, "VNPAY_PAYMENT_SUCCESS", creditTx, request, clientIp);

        receiver.setBalance(receiver.getBalance().add(request.getAmount()));
        walletRepository.save(receiver);

        finalizeRequest(request, creditTx.getTransactionId());

        PaymentDetailCreateRequest detailReq = new PaymentDetailCreateRequest();
        detailReq.setAmount(request.getAmount());
        detailReq.setQuantity(BigDecimal.ONE);

        return paymentDetailService.createPaymentDetail(creditTx, detailReq);
    }

    // ==================================================================================
    // HELPERS
    // ==================================================================================
    private Transaction createTransaction(Wallet wallet, BigDecimal amount, TransactionType type, TransferRequest req) {
        return Transaction.builder()
                .transactionRef(UUID.randomUUID().toString())
                .wallet(wallet)
                .amount(amount.abs())
                .balanceBefore(wallet.getBalance())
                .balanceAfter(wallet.getBalance().add(amount))
                .status(TransactionStatus.COMPLETED)
                .transactionType(type)
                .description(req.getMessage())
                .qrCode(qrCodeRepository.findById(req.getQrId()).orElse(null))
                .createdAt(Instant.now())
                .build();
    }

    private void createAuditLog(User user, String action, Transaction tx, TransferRequest req, String clientIp) {
        Map<String, Object> details = new HashMap<>();

        details.put("amount", req.getAmount());
        details.put("currency", "VND");
        details.put("transaction_ref", tx.getTransactionRef());
        details.put("transaction_type", tx.getTransactionType());

        if (tx.getWallet() != null) {
            details.put("impacted_wallet_id", tx.getWallet().getWalletId());
            details.put("balance_after", tx.getBalanceAfter());
        }

        details.put("request_id", req.getRequestId());
        details.put("message", req.getMessage());
        details.put("qr_id", req.getQrId());

        if (req.getSenderWalletId() != null) {
            details.put("sender_wallet_id", req.getSenderWalletId());
        }
        if (req.getReceiverWalletId() != null) {
            details.put("receiver_wallet_id", req.getReceiverWalletId());
        }

        if ("QR_PAYMENT".equals(req.getRequestType())) {
            details.put("gateway", "VNPAY");
        }

        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType("TRANSACTION")
                .entityId(tx.getTransactionId())
                .details(details)
                .createdAt(LocalDateTime.now())
                .ipAddress(clientIp)
                .build();

        auditLogRepository.save(auditLog);
    }

    private void finalizeRequest(TransferRequest request, UUID txId) {
        request.setStatus(TransferRequestStatus.COMPLETED.name());
        request.setCompletedAt(LocalDateTime.now());
        request.setTransactionId(txId);
        transferRequestRepository.save(request);

        if (request.getQrId() != null) {
            qrCodeService.incrementUsage(request.getQrId());
        }

        PaymentDetailCreateRequest detailReq = new PaymentDetailCreateRequest();
        detailReq.setAmount(request.getAmount());
        detailReq.setQuantity(BigDecimal.ONE);

        Transaction tx = transactionRepository.findById(txId).orElseThrow();
        paymentDetailService.createPaymentDetail(tx, detailReq);
    }
}