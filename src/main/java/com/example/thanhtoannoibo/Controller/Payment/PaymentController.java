package com.example.thanhtoannoibo.Controller.Payment;
import com.example.thanhtoannoibo.Config.VnPayConfig;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentRequest;
import com.example.thanhtoannoibo.DTO.Response.Payment.VnPayResponse;
import com.example.thanhtoannoibo.Service.VnPay.VnPayService;
import com.example.thanhtoannoibo.Util.VnPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final VnPayService vnPayService;

    @PostMapping("/create-payment")
    public VnPayResponse createVnPayPayment(HttpServletRequest request, @RequestBody PaymentRequest depositRequest) {
        return vnPayService.createVnPayPayment(request, depositRequest);
    }


    @GetMapping("/vnpay-return")
    public int verifyPayment(@RequestParam Map<String, String> queryParams) {
        return vnPayService.verifyPayment(queryParams);
    }
}
