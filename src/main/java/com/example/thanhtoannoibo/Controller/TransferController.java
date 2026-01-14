//package com.example.thanhtoannoibo.Controller;
//import com.example.thanhtoannoibo.DTO.Response.Payment.PaymentDetailResponse;
//import com.example.thanhtoannoibo.Service.Security.AuthService; // Assuming you have this
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.RequiredArgsConstructor;
//import org.springframework.web.bind.annotation.*;
//
//import java.io.IOException;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/transfers")
//@RequiredArgsConstructor
//public class TransferController {
//    private final TransferService transferService;
//    private final AuthService authService; // To get current user
//
//    // ==================================================================================
//    // STEP 3: VNPAY CALLBACK (Webhook)
//    // ==================================================================================
//    @GetMapping("/vnpay-return")
//    public void vnpayReturn(
//            @RequestParam Map<String, String> queryParams,
//            HttpServletRequest request,
//            HttpServletResponse response
//    ) throws IOException {
//        try {
//            // 1. Call Service (Returns PaymentDetailResponse DTO)
//            PaymentDetailResponse receipt = transferService.handleVnPayCallback(queryParams, request);
//
//            // 2. Redirect to Frontend Success Page
//            // We append the paymentDetailId to the URL so the frontend can call an API to fetch the details
//            String successUrl = "http://localhost:3000/payment/success?receiptId=" + receipt.getPaymentDetailId();
//            response.sendRedirect(successUrl);
//
//        } catch (Exception e) {
//            // 3. Redirect to Frontend Failure Page
//            String failureUrl = "http://localhost:3000/payment/failed?message=" + e.getMessage();
//            response.sendRedirect(failureUrl);
//        }
//    }
//}
