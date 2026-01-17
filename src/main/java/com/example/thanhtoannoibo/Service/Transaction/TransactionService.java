package com.example.thanhtoannoibo.Service.Transaction;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.TransactionStatus; // Import Enum
import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.DTO.Request.Transaction.TransactionFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionResponse;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
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
        // 1. Lấy User hiện tại -> Lấy UserCredit
        User currentUser = authService.getCurrentUser(httpRequest);
        UserCredit userCredit = userCreditRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.CREDIT_NOT_FOUND));

        // 2. Build Specification (Query Động)
        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // ĐIỀU KIỆN 1: Phải là giao dịch của ví này
            predicates.add(cb.equal(root.get("credit").get("creditId"), userCredit.getCreditId()));

            // ĐIỀU KIỆN 2 (MỚI): CHỈ LẤY GIAO DỊCH ĐÃ THÀNH CÔNG
            // Frontend User chỉ quan tâm tiền đã thực sự trừ/cộng
            predicates.add(cb.equal(root.get("status"), TransactionStatus.COMPLETED));

            // ĐIỀU KIỆN 3: Các bộ lọc từ Filter Request
            if (filter != null) {
                // Lọc theo ngày bắt đầu (Từ 00:00:00)
                if (filter.getFromDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate().atStartOfDay()));
                }
                // Lọc theo ngày kết thúc (Đến 23:59:59)
                if (filter.getToDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate().atTime(23, 59, 59)));
                }
                // Lọc theo loại giao dịch
                if (filter.getType() != null) {
                    predicates.add(cb.equal(root.get("transactionType"), filter.getType()));
                }
                // Tìm theo mã giao dịch
                if (filter.getTransactionRef() != null && !filter.getTransactionRef().isEmpty()) {
                    // Dùng likeIgnoreCase cho tiện tìm kiếm
                    predicates.add(cb.like(cb.lower(root.get("transactionRef")), "%" + filter.getTransactionRef().toLowerCase() + "%"));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // 3. Query DB
        Page<Transaction> pageResult = transactionRepository.findAll(spec, pageable);

        // 4. Map sang DTO Response
        return pageResult.map(this::mapToResponse);
    }

    // --- HÀM MỚI: Lấy chi tiết giao dịch ---
    public TransactionDetailResponse getTransactionDetail(UUID transactionId) {
        // 1. Lấy User hiện tại (Để bảo mật, không cho xem trộm giao dịch người khác)
        User currentUser = authService.getCurrentUser(httpRequest);

        // 2. Tìm Transaction
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // 3. Security Check: Giao dịch này có thuộc về ví của user không?
        if (!txn.getCredit().getUser().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED); // Hoặc TRANSACTION_NOT_FOUND để ẩn luôn
        }

        // 4. Lấy thông tin Payment Detail (Nối bảng PaymentDetail -> Service)
        PaymentDetail detail = paymentDetailRepository.findByTransaction_TransactionId(transactionId)
                .orElse(null); // Có thể null nếu là giao dịch nạp tiền cũ chưa có detail

        // 5. Map dữ liệu sang DTO Response
        return mapToDetailResponse(txn, detail);
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

    private TransactionResponse mapToResponse(Transaction entity) {
        boolean isIncome = switch (entity.getTransactionType()) {
            case DEPOSIT -> true;
            default -> false;
        };

        String displayTitle = switch (entity.getTransactionType()) {
            case DEPOSIT -> "Nạp tiền vào ví";
            case BUY_VOUCHER -> "Thanh toán dịch vụ";
            default -> "Giao dịch khác";
        };

        return TransactionResponse.builder()
                .transactionId(entity.getTransactionId())
                .transactionRef(entity.getTransactionRef())
                .title(displayTitle)
                .description(entity.getDescription())
                .amount(entity.getAmount().abs())
                .direction(isIncome ? "IN" : "OUT")
                .status(entity.getStatus().name()) // Lúc này status luôn là COMPLETED
                .transactionType(entity.getTransactionType().name())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private TransactionDetailResponse mapToDetailResponse(Transaction txn, PaymentDetail detail) {
        boolean isIncome = switch (txn.getTransactionType()) {
            case DEPOSIT -> true;
            default -> false;
        };

        // Mặc định lấy description của txn
        String itemName = txn.getDescription();
        String itemImage = null;
        String categoryName = null;
        BigDecimal quantity = BigDecimal.ONE;
        BigDecimal unitPrice = txn.getAmount().abs();
        UUID serviceId = null;
        UUID packageId = null;

        // Nếu tìm thấy PaymentDetail -> Ghi đè thông tin chi tiết từ Service/Package
        if (detail != null) {
            quantity = detail.getQuantity();

            // Ưu tiên lấy thông tin Service
            if (detail.getService() != null) {
                itemName = detail.getService().getServiceName();
                itemImage = detail.getService().getImageUrl();
                serviceId = detail.getService().getServiceId();
                if (detail.getService().getCategory() != null) {
                    categoryName = detail.getService().getCategory().getCategoryName();
                }
            }
            // Nếu không có Service thì lấy Package
            else if (detail.getPackageRef() != null) {
                itemName = detail.getPackageRef().getPackageName();
                // itemImage = detail.getPackageRef().getImageUrl(); // Nếu package có ảnh
                packageId = detail.getPackageRef().getPackageId();
                categoryName = "Gói dịch vụ";
            }

            // Tính lại đơn giá: Tổng tiền / Số lượng
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
                .direction(isIncome ? "IN" : "OUT")

                // Chi tiết sản phẩm
                .itemName(itemName)
                .itemImage(itemImage)
                .categoryName(categoryName)
                .quantity(quantity)
                .priceAtPurchase(unitPrice)
                .serviceId(serviceId)
                .packageId(packageId)
                .build();
    }
}