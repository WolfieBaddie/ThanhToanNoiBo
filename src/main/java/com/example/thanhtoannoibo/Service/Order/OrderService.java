package com.example.thanhtoannoibo.Service.Order;

import com.example.thanhtoannoibo.Common.OrderMethod;
import com.example.thanhtoannoibo.Common.OrderStatus;
import com.example.thanhtoannoibo.Common.TransactionStatus;
import com.example.thanhtoannoibo.Common.TransactionType; // Import Enum
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit; // Import UserCredit
import com.example.thanhtoannoibo.Entity.Order.Order;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository; // Import Repo
import com.example.thanhtoannoibo.Repository.Order.OrderRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final AppPackageRepository packageRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    // --- THAY ĐỔI: Sử dụng UserCreditRepository thay vì UserVoucherRepository ---
    private final UserCreditRepository userCreditRepository;

    // --- 1. TẠO ĐƠN HÀNG MUA GÓI (TOP-UP) ---
    // User chọn gói 50k -> Tạo Order trạng thái PENDING -> Trả về URL thanh toán VNPay
    @Transactional
    public Order initiatePackageOrder(UUID userId, String packageCode, OrderMethod method) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        AppPackage pkg = packageRepository.findByPackageCode(packageCode)
                .orElseThrow(() -> new RuntimeException("Gói cước không tồn tại hoặc ngưng hoạt động"));

        if (!Boolean.TRUE.equals(pkg.getIsActive())) {
            throw new RuntimeException("Gói cước này đang tạm khóa");
        }

        // Tạo mã đơn hàng duy nhất
        String orderRef = "ORD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Order order = Order.builder()
                .orderRef(orderRef)
                .user(user)
                .packageEntity(pkg)
                .amountPaid(pkg.getPrice()) // Giá VNĐ
                .paymentMethod(method)
                .paymentStatus(OrderStatus.PENDING) // Chờ thanh toán
                .build();

        return orderRepository.save(order);
    }

    // --- 2. XỬ LÝ KHI THANH TOÁN THÀNH CÔNG (CALLBACK) ---
    // Hàm này được gọi khi VNPay/Webhook báo về là tiền đã vào tài khoản
    @Transactional
    public void completeOrder(String orderRef, String gatewayTransactionId) {
        // 1. Tìm đơn hàng
        Order order = orderRepository.findByOrderRef(orderRef)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderRef));

        // Idempotency Check: Nếu đơn đã PAID rồi thì không làm gì cả (tránh cộng tiền 2 lần)
        if (order.getPaymentStatus() == OrderStatus.PAID) {
            log.warn("Đơn hàng {} đã được xử lý trước đó.", orderRef);
            return;
        }

        // 2. Cập nhật trạng thái đơn
        order.setPaymentStatus(OrderStatus.PAID);
        order.setGatewayTransactionId(gatewayTransactionId);
        order.setCompletedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 3. CỘNG XU VÀO VÍ NGƯỜI DÙNG (NEW LOGIC)
        // Tìm ví Xu (Credit) của người dùng, nếu chưa có thì tạo mới
        UserCredit userCredit = userCreditRepository.findByUser_UserId(order.getUser().getUserId())
                .orElseGet(() -> createNewCreditForUser(order.getUser()));

        // Lấy giá trị Xu của gói (VD: Gói 50k được 50 Xu)
        BigDecimal creditToAdd = order.getPackageEntity().getCreditValue();

        // Cộng tiền (Hàm này đã có trong Entity UserCredit)
        userCredit.addBalance(creditToAdd);
        userCreditRepository.save(userCredit);

        // 4. GHI LOG BIẾN ĐỘNG SỐ DƯ (TRANSACTION)
        // Lưu ý: Transaction giờ đây link với Credit, không phải Voucher
        Transaction txn = Transaction.builder()
                .transactionRef("TXN-" + orderRef) // Link với mã đơn hàng
                .transactionType(TransactionType.DEPOSIT) // Loại giao dịch: Nạp tiền
                .credit(userCredit) // Liên kết với Ví Xu
                .amount(creditToAdd)
                .balanceAfter(userCredit.getBalance())
                .status(TransactionStatus.COMPLETED)
                .description("Nạp gói: " + order.getPackageEntity().getPackageName())
                .metadata(java.util.Map.of("order_id", order.getOrderId()))
                .build();

        transactionRepository.save(txn);

        log.info("Hoàn tất nạp tiền (DEPOSIT) cho đơn hàng {}, User Balance: {}", orderRef, userCredit.getBalance());
    }

    // --- 3. XỬ LÝ HỦY ĐƠN / THẤT BẠI ---
    @Transactional
    public void failOrder(String orderRef, String reason) {
        Order order = orderRepository.findByOrderRef(orderRef)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        if (order.getPaymentStatus() == OrderStatus.PENDING) {
            order.setPaymentStatus(OrderStatus.FAILED);
            order.setCompletedAt(LocalDateTime.now());
            // Có thể lưu reason vào log hoặc field note
            orderRepository.save(order);
        }
    }

    // Helper: Tự động tạo Ví Xu mới nếu User chưa có (Onboarding)
    private UserCredit createNewCreditForUser(User user) {
        UserCredit newCredit = UserCredit.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .totalDeposited(BigDecimal.ZERO)
                .build();
        return userCreditRepository.save(newCredit);
    }
}