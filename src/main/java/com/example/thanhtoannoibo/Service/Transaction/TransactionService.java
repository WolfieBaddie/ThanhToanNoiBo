package com.example.thanhtoannoibo.Service.Transaction;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.TransactionStatus;
import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.DTO.Request.Transaction.TransactionFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Transaction.*;
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
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

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

        boolean isMerchant = currentUser.getRoles().stream()
                .anyMatch(r -> r.getRoleCode().equalsIgnoreCase("MERCHANT"));

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (isMerchant) {
                Join<Transaction, User> payeeJoin = root.join("payee", JoinType.LEFT);
                predicates.add(cb.equal(payeeJoin.get("userId"), currentUser.getUserId()));
            } else {
                Join<Transaction, UserCredit> creditJoin = root.join("credit", JoinType.LEFT);
                Join<UserCredit, User> creditUserJoin = creditJoin.join("user", JoinType.LEFT);

                Join<Transaction, QRCode> qrJoin = root.join("qrCode", JoinType.LEFT);
                Join<QRCode, User> qrOwnerJoin = qrJoin.join("owner", JoinType.LEFT);

                Predicate isMyCredit = cb.equal(creditUserJoin.get("userId"), currentUser.getUserId());
                Predicate isMyQr = cb.equal(qrOwnerJoin.get("userId"), currentUser.getUserId());

                predicates.add(cb.or(isMyCredit, isMyQr));
            }

            predicates.add(cb.equal(root.get("status"), TransactionStatus.COMPLETED));

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

    public TransactionDetailResponse getTransactionDetail(UUID transactionId, UUID currentUserId) {
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        String direction = "OUT";
        if (txn.getPayee() != null && txn.getPayee().getUserId().equals(currentUserId)) {
            direction = "IN";
        }

        List<PaymentDetail> details = paymentDetailRepository.findAllByTransaction_TransactionId(transactionId);

        String itemName = txn.getDescription();
        String itemImage = null;
        String categoryName = "Giao dịch";
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal unitPrice = txn.getAmount().abs();

        UUID serviceId = null;
        UUID packageId = null;

        List<TransactionDetailResponse.TransactionItemDetail> itemsList = new ArrayList<>();

        if (details != null && !details.isEmpty()) {
            for (PaymentDetail detail : details) {
                String subName = "Sản phẩm";
                String subImage = null;

                if (detail.getService() != null) {
                    subName = detail.getService().getServiceName();
                    subImage = detail.getService().getImageUrl();
                    if (itemImage == null) itemImage = subImage;
                }

                totalQuantity = totalQuantity.add(detail.getQuantity());

                itemsList.add(TransactionDetailResponse.TransactionItemDetail.builder()
                        .itemName(subName)
                        .itemImage(subImage)
                        .quantity(detail.getQuantity())
                        .unitPrice(detail.getAmount())
                        .build());

                if (detail.getPackageRef() != null) {
                    itemName = "Gói: " + detail.getPackageRef().getPackageName();
                    packageId = detail.getPackageRef().getPackageId();
                    categoryName = "Gói dịch vụ";
                } else if (detail.getService() != null) {
                    if (packageId == null) {
                        itemName = detail.getService().getServiceName();
                        serviceId = detail.getService().getServiceId();
                        categoryName = detail.getService().getCategory() != null
                                ? detail.getService().getCategory().getCategoryName()
                                : "Dịch vụ";
                    }
                }
            }

            if (totalQuantity.compareTo(BigDecimal.ZERO) > 0) {
                unitPrice = txn.getAmount().abs().divide(totalQuantity, 2, java.math.RoundingMode.HALF_UP);
            }
        } else {
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
                .itemName(itemName)
                .itemImage(itemImage)
                .categoryName(categoryName)
                .quantity(totalQuantity)
                .priceAtPurchase(unitPrice)
                .serviceId(serviceId)
                .packageId(packageId)
                .items(itemsList)
                .partnerInfo(mapPartnerInfo(txn, currentUserId))
                .evidenceImage(getEvidenceImage(txn))
                .build();
    }

    // ... (Các hàm thống kê giữ nguyên) ...
    public MerchantStatsResponse getMerchantStats(UUID merchantId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfToday = now.toLocalDate().atTime(23, 59, 59);
        LocalDateTime startOfYesterday = startOfToday.minusDays(1);
        LocalDateTime endOfYesterday = endOfToday.minusDays(1);

        BigDecimal todayRev = transactionRepository.sumRevenueByDateRange(merchantId, startOfToday, endOfToday);
        BigDecimal yesterdayRev = transactionRepository.sumRevenueByDateRange(merchantId, startOfYesterday, endOfYesterday);

        double growth = 0.0;
        if (yesterdayRev.compareTo(BigDecimal.ZERO) > 0) {
            growth = todayRev.subtract(yesterdayRev)
                    .divide(yesterdayRev, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        } else if (todayRev.compareTo(BigDecimal.ZERO) > 0) {
            growth = 100.0;
        }

        long todayOrders = transactionRepository.countOrdersByDateRange(merchantId, startOfToday, endOfToday);
        BigDecimal avgOrder = BigDecimal.ZERO;
        if (todayOrders > 0) {
            avgOrder = todayRev.divide(BigDecimal.valueOf(todayOrders), 0, RoundingMode.HALF_UP);
        }

        return MerchantStatsResponse.builder()
                .todayRevenue(todayRev)
                .yesterdayRevenue(yesterdayRev)
                .revenueGrowth(growth)
                .orderCount(todayOrders)
                .avgOrderValue(avgOrder)
                .build();
    }

    public DashboardChartResponse getDashboardChart(UUID merchantId, String period) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate;

        if ("Month".equalsIgnoreCase(period)) {
            startDate = endDate.minusDays(30);
        } else {
            startDate = endDate.minusDays(6);
        }

        List<Object[]> rawRevenue = transactionRepository.getDailyRevenueStats(merchantId, startDate, endDate);
        List<Object[]> rawTopItems = paymentDetailRepository.getTopSellingItems(merchantId, startDate, endDate);

        List<DashboardChartResponse.ChartDataPoint> chartData = new ArrayList<>();
        Map<String, BigDecimal> revenueMap = new HashMap<>();

        for (Object[] row : rawRevenue) {
            String dateStr = row[0].toString();
            BigDecimal amount = (BigDecimal) row[1];
            revenueMap.put(dateStr, amount);
        }

        LocalDateTime current = startDate;
        while (!current.isAfter(endDate)) {
            String dateKey = current.toLocalDate().toString();
            BigDecimal amount = revenueMap.getOrDefault(dateKey, BigDecimal.ZERO);
            String dayName = getDayName(current);
            chartData.add(new DashboardChartResponse.ChartDataPoint(dateKey, dayName, amount));
            current = current.plusDays(1);
        }

        List<DashboardChartResponse.TopItemData> topItems = new ArrayList<>();
        for (Object[] row : rawTopItems) {
            String name = (String) row[0];
            BigDecimal count = (BigDecimal) row[1];
            topItems.add(new DashboardChartResponse.TopItemData(name, count.longValue(), "up"));
        }

        return DashboardChartResponse.builder()
                .revenueChart(chartData)
                .topItems(topItems)
                .build();
    }

    private String getDayName(LocalDateTime date) {
        int dayOfWeek = date.getDayOfWeek().getValue();
        if (dayOfWeek == 7) return "CN";
        return "T" + (dayOfWeek + 1);
    }

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

    @Transactional
    public void completeTransaction(UUID transactionId, TransactionStatus status, BigDecimal newBalance) {
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        txn.setStatus(status);
        if (status == TransactionStatus.COMPLETED) {
            txn.setBalanceAfter(newBalance);
        }
        transactionRepository.save(txn);
    }

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

        TransactionPartnerInfo partnerInfo = mapPartnerInfo(entity, currentUserId);

        BigDecimal totalQuantity = BigDecimal.ZERO;
        List<PaymentDetail> details = paymentDetailRepository.findAllByTransaction_TransactionId(entity.getTransactionId());

        if (details != null && !details.isEmpty()) {
            for (PaymentDetail dt : details) {
                totalQuantity = totalQuantity.add(dt.getQuantity());
            }
        } else {
            // Nếu không có detail (VD: Nạp tiền), mặc định quantity là 1
            totalQuantity = BigDecimal.ONE;
        }

        return TransactionResponse.builder()
                .transactionId(entity.getTransactionId())
                .transactionRef(entity.getTransactionRef())
                .title(displayTitle)
                .description(entity.getDescription())
                .amount(entity.getAmount().abs())
                .quantity(totalQuantity) // [ĐÃ SỬA] Sử dụng quantity tính toán được
                .direction(direction)
                .status(entity.getStatus().name())
                .transactionType(entity.getTransactionType().name())
                .createdAt(entity.getCreatedAt())
                .partnerInfo(partnerInfo)
                .build();
    }

    @Transactional
    public UserTransactionDetailResponse getUserTransactionDetail(UUID transactionId, UUID userId) {
        // 1. Tìm Transaction
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // Validate owner
        boolean isOwner = false;
        if (txn.getCredit() != null && txn.getCredit().getUser().getUserId().equals(userId)) isOwner = true;
        if (txn.getQrCode() != null && txn.getQrCode().getOwner().getUserId().equals(userId)) isOwner = true;
        if (txn.getPayee() != null && txn.getPayee().getUserId().equals(userId)) isOwner = true;
        if (!isOwner) throw new AppException(ErrorCode.UNAUTHORIZED);

        String direction = (txn.getPayee() != null && txn.getPayee().getUserId().equals(userId)) || txn.getTransactionType() == TransactionType.DEPOSIT ? "IN" : "OUT";

        List<PaymentDetail> details = paymentDetailRepository.findAllByTransaction_TransactionId(transactionId);

        String mainItemName = txn.getDescription();
        String mainItemImage = null;
        String categoryName = "Giao dịch";
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal displayUnitPrice = BigDecimal.ZERO;

        UUID serviceId = null;
        UUID packageId = null;

        List<UserTransactionDetailResponse.TransactionItemDetail> itemsList = new ArrayList<>();

        if (details != null && !details.isEmpty()) {
            for (PaymentDetail dt : details) {
                String subName = "Sản phẩm";
                String subImage = null;

                if (dt.getService() != null) {
                    subName = dt.getService().getServiceName();
                    subImage = dt.getService().getImageUrl();
                    if (mainItemImage == null) mainItemImage = subImage;
                }

                totalQuantity = totalQuantity.add(dt.getQuantity());

                itemsList.add(UserTransactionDetailResponse.TransactionItemDetail.builder()
                        .itemName(subName)
                        .itemImage(subImage)
                        .quantity(dt.getQuantity())
                        .unitPrice(dt.getAmount())
                        .build());

                // [LOGIC ĐÃ SỬA]: Chỉ ghi đè mainItemName nếu KHÔNG phải là BUY_VOUCHER
                // Để giữ lại Description (ví dụ: "Mua 3 combo...") của BUY_VOUCHER
                if (txn.getTransactionType() != TransactionType.BUY_VOUCHER) {
                    if (dt.getPackageRef() != null) {
                        packageId = dt.getPackageRef().getPackageId();
                        mainItemName = "Gói: " + dt.getPackageRef().getPackageName();
                        categoryName = "Gói dịch vụ";
                    } else if (dt.getService() != null) {
                        serviceId = dt.getService().getServiceId();
                        if (serviceId != null && packageId == null) {
                            mainItemName = dt.getService().getServiceName();
                            if (dt.getService().getCategory() != null) {
                                categoryName = dt.getService().getCategory().getCategoryName();
                            }
                        }
                    }
                } else {
                    // Nếu là BUY_VOUCHER, vẫn lấy package info nhưng giữ mainItemName từ description
                    if (dt.getPackageRef() != null) {
                        packageId = dt.getPackageRef().getPackageId();
                        categoryName = "Gói dịch vụ";
                    }
                }
            }

            if (totalQuantity.compareTo(BigDecimal.ZERO) > 0) {
                displayUnitPrice = txn.getAmount().abs().divide(totalQuantity, 2, java.math.RoundingMode.HALF_UP);
            }
        } else {
            totalQuantity = BigDecimal.ONE;
        }

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
                    // [FIX LỖI -0 VÉ]: Dùng totalQuantity của giao dịch thay vì qrCount (tổng sử dụng)
                    amountDisplay = String.format("-%s Vé", totalQuantity.intValue());
                }
            }
        }

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
                .itemName(mainItemName)
                .itemImage(mainItemImage)
                .categoryName(categoryName)
                .quantity(totalQuantity)
                .priceAtPurchase(displayUnitPrice)
                .serviceId(serviceId)
                .packageId(packageId)
                .items(itemsList)
                .partnerInfo(mapPartnerInfo(txn, userId))
                .evidenceImage(getEvidenceImage(txn))
                .qrId(txn.getQrCode() != null ? txn.getQrCode().getQrId() : null)
                .qrUsageLimit(qrLimit)
                .qrUsageCount(qrCount)
                .build();
    }

    private TransactionPartnerInfo mapPartnerInfo(Transaction txn, UUID currentUserId) {
        if (txn.getQrCode() == null || txn.getQrCode().getOwner() == null) {
            return null;
        }

        User payer = txn.getQrCode().getOwner();
        User payee = txn.getPayee();

        if (payee != null && payee.getUserId().equals(currentUserId)) {
            return TransactionPartnerInfo.builder()
                    .partnerId(payer.getUserId())
                    .partnerName(payer.getFullName())
                    .partnerImage(payer.getImageUrl())
                    .partnerType("CUSTOMER")
                    .subTitle(payer.getPhoneNumber())
                    .build();
        } else {
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