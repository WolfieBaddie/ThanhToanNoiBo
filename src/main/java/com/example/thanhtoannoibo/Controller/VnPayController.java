//package com.example.thanhtoannoibo.Controller;
//import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentRequest;
//import com.example.thanhtoannoibo.DTO.Response.Payment.PaymentDetailResponse;
//import com.example.thanhtoannoibo.Util.VnPayUtil;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import jakarta.servlet.http.HttpServletRequest;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/vnpay")
//@RequiredArgsConstructor
//public class VnPayController {
//    private final VnPayUtil vnpayUtil;
//
//    @PostMapping("/create-payment")
//    public ResponseEntity<PaymentDetailResponse> createPayment(
//            @RequestBody PaymentRequest request,
//            HttpServletRequest httpRequest) {
//
//        // Convert amount to VNPAY format (multiply by 100)
//        String amount = String.valueOf(request.getAmount().longValue() * 100);
//
//        // Get client IP
//        String ipAddress = vnpayUtil.getIpAddress(httpRequest);
//
//        // Create payment parameters
//        Map<String, String> vnpParams = vnpayUtil.createPaymentParams(
//                amount,
//                request.getOrderInfo(),
//                request.getBankCode(),
//                request.getLocale(),
//                ipAddress
//        );
//
//        // Create payment URL
//        String paymentUrl = vnpayUtil.createPaymentUrl(vnpParams);
//
//        PaymentDetailResponse response = PaymentDetailResponse.builder()
//                .code("00")
//                .message("success")
//                .paymentUrl(paymentUrl)
//                .build();
//
//        return ResponseEntity.ok(response);
//    }
//
//    @GetMapping("/return")
//    public ResponseEntity<String> paymentReturn(
//            @RequestParam Map<String, String> params) {
//        // Handle VNPAY return callback
//        // Verify checksum and update transaction status
//
//        String vnpResponseCode = params.get("vnp_ResponseCode");
//
//        if ("00".equals(vnpResponseCode)) {
//            return ResponseEntity.ok("Payment successful");
//        } else {
//            return ResponseEntity.ok("Payment failed with code: " + vnpResponseCode);
//        }
//    }
//}
