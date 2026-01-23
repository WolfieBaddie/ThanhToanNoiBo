package com.example.thanhtoannoibo.Service.Order;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentRequest;
import com.example.thanhtoannoibo.DTO.Request.Payment.VerifyResult;
import com.example.thanhtoannoibo.DTO.Response.Payment.VnPayResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.Order.Order;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository;
import com.example.thanhtoannoibo.Repository.Order.OrderRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
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
import java.util.HashMap;
import java.util.Map;

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
    private final AuditLogRepository auditLogRepository;
    private final UserCreditRepository userCreditRepository;
    private final TransactionRepository transactionRepository;
    // --- BƯỚC 1: TẠO ORDER PENDING (Có xác thực Token) ---
    @Transactional
    public VnPayResponse initiateOrder(PaymentRequest request, OrderMethod method) {
        // 1. Lấy User & Validate (Giữ nguyên)
        User user = authService.getCurrentUser(httpRequest);
        // 2. GỌI VNPAY TRƯỚC ĐỂ LẤY MÃ GIAO DỊCH (TXN_REF)
        // Lưu ý: Nếu bước này lỗi thì Transactional chưa có gì để rollback -> An toàn
        VnPayResponse vnpResponse = vnPayService.createVnPayPayment(httpRequest, request);
        String txnRef = vnpResponse.getTxnRef(); // Lấy mã do VNPay Service sinh ra

        // 3. Lưu Order (PENDING) với mã txnRef vừa lấy được
        Order order = Order.builder()
                .orderRef(txnRef) // Map 1-1 với mã VNPay
                .user(user)
                .amountPaid(request.getAmount())
                .paymentMethod(method)
                .orderStatus(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
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
        VerifyResult result = vnPayService.verifyPaymentAndGetRef(queryParams);

        String orderRef = queryParams.get("vnp_TxnRef");
        String gatewayTxnId = queryParams.get("vnp_TransactionNo");

        Order order = orderRepository.findByOrderRef(orderRef)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if(order.getOrderStatus().equals(OrderStatus.COMPLETED) && order.getPaymentStatus().equals(PaymentStatus.PAID)) {
            return;
        }

        if(order.getPaymentStatus().equals(PaymentStatus.FAILED))
            throw new AppException(ErrorCode.VNPAY_PAYMENT_FAILED);

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

        // -----------------------------------------------------------
        // [MODIFIED] Lấy User từ HttpRequest thay vì từ Order Entity
        // Lưu ý: Request này phải có Cookie/Header Authorization hợp lệ
        // -----------------------------------------------------------
        User currentUser = authService.getCurrentUser(httpRequest);

        // Validate logic: Đảm bảo người đang login chính là người đã tạo đơn (Tránh hack session)
        if (!currentUser.getUserId().equals(order.getUser().getUserId())) {
            log.warn("User ID mismatch! Logged in: {}, Order owner: {}", currentUser.getUserId(), order.getUser().getUserId());
            // Tùy logic nghiệp vụ: Có thể throw lỗi hoặc vẫn cho phép nếu admin thực hiện
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 1. Update Order
        order.setOrderStatus(OrderStatus.PAID);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setGatewayTransactionId(gatewayTxnId);
        order.setCompletedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 2. Cộng tiền (Sử dụng currentUser vừa lấy được từ Request)
        BigDecimal creditToAdd = calculateCreditAmount(order);

        // Thay order.getUser().getUserId() bằng currentUser.getUserId()
        userCreditService.addBalance(currentUser.getUserId(), creditToAdd);

        // Lấy lại thông tin credit mới nhất của currentUser
        UserCredit updatedCredit = userCreditService.getUserCredit(currentUser.getUserId());

        // 3. Update Transaction -> COMPLETED
        Transaction transaction = transactionService.findByRef(order.getOrderRef());
        transactionService.completeTransaction(
                transaction.getTransactionId(),
                TransactionStatus.COMPLETED,
                updatedCredit.getBalance()
        );
        transactionRepository.save(transaction);
        userCreditRepository.save(updatedCredit);
        // 4. Lưu Payment Detail
        paymentDetailService.createFromOrder(transaction, order);

        savePaymentSuccessLog(order, transaction, gatewayTxnId);
    }

    // XỬ LÝ THẤT BẠI: Update Order & Transaction -> FAILED
// XỬ LÝ THẤT BẠI: Update Order & Transaction -> FAILED
    private void handlePaymentFailure(Order order, String failureMessage) {
        log.error("Payment Failed: {}. Reason: {}", order.getOrderRef(), failureMessage);

        order.setPaymentStatus(PaymentStatus.FAILED);
        order.setOrderStatus(OrderStatus.FAILED);
        order.setCompletedAt(LocalDateTime.now());
        orderRepository.save(order);

        try {
            Transaction transaction = transactionService.findByRef(order.getOrderRef());
            transactionService.completeTransaction(
                    transaction.getTransactionId(),
                    TransactionStatus.FAILED,
                    BigDecimal.ZERO
            );
        } catch (Exception e) {
            log.warn("Transaction not found for failed order: {}", order.getOrderRef());
        }

        if (failureMessage.contains("Checksum")) {
            throw new AppException(ErrorCode.VNPAY_INVALID_CHECKSUM);
        } else {
            throw new AppException(ErrorCode.VNPAY_PAYMENT_FAILED);
        }
    }

    // [Hàm hỗ trợ mới] Logic tạo đối tượng AuditLog và lưu xuống DB
    private void savePaymentSuccessLog(Order order, Transaction transaction, String gatewayTxnId) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("amount", order.getAmountPaid());
            details.put("currency", "VND");
            details.put("gateway", "VN_PAY");
            details.put("gateway_transaction_no", gatewayTxnId);
            details.put("transaction_ref", transaction.getTransactionRef());
            details.put("balance_after", transaction.getBalanceAfter());

            if (order.getPackageEntity() != null) {
                details.put("package_code", order.getPackageEntity().getPackageCode());
            }

            AuditLog auditLog = AuditLog.builder()
                    .user(order.getUser()) // User thực hiện giao dịch
                    .action("PAYMENT_DEPOSIT_SUCCESS") // Hành động
                    .entityType("ORDER") // Đối tượng bị tác động
                    .entityId(order.getOrderId()) // ID của đối tượng
                    .details(details) // Map jsonb
                    .ipAddress("127.0.0.1") // Vì đây là callback từ server VNPay, không phải trực tiếp từ browser user
                    .createdAt(LocalDateTime.now())
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit log saved for order: {}", order.getOrderRef());

        } catch (Exception e) {
            log.error("Failed to save audit log for order {}: {}", order.getOrderRef(), e.getMessage());
        }
    }

    private BigDecimal calculateCreditAmount(Order order) {
        if (order.getPackageEntity() != null && order.getPackageEntity().getCreditValue() != null) {
            return order.getPackageEntity().getCreditValue();
        }
        return order.getAmountPaid();
    }
}