package com.example.thanhtoannoibo.Controller.Payment;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.OrderMethod;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentRequest;
import com.example.thanhtoannoibo.DTO.Request.Payment.VerifyResult;
import com.example.thanhtoannoibo.DTO.Response.Payment.PaymentDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Payment.VnPayResponse;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Service.Order.OrderService;
import com.example.thanhtoannoibo.Service.VnPay.VnPayService;
import com.example.thanhtoannoibo.Service.Voucher.PaymentDetailService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VnPayService vnPayService;
    private final OrderService orderService;
    private final PaymentDetailService paymentDetailService;
    private final TransactionRepository transactionRepository;

    // --- SỬA ĐỔI Ở ĐÂY ---
    @PostMapping("/create-payment")
    public VnPayResponse createVnPayPayment(@RequestBody PaymentRequest depositRequest) {
        // Gọi OrderService để nó vừa tạo Order/Transaction vừa lấy URL từ VNPay
        return orderService.initiateOrder(depositRequest, OrderMethod.VN_PAY);
    }
    // ---------------------

    @GetMapping("/vnpay-return")
    public ResponseEntity<PaymentDetailResponse> verifyAndGetReceipt(@RequestParam Map<String, String> queryParams) {
        // 1. Verify Checksum
        VerifyResult verifyResult = vnPayService.verifyPaymentAndGetRef(queryParams);
        if (!verifyResult.isSuccess()) {
            try { orderService.processVnPayCallback(queryParams); } catch (Exception e) {}
            throw new AppException(ErrorCode.VNPAY_PAYMENT_FAILED);
        }

        // 2. Xử lý nghiệp vụ (Update DB -> Tạo PaymentDetail)
        orderService.processVnPayCallback(queryParams);

        // 3. Truy vấn lại PaymentDetail vừa tạo để trả về
        String txnRef = verifyResult.getTransactionRef();

        Transaction transaction = transactionRepository.findByTransactionRef(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // Hàm này sẽ tìm thấy bản ghi vì nó vừa được tạo ở bước 2 (handlePaymentSuccess)
        PaymentDetailResponse receipt = paymentDetailService.getByTransaction(transaction);

        if (receipt == null) {
            throw new AppException(ErrorCode.PAYMENT_DETAIL_NOT_FOUND);
        }

        return ResponseEntity.ok(receipt);
    }
}