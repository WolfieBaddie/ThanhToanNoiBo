package com.example.thanhtoannoibo.Controller;
import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.DTO.InternalTransactionResponse;
import com.example.thanhtoannoibo.DTO.Response.Payment.PaymentDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Transfer.TransferResponse;
import com.example.thanhtoannoibo.Entity.Transfer.TransferRequest;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Wallet.Transaction;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Service.TransferService;
import com.example.thanhtoannoibo.Service.Security.AuthService; // Assuming you have this
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {
    private final TransferService transferService;
    private final AuthService authService; // To get current user

    // ==================================================================================
    // STEP 1: INITIATE (Scans QR)
    // ==================================================================================
    @PostMapping("/initiate")
    public ResponseEntity<TransferRequest> initiateTransfer(
            @RequestParam String qrCode,
            @RequestParam(required = false) BigDecimal amount,
            @RequestParam(required = false) String message,
            HttpServletRequest request // For Auth
    ) {
        // 1. Get Current User/Wallet (Mocking auth logic here)
        User currentUser = authService.getCurrentUser(request);
        UUID senderWalletId = authService.getWalletIdByUser(currentUser);

        // 2. Call Service
        TransferRequest pendingRequest = transferService.initiateTransferRequest(
                qrCode,
                senderWalletId,
                amount != null ? amount : BigDecimal.ZERO,
                message
        );

        return ResponseEntity.ok(pendingRequest);
    }

    // ==================================================================================
    // STEP 2: CONFIRM (User Clicks "Pay")
    // ==================================================================================
    @PostMapping("/confirm/{requestId}")
    public ResponseEntity<?> confirmTransfer(
            @PathVariable UUID requestId,
            HttpServletRequest request
    ) {
        User currentUser = authService.getCurrentUser(request);

        // Service returns Object (String URL OR InternalTransactionResponse)
        Object result = transferService.confirmTransfer(requestId, currentUser, request);

        if (result instanceof String) {
            // FLOW B: VNPAY -> Return URL for frontend to redirect user
            return ResponseEntity.ok(Map.of(
                    "type", "REDIRECT",
                    "url", result
            ));
        } else if (result instanceof InternalTransactionResponse) {
            // FLOW A: Internal -> Return DTO directly
            return ResponseEntity.ok(Map.of(
                    "type", "SUCCESS",
                    "data", result
            ));
        }

        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    // ==================================================================================
    // STEP 3: VNPAY CALLBACK (Webhook)
    // ==================================================================================
    @GetMapping("/vnpay-return")
    public void vnpayReturn(
            @RequestParam Map<String, String> queryParams,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        try {
            // 1. Call Service (Returns PaymentDetailResponse DTO)
            PaymentDetailResponse receipt = transferService.handleVnPayCallback(queryParams, request);

            // 2. Redirect to Frontend Success Page
            // We append the paymentDetailId to the URL so the frontend can call an API to fetch the details
            String successUrl = "http://localhost:3000/payment/success?receiptId=" + receipt.getPaymentDetailId();
            response.sendRedirect(successUrl);

        } catch (Exception e) {
            // 3. Redirect to Frontend Failure Page
            String failureUrl = "http://localhost:3000/payment/failed?message=" + e.getMessage();
            response.sendRedirect(failureUrl);
        }
    }
}
