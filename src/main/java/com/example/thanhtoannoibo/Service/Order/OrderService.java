package com.example.thanhtoannoibo.Service.Order;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentRequest;
import com.example.thanhtoannoibo.DTO.Request.Payment.VerifyResult;
import com.example.thanhtoannoibo.DTO.Response.Payment.VnPayResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.Order.Order;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Order.OrderRepository;
import com.example.thanhtoannoibo.Service.Credit.UserCreditService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import com.example.thanhtoannoibo.Service.Voucher.PaymentDetailService;
import com.example.thanhtoannoibo.Service.Transaction.TransactionService;
import com.example.thanhtoannoibo.Service.VnPay.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final AppPackageRepository packageRepository;
    private final AppServiceRepository serviceRepository;

    // Services nghiệp vụ
    private final VnPayService vnPayService;
    private final UserCreditService userCreditService;
    private final TransactionService transactionService;
    private final PaymentDetailService paymentDetailService;

    // Authentication
    private final AuthService authService;
    private final HttpServletRequest httpRequest;

    // --- BƯỚC 1: TẠO ORDER PENDING (Có xác thực Token) ---
    @Transactional
    public VnPayResponse initiateOrder(PaymentRequest request, OrderMethod method) {
        // 1. Lấy User & Validate (Giữ nguyên)
        User user = authService.getCurrentUser(httpRequest);

        AppPackage pkg = null;
        if (request.getPackageId() != null) {
            pkg = packageRepository.findById(request.getPackageId())
                    .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_FOUND));
        }
        AppService service = null;
        if (request.getServiceId() != null) {
            service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        }

        // 2. GỌI VNPAY TRƯỚC ĐỂ LẤY MÃ GIAO DỊCH (TXN_REF)
        // Lưu ý: Nếu bước này lỗi thì Transactional chưa có gì để rollback -> An toàn
        VnPayResponse vnpResponse = vnPayService.createVnPayPayment(httpRequest, request);
        String txnRef = vnpResponse.getTxnRef(); // Lấy mã do VNPay Service sinh ra

        // 3. Lưu Order (PENDING) với mã txnRef vừa lấy được
        Order order = Order.builder()
                .orderRef(txnRef) // Map 1-1 với mã VNPay
                .user(user)
                .packageEntity(pkg)
                .serviceEntity(service)
                .amountPaid(request.getAmount())
                .paymentMethod(method)
                .paymentStatus(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        Order savedOrder = orderRepository.save(order);

        // 4. Lưu Transaction (PENDING)
        UserCredit userCredit = userCreditService.getUserCredit(user.getUserId());

        Transaction pendingTxn = transactionService.initiateTransaction(
                userCredit,
                txnRef, // Dùng chung mã
                request.getAmount(),
                "Thanh toán đơn hàng: " + txnRef,
                Map.of("order_id", savedOrder.getOrderId().toString(), "gateway", "VN_PAY")
        );

        // 6. Trả về kết quả cho Controller
        return vnpResponse;
    }

    // --- BƯỚC 2: XỬ LÝ CALLBACK TỪ VNPAY (Giữ nguyên logic đã tối ưu) ---
    @Transactional
    public void processVnPayCallback(Map<String, String> queryParams) {
        // 1. Gọi hàm Verify mới trả về Object
        VerifyResult result = vnPayService.verifyPaymentAndGetRef(queryParams);

        String orderRef = queryParams.get("vnp_TxnRef");
        String gatewayTxnId = queryParams.get("vnp_TransactionNo");

        Order order = orderRepository.findByOrderRef(orderRef)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getPaymentStatus() == OrderStatus.PAID || order.getPaymentStatus() == OrderStatus.FAILED) {
            return;
        }

        // 2. Kiểm tra kết quả bằng boolean success
        if (result.isSuccess()) {
            handlePaymentSuccess(order, gatewayTxnId);
        } else {
            handlePaymentFailure(order, result.getMessage());
        }
    }

// ...

    // XỬ LÝ THÀNH CÔNG: Update Order & Transaction -> COMPLETED
    private void handlePaymentSuccess(Order order, String gatewayTxnId) {
        log.info("Payment Success: {}", order.getOrderRef());

        // 1. Update Order
        order.setPaymentStatus(OrderStatus.PAID);
        order.setGatewayTransactionId(gatewayTxnId);
        order.setCompletedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 2. Cộng tiền
        BigDecimal creditToAdd = calculateCreditAmount(order);
        userCreditService.addBalance(order.getUser().getUserId(), creditToAdd);
        UserCredit updatedCredit = userCreditService.getUserCredit(order.getUser().getUserId());

        // 3. Update Transaction -> COMPLETED
        Transaction transaction = transactionService.findByRef(order.getOrderRef());
        transactionService.completeTransaction(
                transaction.getTransactionId(),
                TransactionStatus.COMPLETED,
                updatedCredit.getBalance()
        );

        // 4. --- TẠO PAYMENT DETAIL TẠI ĐÂY (VÀ LƯU XUỐNG DB) ---
        // Lưu ý: Hàm này return DTO nhưng ở đây ta chỉ cần nó lưu xuống DB là được
        // Controller sẽ query lại sau.
        paymentDetailService.createFromOrder(transaction, order);
    }

    // XỬ LÝ THẤT BẠI: Update Order & Transaction -> FAILED
    private void handlePaymentFailure(Order order, String failureMessage) {
        log.error("Payment Failed: {}. Reason: {}", order.getOrderRef(), failureMessage);

        // 1. Update Order -> FAILED
        order.setPaymentStatus(OrderStatus.FAILED);
        order.setCompletedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 2. Update Transaction -> FAILED
        try {
            Transaction transaction = transactionService.findByRef(order.getOrderRef());

            // Với giao dịch lỗi, số dư không đổi, ta truyền vào số dư hiện tại hoặc 0 tùy logic
            // (Trong TransactionService.completeTransaction đã có check: nếu FAILED thì không update balanceAfter)
            transactionService.completeTransaction(
                    transaction.getTransactionId(),
                    TransactionStatus.FAILED,
                    BigDecimal.ZERO
            );
        } catch (Exception e) {
            log.warn("Transaction not found for failed order: {}", order.getOrderRef());
        }

        // 3. Ném lỗi để Controller trả về Client
        if (failureMessage.contains("Checksum")) {
            throw new AppException(ErrorCode.VNPAY_INVALID_CHECKSUM);
        } else {
            throw new AppException(ErrorCode.VNPAY_PAYMENT_FAILED);
        }
    }

    // ...

    private BigDecimal calculateCreditAmount(Order order) {
        if (order.getPackageEntity() != null && order.getPackageEntity().getCreditValue() != null) {
            return order.getPackageEntity().getCreditValue();
        }
        return order.getAmountPaid();
    }
}