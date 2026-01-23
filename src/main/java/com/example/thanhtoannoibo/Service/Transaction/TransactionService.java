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
        // 1. Tìm Transaction
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        String direction = "OUT";
        if (txn.getPayee() != null && txn.getPayee().getUserId().equals(currentUserId)) {
            direction = "IN";
        }

        // 2. [THAY ĐỔI] Lấy danh sách chi tiết (List) thay vì 1 cái (Optional)
        List<PaymentDetail> details = paymentDetailRepository.findAllByTransaction_TransactionId(transactionId);

        // Khởi tạo giá trị mặc định
        String itemName = txn.getDescription();
        String itemImage = null;
        String categoryName = "Giao dịch";
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal unitPrice = txn.getAmount().abs();

        UUID serviceId = null;
        UUID packageId = null;

        // List chứa các món chi tiết để trả về
        List<TransactionDetailResponse.TransactionItemDetail> itemsList = new ArrayList<>();

        // 3. Xử lý vòng lặp
        if (details != null && !details.isEmpty()) {
            for (PaymentDetail detail : details) {
                String subName = "Sản phẩm";
                String subImage = null;

                // Lấy thông tin Service/Package của item này
                if (detail.getService() != null) {
                    subName = detail.getService().getServiceName();
                    subImage = detail.getService().getImageUrl();
                    // Set ảnh đại diện cho transaction nếu chưa có
                    if (itemImage == null) itemImage = subImage;
                }

                // Cộng dồn số lượng
                totalQuantity = totalQuantity.add(detail.getQuantity());

                // Thêm vào danh sách chi tiết
                itemsList.add(TransactionDetailResponse.TransactionItemDetail.builder()
                        .itemName(subName)
                        .itemImage(subImage)
                        .quantity(detail.getQuantity())
                        .unitPrice(detail.getAmount())
                        .build());

                // Logic chọn Tên/Category chính để hiển thị (Ưu tiên Package)
                if (detail.getPackageRef() != null) {
                    itemName = "Gói: " + detail.getPackageRef().getPackageName();
                    packageId = detail.getPackageRef().getPackageId();
                    categoryName = "Gói dịch vụ";
                } else if (detail.getService() != null) {
                    // Nếu chưa có packageId (nghĩa là đang là món lẻ), thì lấy thông tin service này làm chính
                    if (packageId == null) {
                        itemName = detail.getService().getServiceName();
                        serviceId = detail.getService().getServiceId();
                        categoryName = detail.getService().getCategory() != null
                                ? detail.getService().getCategory().getCategoryName()
                                : "Dịch vụ";
                    }
                }
            }

            // Tính lại đơn giá hiển thị (Amount / Tổng số lượng)
            if (totalQuantity.compareTo(BigDecimal.ZERO) > 0) {
                unitPrice = txn.getAmount().abs().divide(totalQuantity, 2, java.math.RoundingMode.HALF_UP);
            }
        } else {
            // Fallback nếu không có payment detail (dữ liệu cũ)
            totalQuantity = BigDecimal.ONE;
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

                // Các trường thông tin tổng hợp
                .itemName(itemName)
                .itemImage(itemImage)
                .categoryName(categoryName)
                .quantity(totalQuantity)
                .priceAtPurchase(unitPrice)
                .serviceId(serviceId)
                .packageId(packageId)

                // [MỚI] Trả về list chi tiết
                .items(itemsList)

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
        // 1. Tìm Transaction & Validate Quyền (Giữ nguyên)
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // Validate owner... (Giữ nguyên code cũ của bạn)
        boolean isOwner = false;
        if (txn.getCredit() != null && txn.getCredit().getUser().getUserId().equals(userId)) isOwner = true;
        if (txn.getQrCode() != null && txn.getQrCode().getOwner().getUserId().equals(userId)) isOwner = true;
        if (txn.getPayee() != null && txn.getPayee().getUserId().equals(userId)) isOwner = true;
        if (!isOwner) throw new AppException(ErrorCode.UNAUTHORIZED);

        String direction = (txn.getPayee() != null && txn.getPayee().getUserId().equals(userId)) || txn.getTransactionType() == TransactionType.DEPOSIT ? "IN" : "OUT";

        // 2. [THAY ĐỔI LỚN] Lấy LIST PaymentDetail thay vì 1 cái
        List<PaymentDetail> details = paymentDetailRepository.findAllByTransaction_TransactionId(transactionId);

        // Khởi tạo biến hiển thị mặc định
        String mainItemName = txn.getDescription();
        String mainItemImage = null;
        String categoryName = "Giao dịch";
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal displayUnitPrice = BigDecimal.ZERO;

        UUID serviceId = null;
        UUID packageId = null;

        List<UserTransactionDetailResponse.TransactionItemDetail> itemsList = new ArrayList<>();

        // 3. Xử lý Logic Mapping List
        if (details != null && !details.isEmpty()) {

            // A. Duyệt qua từng detail để build list items con
            for (PaymentDetail dt : details) {
                String subName = "Sản phẩm";
                String subImage = null;

                if (dt.getService() != null) {
                    subName = dt.getService().getServiceName();
                    subImage = dt.getService().getImageUrl();
                    // Lấy info cho main display nếu chưa có
                    if (mainItemImage == null) mainItemImage = subImage;
                }

                // Cộng dồn số lượng
                totalQuantity = totalQuantity.add(dt.getQuantity());

                // Add vào list con
                itemsList.add(UserTransactionDetailResponse.TransactionItemDetail.builder()
                        .itemName(subName)
                        .itemImage(subImage)
                        .quantity(dt.getQuantity())
                        .unitPrice(dt.getAmount()) // Hoặc chia ra nếu cần unit price gốc
                        .build());

                // B. Logic xác định Main Info (Package hay Service lẻ)
                if (dt.getPackageRef() != null) {
                    packageId = dt.getPackageRef().getPackageId();
                    // Nếu là package, tên hiển thị chính nên là tên gói
                    mainItemName = "Gói: " + dt.getPackageRef().getPackageName();
                    categoryName = "Gói dịch vụ";
                } else if (dt.getService() != null) {
                    serviceId = dt.getService().getServiceId();
                    if (serviceId != null && packageId == null) {
                        // Nếu là dịch vụ lẻ (ko phải package), lấy tên dịch vụ làm main
                        mainItemName = dt.getService().getServiceName();
                        if (dt.getService().getCategory() != null) {
                            categoryName = dt.getService().getCategory().getCategoryName();
                        }
                    }
                }
            }

            // Tính giá trung bình hiển thị (nếu cần) hoặc lấy giá trị tổng
            if (totalQuantity.compareTo(BigDecimal.ZERO) > 0) {
                displayUnitPrice = txn.getAmount().abs().divide(totalQuantity, 2, java.math.RoundingMode.HALF_UP);
            }

        } else {
            // Fallback: Không có payment detail (Logic cũ xử lý UserVoucher snapshot)
            // ... (Giữ nguyên đoạn logic fallback 5. LOGIC HIỂN THỊ VÉ cũ của bạn ở đây) ...
            totalQuantity = BigDecimal.ONE; // Mặc định
        }

        // 4. Các logic phụ trợ (QR Limit, Amount Display) - Giữ nguyên
        boolean isTicket = false;
        String amountDisplay = String.format("%s%s", (direction.equals("IN") ? "+" : "-"), new java.text.DecimalFormat("#,###").format(txn.getAmount().abs()));
        Integer qrLimit = 0;
        Integer qrCount = 0;

        if (txn.getQrCode() != null) {
            QRCode qr = txn.getQrCode();
            qrLimit = qr.getUsageLimit();
            qrCount = qr.getUsageCount();
            if (qrLimit > 0) {
                isTicket = true;
                if (txn.getTransactionType() == TransactionType.REDEMPTION) {
                    // Nếu là Combo, hiển thị số vé bị trừ (thường là 1 vé cho cả combo)
                    // Hoặc hiển thị tổng món tuỳ nghiệp vụ. Ở đây lấy theo logic QrCodeService
                    amountDisplay = String.format("-%s Vé", qrCount);
                }
            }
        }

        // 5. Build Response
        return UserTransactionDetailResponse.builder()
                .transactionId(txn.getTransactionId())
                .transactionRef(txn.getTransactionRef())
                .title(txn.getTransactionType() == TransactionType.REDEMPTION ? "Sử dụng Voucher" : "Thanh toán")
                .amountDisplay(amountDisplay)
                .isTicketRedemption(isTicket)
                .amount(txn.getAmount())
                .status(txn.getStatus().name())
                .type(txn.getTransactionType().name())
                .description(txn.getDescription())
                .createdAt(txn.getCreatedAt())
                .direction(direction)

                // Main Info (Đã xử lý logic ưu tiên Package Name)
                .itemName(mainItemName)
                .itemImage(mainItemImage)
                .categoryName(categoryName)
                .quantity(totalQuantity)
                .priceAtPurchase(displayUnitPrice)
                .serviceId(serviceId)
                .packageId(packageId)

                // [MỚI] Trả về danh sách chi tiết các món
                .items(itemsList)

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