package com.example.thanhtoannoibo.Service.Transaction;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.TransactionStatus; // Import Enum
import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.DTO.Request.Transaction.TransactionFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionPartnerInfo;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.UserTransactionDetailResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.QrCode.QrScanLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrScanLogRepository;
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
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserCreditRepository userCreditRepository;
    private final AuthService authService;
    private final HttpServletRequest httpRequest;
    private final QrScanLogRepository qrScanLogRepository;
    private final PaymentDetailRepository paymentDetailRepository;
    private final AppServiceRepository appServiceRepository;
    private final AppPackageRepository appPackageRepository;
    public Page<TransactionResponse> getMyTransactions(TransactionFilterRequest filter, Pageable pageable) {
        User currentUser = authService.getCurrentUser(httpRequest);

        // Debug: In ra để xem user hiện tại có role gì (Kiểm tra xem tên role trong DB là MERCHANT hay ROLE_MERCHANT)
        // System.out.println("User Roles: " + currentUser.getRoles());

        boolean isMerchant = currentUser.getRoles().stream()
                .anyMatch(r -> r.getRoleCode().equalsIgnoreCase("MERCHANT")); // Dùng equalsIgnoreCase cho an toàn

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (isMerchant) {
                // MERCHANT: Chỉ cần check payee (người nhận tiền)
                // payee cũng có thể null nếu là giao dịch hệ thống, nên dùng Left Join cho chắc
                Join<Transaction, User> payeeJoin = root.join("payee", JoinType.LEFT);
                predicates.add(cb.equal(payeeJoin.get("userId"), currentUser.getUserId()));
            } else {
                // USER: Check Ví (Credit) HOẶC QR
                // [FIX LỖI]: Dùng root.join(..., JoinType.LEFT) thay vì root.get(...)
                // Để nếu qrCode = null (giao dịch nạp tiền), dòng đó KHÔNG bị mất.

                // 1. Join bảng UserCredit (Left Join)
                Join<Transaction, UserCredit> creditJoin = root.join("credit", JoinType.LEFT);
                // Từ Credit join sang User
                Join<UserCredit, User> creditUserJoin = creditJoin.join("user", JoinType.LEFT);

                // 2. Join bảng QRCode (Left Join)
                Join<Transaction, QRCode> qrJoin = root.join("qrCode", JoinType.LEFT);
                // Từ QRCode join sang Owner (User)
                Join<QRCode, User> qrOwnerJoin = qrJoin.join("owner", JoinType.LEFT);

                // 3. Tạo điều kiện
                Predicate isMyCredit = cb.equal(creditUserJoin.get("userId"), currentUser.getUserId());
                Predicate isMyQr = cb.equal(qrOwnerJoin.get("userId"), currentUser.getUserId());

                // 4. Combine (OR)
                predicates.add(cb.or(isMyCredit, isMyQr));
            }

            // Điều kiện chung: Status COMPLETED
            predicates.add(cb.equal(root.get("status"), TransactionStatus.COMPLETED));

            // ... (Phần Filter phía dưới giữ nguyên) ...
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

        Page<Transaction> pageResult = transactionRepository.findAll(spec, pageable);
        return pageResult.map(txn -> mapToResponse(txn, currentUser.getUserId()));
    }

    // --- HÀM MỚI: Lấy chi tiết giao dịch ---
    public TransactionDetailResponse getTransactionDetail(UUID transactionId, UUID currentUserId) {
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        String direction = "OUT";
        if (txn.getPayee() != null && txn.getPayee().getUserId().equals(currentUserId)) {
            direction = "IN";
        }

        PaymentDetail detail = paymentDetailRepository.findByTransaction_TransactionId(transactionId).orElse(null);

        String itemName = txn.getDescription();
        String itemImage = null;
        String categoryName = "Giao dịch";
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
                categoryName = detail.getService().getCategory() != null ? detail.getService().getCategory().getCategoryName() : "Dịch vụ";
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
                .partnerInfo(mapPartnerInfo(txn, currentUserId))
                .evidenceImage(getEvidenceImage(txn))
                .build();
    }


    /**
     * Hàm tìm ảnh bằng chứng từ bảng Log quét QR
     * Logic: Tìm log quét của QR này, do đúng Merchant (Payee) quét,
     * và thời gian quét lệch không quá 60s so với thời gian tạo giao dịch.
     */
    private String getEvidenceImage(Transaction txn) {
        if (txn.getQrCode() == null) return null;
        List<QrScanLog> logs = qrScanLogRepository.findByQrCode_QrIdOrderByCreatedAtDesc(txn.getQrCode().getQrId());
        if (logs.isEmpty()) return null;

        return logs.stream()
                .filter(log -> log.getScannedBy() != null
                        && txn.getPayee() != null
                        && log.getScannedBy().getUserId().equals(txn.getPayee().getUserId()))
                .filter(log -> Math.abs(java.time.Duration.between(log.getCreatedAt(), txn.getCreatedAt()).toSeconds()) < 60)
                .findFirst()
                .map(QrScanLog::getImageUrl)
                .orElse(null);
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
        String direction = "OUT";
        if (entity.getPayee() != null && entity.getPayee().getUserId().equals(currentUserId)) {
            direction = "IN";
        } else if (entity.getTransactionType() == TransactionType.DEPOSIT) {
            direction = "IN";
        }

        String displayTitle = switch (entity.getTransactionType()) {
            case DEPOSIT -> "Nạp tiền vào ví";
            case PAYMENT, BUY_VOUCHER -> ("IN".equals(direction)) ? "Nhận thanh toán" : "Thanh toán dịch vụ";
            case REDEMPTION -> ("IN".equals(direction)) ? "Giao dịch quét qr" : "Đổi quà/Voucher";
            case REFUND -> "Hoàn tiền";
            default -> "Giao dịch hệ thống";
        };

        // [QUAN TRỌNG] Lấy thông tin đối tác để Frontend hiển thị tên & ảnh
        TransactionPartnerInfo partnerInfo = mapPartnerInfo(entity, currentUserId);

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
                .partnerInfo(partnerInfo) // [FIX]: Bổ sung trường này
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

    @Transactional
    public UserTransactionDetailResponse getUserTransactionDetail(UUID transactionId, UUID userId) {
        // 1. Tìm Transaction
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // 2. Validate Quyền
        boolean isOwner = false;
        if (txn.getCredit() != null && txn.getCredit().getUser().getUserId().equals(userId)) isOwner = true;
        if (txn.getQrCode() != null && txn.getQrCode().getOwner().getUserId().equals(userId)) isOwner = true;
        if (txn.getPayee() != null && txn.getPayee().getUserId().equals(userId)) isOwner = true;
        if (!isOwner) throw new AppException(ErrorCode.UNAUTHORIZED);

        // 3. Init Variables
        String direction = (txn.getPayee() != null && txn.getPayee().getUserId().equals(userId)) || txn.getTransactionType() == TransactionType.DEPOSIT ? "IN" : "OUT";

        // Mặc định
        String itemName = txn.getDescription();
        String itemImage = null;
        String categoryName = "Giao dịch";
        BigDecimal quantity = BigDecimal.ONE;
        BigDecimal unitPrice = BigDecimal.ZERO;

        UUID serviceId = null;
        UUID packageId = null;

        // 4. LẤY PAYMENT DETAIL (QUAN TRỌNG NHẤT)
        PaymentDetail detail = paymentDetailRepository.findByTransaction_TransactionId(transactionId).orElse(null);

        if (detail != null) {
            quantity = detail.getQuantity();
            if (quantity.compareTo(BigDecimal.ZERO) > 0) {
                unitPrice = txn.getAmount().abs().divide(quantity, 2, java.math.RoundingMode.HALF_UP);
            }

            // [LOGIC SỬA LỖI]: Luôn ưu tiên lấy AppService từ PaymentDetail để có ảnh
            AppService serviceInfo = detail.getService();
            AppPackage packageInfo = detail.getPackageRef();

            // A. NẾU CÓ SERVICE (Dù là lẻ hay trong gói, PaymentDetail luôn lưu Service)
            if (serviceInfo != null) {
                itemName = serviceInfo.getServiceName(); // Tên dịch vụ cụ thể (VD: Gội đầu)
                itemImage = serviceInfo.getImageUrl();   // Ảnh dịch vụ cụ thể
                serviceId = serviceInfo.getServiceId();

                if (serviceInfo.getCategory() != null) {
                    categoryName = serviceInfo.getCategory().getCategoryName();
                } else {
                    categoryName = "Dịch vụ";
                }
            }

            // B. NẾU CÓ PACKAGE (Để bổ sung thông tin nguồn gốc)
            if (packageInfo != null) {
                packageId = packageInfo.getPackageId();
                categoryName = "Gói: " + packageInfo.getPackageName(); // Ghi đè category để user biết dùng từ gói nào

                // Fallback: Nếu không có service (lỗi dữ liệu), mới dùng tên gói
                if (serviceInfo == null) {
                    itemName = packageInfo.getPackageName();
                    // itemImage = packageInfo.getImageUrl(); // Gói có thể không có ảnh, hoặc dùng ảnh mặc định
                }
            }
        }

        // 5. LOGIC HIỂN THỊ VÉ (Dựa vào QR Code)
        boolean isTicket = false;
        String amountDisplay = String.format("%s%s", (direction.equals("IN") ? "+" : "-"), new java.text.DecimalFormat("#,###").format(txn.getAmount().abs()));

        Integer qrLimit = 0;
        Integer qrCount = 0;

        if (txn.getQrCode() != null) {
            QRCode qr = txn.getQrCode();
            qrLimit = qr.getUsageLimit();
            qrCount = qr.getUsageCount();

            // Nếu là QR Vé
            if (qrLimit > 0) {
                isTicket = true;
                if (txn.getTransactionType() == TransactionType.REDEMPTION) {
                    amountDisplay = String.format("-%s Vé", quantity.intValue());
                }
            }

            // [FALLBACK MẠNH]: Nếu PaymentDetail bị mất (lỗi DB), cố gắng khôi phục từ UserVoucher
            if (serviceId == null && packageId == null) {
                UserVoucher voucher = qr.getPayerVoucher();
                if (voucher != null) {
                    // Cố tìm Service ID từ Voucher
                    if (voucher.getServiceId() != null) {
                        AppService s = appServiceRepository.findById(voucher.getServiceId()).orElse(null);
                        if (s != null) {
                            itemName = s.getServiceName();
                            itemImage = s.getImageUrl();
                            serviceId = s.getServiceId();
                        }
                    }
                    // Cố tìm Package ID từ Voucher
                    else if (voucher.getPackageId() != null) {
                        AppPackage p = appPackageRepository.findById(voucher.getPackageId()).orElse(null);
                        if (p != null) {
                            itemName = p.getPackageName();
                            packageId = p.getPackageId();
                            categoryName = "Gói dịch vụ";
                        }
                    }
                    // Tên cứng snapshot
                    else if (voucher.getServiceName() != null) {
                        itemName = voucher.getServiceName();
                    }
                }
            }
        }

        // 6. Build Response
        return UserTransactionDetailResponse.builder()
                .transactionId(txn.getTransactionId())
                .transactionRef(txn.getTransactionRef())
                .title(txn.getTransactionType() == TransactionType.REDEMPTION ? "Sử dụng Voucher" : "Thanh toán")
                .amountDisplay(amountDisplay)
                .isTicketRedemption(isTicket)

                // Standard Info
                .amount(txn.getAmount())
                .status(txn.getStatus().name())
                .type(txn.getTransactionType().name())
                .description(txn.getDescription())
                .createdAt(txn.getCreatedAt())
                .direction(direction)

                // Product Info (Đã chuẩn hóa: Luôn có ItemName và ItemImage từ Service nếu có)
                .itemName(itemName)
                .itemImage(itemImage)
                .categoryName(categoryName)
                .quantity(quantity)
                .priceAtPurchase(unitPrice)
                .serviceId(serviceId)
                .packageId(packageId)

                // Partner & Evidence
                .partnerInfo(mapPartnerInfo(txn, userId))
                .evidenceImage(getEvidenceImage(txn))

                .qrId(txn.getQrCode() != null ? txn.getQrCode().getQrId() : null)
                .qrUsageLimit(qrLimit)
                .qrUsageCount(qrCount)
                .build();
    }


    private TransactionPartnerInfo mapPartnerInfo(Transaction txn, UUID currentUserId) {
        // [FIX] Thêm check null an toàn cho qrCode
        if (txn.getQrCode() == null || txn.getQrCode().getOwner() == null) {
            return null;
        }

        User payer = txn.getQrCode().getOwner();
        User payee = txn.getPayee();

        // CASE 1: Người xem là MERCHANT -> Hiển thị Khách
        if (payee != null && payee.getUserId().equals(currentUserId)) {
            return TransactionPartnerInfo.builder()
                    .partnerId(payer.getUserId())
                    .partnerName(payer.getFullName())
                    .partnerImage(payer.getImageUrl())
                    .partnerType("CUSTOMER")
                    .subTitle(payer.getPhoneNumber())
                    .build();
        }
        // CASE 2: Người xem là USER -> Hiển thị Quán
        else {
            String counterName = "Cửa hàng";
            if (txn.getMetadata() != null && txn.getMetadata().containsKey("counter_name")) {
                counterName = txn.getMetadata().get("counter_name").toString();
            }
            return TransactionPartnerInfo.builder()
                    .partnerId(payee != null ? payee.getUserId() : null)
                    .partnerName(counterName)
                    .partnerImage(payee != null ? payee.getImageUrl() : null)
                    .partnerType("MERCHANT")
                    .subTitle(payee != null ? "Thu ngân: " + payee.getFullName() : "")
                    .build();
        }
    }
}