package com.example.thanhtoannoibo.Service.Transaction;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.TransactionStatus; // Import Enum
import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.DTO.Request.Transaction.TransactionFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionPartnerInfo;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionResponse;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository;
import com.example.thanhtoannoibo.Repository.Wallet.PaymentDetailRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserCreditRepository userCreditRepository;
    private final AuthService authService;
    private final PaymentDetailRepository paymentDetailRepository;
    private final HttpServletRequest httpRequest;

    public Page<TransactionResponse> getMyTransactions(TransactionFilterRequest filter, Pageable pageable) {
        // 1. Lấy User hiện tại
        User currentUser = authService.getCurrentUser(httpRequest);

        // Kiểm tra xem user là Merchant hay User thường
        boolean isMerchant = currentUser.getRoles().stream()
                .anyMatch(r -> r.getRoleCode().equals("MERCHANT"));

        // 2. Build Specification (Query Động)
        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // --- [FIX LOGIC TÌM KIẾM] ---
            if (isMerchant) {
                // CASE A: MERCHANT
                // Merchant xem các giao dịch mà họ là người nhận tiền (payee)
                predicates.add(cb.equal(root.get("payee").get("userId"), currentUser.getUserId()));
            } else {
                // CASE B: USER THƯỜNG
                // User xem giao dịch của Credit (Ví) HOẶC giao dịch QR mình tạo (kể cả khi không qua Credit)
                Predicate isMyCredit = cb.equal(root.get("credit").get("user").get("userId"), currentUser.getUserId());
                Predicate isMyQr = cb.equal(root.get("qrCode").get("owner").get("userId"), currentUser.getUserId());

                // Lấy giao dịch thoả mãn 1 trong 2 điều kiện (Dùng left join để tránh null pointer nếu transaction không có credit/qrcode)
                // Tuy nhiên JPA Criteria mặc định xử lý join, ta cần cẩn thận với null.
                // Đơn giản nhất: (credit.user.id = me) OR (qrCode.owner.id = me)
                // Lưu ý: Cần handle null safety trong query nếu cần, nhưng logic nghiệp vụ:
                // - Nạp tiền: có credit
                // - Thanh toán QR: có qrCode
                predicates.add(cb.or(isMyCredit, isMyQr));
            }

            // ĐIỀU KIỆN CHUNG: CHỈ LẤY GIAO DỊCH ĐÃ THÀNH CÔNG
            predicates.add(cb.equal(root.get("status"), TransactionStatus.COMPLETED));

            // ĐIỀU KIỆN FILTER (Ngày, Loại, Mã...)
            if (filter != null) {
                if (filter.getFromDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate().atStartOfDay()));
                }
                if (filter.getToDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate().atTime(23, 59, 59)));
                }
                if (filter.getType() != null) {
                    predicates.add(cb.equal(root.get("transactionType"), filter.getType()));
                }
                if (filter.getTransactionRef() != null && !filter.getTransactionRef().isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("transactionRef")), "%" + filter.getTransactionRef().toLowerCase() + "%"));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // 3. Query DB
        Page<Transaction> pageResult = transactionRepository.findAll(spec, pageable);

        // 4. Map sang DTO Response (Truyền thêm flag isMerchant để tính chiều dòng tiền IN/OUT)
        return pageResult.map(txn -> mapToResponse(txn, currentUser.getUserId()));
    }

    // --- HÀM MỚI: Lấy chi tiết giao dịch ---
    public TransactionDetailResponse getTransactionDetail(UUID transactionId, UUID currentUserId) {
        // 1. Lấy Transaction (Tái sử dụng Repository)
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // 2. Xác định chiều giao dịch (IN/OUT)
        String direction = "OUT"; // Mặc định là chi tiền
        if (txn.getPayee() != null && txn.getPayee().getUserId().equals(currentUserId)) {
            direction = "IN"; // Nếu mình là người nhận tiền -> Thu tiền (IN)
        }

        // 3. Logic lấy thông tin item (Voucher/Service) - GIỮ NGUYÊN CODE CŨ
        String itemName = "Giao dịch";
        String itemImage = null;
        String categoryName = "Khác";
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal unitPrice = BigDecimal.ZERO;
        UUID serviceId = null;
        UUID packageId = null;

        // ... (Đoạn code map PaymentDetail cũ của bạn copy lại vào đây) ...

        // 4. [MỚI] Lấy thông tin đối tác
        TransactionPartnerInfo partnerInfo = mapPartnerInfo(txn, currentUserId);

        return TransactionDetailResponse.builder()
                .transactionId(txn.getTransactionId())
                .transactionRef(txn.getTransactionRef())
                .amount(txn.getAmount().abs())
                .status(txn.getStatus().name())
                .type(txn.getTransactionType().name())
                .description(txn.getDescription())
                .createdAt(txn.getCreatedAt())
                .direction(direction)
                .itemName(itemName)
                .itemImage(itemImage)
                .categoryName(categoryName)
                .quantity(quantity)
                .priceAtPurchase(unitPrice)
                .serviceId(serviceId)
                .packageId(packageId)

                .partnerInfo(partnerInfo) // Set thông tin đối tác
                .build();
    }

    // Giữ nguyên, không cần sửa gì thêm so với lần trước
    public Transaction initiateTransaction(UserCredit credit, String txnRef, BigDecimal amount, String description, Map<String, Object> metadata) {
        Transaction txn = Transaction.builder()
                .transactionRef(txnRef)
                .transactionType(TransactionType.DEPOSIT)
                .credit(credit)
                .amount(amount)
                .balanceAfter(credit.getBalance())
                .status(TransactionStatus.PENDING)
                .description(description)
                .metadata(metadata)
                .createdAt(LocalDateTime.now())
                .build();
        return transactionRepository.save(txn);
    }

    // 2. Hoàn tất Transaction (Gọi khi VNPay callback thành công/thất bại)
    @Transactional
    public void completeTransaction(UUID transactionId, TransactionStatus status, BigDecimal newBalance) {
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        txn.setStatus(status);

        // Chỉ cập nhật số dư cuối cùng nếu thành công
        if (status == TransactionStatus.COMPLETED) {
            txn.setBalanceAfter(newBalance);
        }

        transactionRepository.save(txn);
    }

    // 3. Tìm theo Ref
    public Transaction findByRef(String txnRef) {
        return transactionRepository.findByTransactionRef(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
    }

    private TransactionResponse mapToResponse(Transaction entity, UUID currentUserId) {
        // Xác định chiều dòng tiền (IN/OUT) dựa trên vai trò của người xem trong giao dịch này
        String direction;

        // Nếu người xem là người nhận tiền (Merchant)
        if (entity.getPayee() != null && entity.getPayee().getUserId().equals(currentUserId)) {
            direction = "IN";
        }
        // Nếu là giao dịch Nạp tiền (User tự nạp vào ví)
        else if (entity.getTransactionType() == TransactionType.DEPOSIT) {
            direction = "IN";
        }
        // Còn lại là chi tiêu (OUT)
        else {
            direction = "OUT";
        }

        String displayTitle = switch (entity.getTransactionType()) {
            case DEPOSIT -> "Nạp tiền vào ví";
            case PAYMENT, BUY_VOUCHER -> {
                if ("IN".equals(direction)) yield "Nhận thanh toán"; // Merchant thấy cái này
                yield "Thanh toán dịch vụ"; // User thấy cái này
            }
            case REFUND -> "Hoàn tiền";
            default -> "Giao dịch khác";
        };

        return TransactionResponse.builder()
                .transactionId(entity.getTransactionId())
                .transactionRef(entity.getTransactionRef())
                .title(displayTitle)
                .description(entity.getDescription())
                .amount(entity.getAmount().abs())
                .direction(direction)
                .status(entity.getStatus().name())
                .transactionType(entity.getTransactionType().name())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private TransactionDetailResponse mapToDetailResponse(Transaction txn, PaymentDetail detail, UUID currentUserId) {
        // Logic xác định chiều dòng tiền tương tự mapToResponse
        String direction;
        if (txn.getPayee() != null && txn.getPayee().getUserId().equals(currentUserId)) {
            direction = "IN";
        } else if (txn.getTransactionType() == TransactionType.DEPOSIT) {
            direction = "IN";
        } else {
            direction = "OUT";
        }

        String itemName = txn.getDescription();
        String itemImage = null;
        String categoryName = null;
        BigDecimal quantity = BigDecimal.ONE;
        BigDecimal unitPrice = txn.getAmount().abs();
        UUID serviceId = null;
        UUID packageId = null;

        if (detail != null) {
            quantity = detail.getQuantity();
            if (detail.getService() != null) {
                itemName = detail.getService().getServiceName();
                itemImage = detail.getService().getImageUrl();
                serviceId = detail.getService().getServiceId();
                if (detail.getService().getCategory() != null) {
                    categoryName = detail.getService().getCategory().getCategoryName();
                }
            } else if (detail.getPackageRef() != null) {
                itemName = detail.getPackageRef().getPackageName();
                packageId = detail.getPackageRef().getPackageId();
                categoryName = "Gói dịch vụ";
            }
            if (quantity.compareTo(BigDecimal.ZERO) > 0) {
                unitPrice = detail.getAmount().abs().divide(quantity, 2, java.math.RoundingMode.HALF_UP);
            }
        }

        return TransactionDetailResponse.builder()
                .transactionId(txn.getTransactionId())
                .transactionRef(txn.getTransactionRef())
                .amount(txn.getAmount().abs())
                .status(txn.getStatus().name())
                .type(txn.getTransactionType().name())
                .description(txn.getDescription())
                .createdAt(txn.getCreatedAt())
                .direction(direction)
                .itemName(itemName)
                .itemImage(itemImage)
                .categoryName(categoryName)
                .quantity(quantity)
                .priceAtPurchase(unitPrice)
                .serviceId(serviceId)
                .packageId(packageId)
                .build();
    }


    private TransactionPartnerInfo mapPartnerInfo(Transaction txn, UUID currentUserId) {
        // Nếu giao dịch không có QR (vd: nạp tiền), trả về null
        if (txn.getQrCode() == null || txn.getQrCode().getOwner() == null) {
            return null;
        }

        User payer = txn.getQrCode().getOwner(); // Người dùng (User) - Người trả tiền/vé
        User payee = txn.getPayee();             // Người bán (Merchant) - Người nhận

        // CASE 1: Người xem là MERCHANT (Payee) -> Hiển thị thông tin KHÁCH HÀNG
        if (payee != null && payee.getUserId().equals(currentUserId)) {
            return TransactionPartnerInfo.builder()
                    .partnerId(payer.getUserId())
                    .partnerName(payer.getFullName()) // "Nguyễn Văn A"
                    .partnerImage(payer.getImageUrl())
                    .partnerType("CUSTOMER")
                    .subTitle(payer.getPhoneNumber()) // "0988xxxxxx"
                    .build();
        }

        // CASE 2: Người xem là USER (Payer) -> Hiển thị thông tin CỬA HÀNG
        else {
            // Lấy tên Quầy từ Metadata (đã lưu ở bước processTransaction)
            String counterName = "Cửa hàng";
            if (txn.getMetadata() != null && txn.getMetadata().containsKey("counter_name")) {
                counterName = txn.getMetadata().get("counter_name").toString();
            }

            return TransactionPartnerInfo.builder()
                    .partnerId(payee != null ? payee.getUserId() : null)
                    .partnerName(counterName) // "Quầy Phở Số 1"
                    .partnerImage(payee != null ? payee.getImageUrl() : null) // Logo quán
                    .partnerType("MERCHANT")
                    .subTitle(payee != null ? "Thu ngân: " + payee.getFullName() : "")
                    .build();
        }
    }
}