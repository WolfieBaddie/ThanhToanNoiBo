package com.example.thanhtoannoibo.Service.Admin.Transaction;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.DTO.Request.Transaction.TransactionFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionPartnerInfo;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionResponse;
import com.example.thanhtoannoibo.Entity.QrCode.QrScanLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.QrCode.QrScanLogRepository;
import com.example.thanhtoannoibo.Repository.Wallet.PaymentDetailRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import jakarta.persistence.criteria.JoinType;
@Service
@RequiredArgsConstructor
public class AdminTransactionService {

    private final TransactionRepository transactionRepository;
    private final PaymentDetailRepository paymentDetailRepository;
    private final QrScanLogRepository qrScanLogRepository;

    /**
     * 1. Lấy danh sách giao dịch toàn hệ thống (Có phân trang & lọc)
     */
    public PageResponse<TransactionResponse> getAllTransactions(TransactionFilterRequest filter, Pageable pageable) {
        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. FILTER THEO DANH SÁCH USER
            if (filter != null && filter.getUserIds() != null && !filter.getUserIds().isEmpty()) {
                // Logic: Giao dịch có Payee nằm trong list HOẶC Payer nằm trong list HOẶC CreditUser nằm trong list

                // Join bảng để check ID (Dùng LEFT JOIN để không bị loại bỏ bản ghi nếu cột null)
                // root.get("payee") -> Lấy User nhận
                // root.get("qrCode").get("owner") -> Lấy User trả qua QR
                // root.get("credit").get("user") -> Lấy User nạp tiền

                // Cách an toàn nhất với Criteria Builder để tránh NullPointer khi Join bảng null:

                // Điều kiện 1: Payee ID nằm trong danh sách
                Predicate payeeMatch = root.get("payee").get("userId").in(filter.getUserIds());

                // Điều kiện 2: QR Owner ID nằm trong danh sách (Cần check QR không null)
                // (JPA hiện đại thường tự handle left join khi trỏ path sâu, nhưng dùng explicit join an toàn hơn)
                var qrJoin = root.join("qrCode", JoinType.LEFT);
                var qrOwnerJoin = qrJoin.join("owner", JoinType.LEFT);
                Predicate qrOwnerMatch = qrOwnerJoin.get("userId").in(filter.getUserIds());

                // Điều kiện 3: Credit User ID nằm trong danh sách
                var creditJoin = root.join("credit", JoinType.LEFT);
                var creditUserJoin = creditJoin.join("user", JoinType.LEFT);
                Predicate creditUserMatch = creditUserJoin.get("userId").in(filter.getUserIds());

                // Gộp lại bằng OR: (Là Payee) HOẶC (Là người quét) HOẶC (Là chủ ví)
                predicates.add(cb.or(payeeMatch, qrOwnerMatch, creditUserMatch));
            }

            // 2. CÁC FILTER CŨ (Giữ nguyên)
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

            // Fix lỗi duplicate row khi join nhiều bảng (quan trọng khi dùng toMany, ở đây toOne thì ít bị nhưng cứ thêm cho chắc)
            query.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Transaction> page = transactionRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::mapToAdminListResponse));
    }

    /**
     * 2. Lấy chi tiết giao dịch (Góc nhìn Admin)
     */
    public TransactionDetailResponse getTransactionDetail(UUID transactionId) {
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // Lấy Payment Detail (Sản phẩm/Gói)
        PaymentDetail detail = paymentDetailRepository.findByTransaction_TransactionId(transactionId)
                .orElse(null);

        // Map thông tin sản phẩm
        String itemName = txn.getDescription();
        String itemImage = null;
        String categoryName = "Giao dịch";
        BigDecimal quantity = BigDecimal.ONE;
        BigDecimal unitPrice = txn.getAmount().abs();
        UUID serviceId = null;
        UUID packageId = null;

        if (detail != null) {
            quantity = detail.getQuantity();
            if (quantity.compareTo(BigDecimal.ZERO) > 0) {
                unitPrice = detail.getAmount().divide(quantity, 2, java.math.RoundingMode.HALF_UP);
            }

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
        }

        return TransactionDetailResponse.builder()
                .transactionId(txn.getTransactionId())
                .transactionRef(txn.getTransactionRef())
                .amount(txn.getAmount().abs())
                .status(txn.getStatus().name())
                .type(txn.getTransactionType().name())
                .description(txn.getDescription())
                .createdAt(txn.getCreatedAt())
                .direction("SYSTEM") // Admin xem thì không có IN/OUT, hoặc để SYSTEM

                // Product Info
                .itemName(itemName)
                .itemImage(itemImage)
                .categoryName(categoryName)
                .quantity(quantity)
                .priceAtPurchase(unitPrice)
                .serviceId(serviceId)
                .packageId(packageId)

                // Info người thực hiện
                .partnerInfo(mapAdminPartnerInfo(txn))

                // Ảnh bằng chứng
                .evidenceImage(getEvidenceImage(txn))
                .build();
    }

    // --- HELPER METHODS ---

    /**
     * Map cho List (Hiển thị vắn tắt)
     */
    private TransactionResponse mapToAdminListResponse(Transaction entity) {
        String displayTitle = switch (entity.getTransactionType()) {
            case DEPOSIT -> "Nạp tiền";
            case PAYMENT -> "Thanh toán";
            case BUY_VOUCHER -> "Mua vé/Gói";
            case REDEMPTION -> "Đổi vé/Quà";
            case REFUND -> "Hoàn tiền";
            default -> entity.getTransactionType().name();
        };

        return TransactionResponse.builder()
                .transactionId(entity.getTransactionId())
                .transactionRef(entity.getTransactionRef())
                .title(displayTitle)
                .description(entity.getDescription())
                .amount(entity.getAmount().abs())
                .direction("SYSTEM")
                .status(entity.getStatus().name())
                .transactionType(entity.getTransactionType().name())
                .createdAt(entity.getCreatedAt())
                .partnerInfo(mapAdminPartnerInfo(entity)) // Admin cần thấy ai làm
                .build();
    }

    /**
     * Logic hiển thị "Đối tác" cho Admin.
     * Admin quan tâm: AI LÀ NGƯỜI TRẢ TIỀN/QUÉT MÃ? (User)
     */
    private TransactionPartnerInfo mapAdminPartnerInfo(Transaction txn) {
        User user = null;

        // Ưu tiên 1: Người quét QR (trong giao dịch Payment/Redeem)
        if (txn.getQrCode() != null && txn.getQrCode().getOwner() != null) {
            user = txn.getQrCode().getOwner();
        }
        // Ưu tiên 2: Chủ ví (trong giao dịch Nạp tiền/Mua gói online)
        else if (txn.getCredit() != null) {
            user = txn.getCredit().getUser();
        }

        if (user != null) {
            return TransactionPartnerInfo.builder()
                    .partnerId(user.getUserId())
                    .partnerName(user.getFullName())
                    .partnerImage(user.getImageUrl())
                    .partnerType("USER") // Admin nhìn thấy đây là User
                    .subTitle(user.getPhoneNumber())
                    .build();
        }
        return null;
    }

    /**
     * Tìm ảnh bằng chứng (Copy logic chuẩn từ TransactionService sang)
     */
    private String getEvidenceImage(Transaction txn) {
        if (txn.getQrCode() == null) return null;

        List<QrScanLog> logs = qrScanLogRepository.findByQrCode_QrIdOrderByCreatedAtDesc(txn.getQrCode().getQrId());
        if (logs.isEmpty()) return null;

        return logs.stream()
                .filter(log -> log.getScannedBy() != null
                        && txn.getPayee() != null
                        && log.getScannedBy().getUserId().equals(txn.getPayee().getUserId()))
                .filter(log -> {
                    long diffSeconds = Math.abs(Duration.between(log.getCreatedAt(), txn.getCreatedAt()).toSeconds());
                    return diffSeconds < 60;
                })
                .findFirst()
                .map(QrScanLog::getImageUrl)
                .orElse(null);
    }
}