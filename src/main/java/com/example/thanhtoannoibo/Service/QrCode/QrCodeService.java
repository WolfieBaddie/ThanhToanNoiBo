package com.example.thanhtoannoibo.Service.QrCode;

import com.example.thanhtoannoibo.Common.*;
import com.example.thanhtoannoibo.DTO.Request.QrCode.GenerateQrRequest;
import com.example.thanhtoannoibo.DTO.Request.QrCode.ProcessQrRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.QrCode.ProcessQrResponse;
import com.example.thanhtoannoibo.DTO.Response.QrCode.QrResponse;
import com.example.thanhtoannoibo.DTO.Response.Transfer.QrCodeResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit; // Import UserCredit
import com.example.thanhtoannoibo.Entity.Order.Order;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.QrCode.QrScanLog;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucherDetail;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.CounterRepository;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository; // Import Repo
import com.example.thanhtoannoibo.Repository.Order.OrderRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrCodeRepository;
import com.example.thanhtoannoibo.Repository.QrCode.QrScanLogRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherDetailRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import com.example.thanhtoannoibo.Repository.Wallet.PaymentDetailRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QrCodeService {

    private final QrCodeRepository qrCodeRepository;
    private final TransactionRepository transactionRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserCreditRepository userCreditRepository; // NEW: Repo quản lý Xu
    private final AuthService authService;
    private final HttpServletRequest request;
    private final AuditLogRepository auditLogRepository;
    private final QrScanLogRepository qrScanLogRepository;
    private final CounterRepository counterRepository;
    private final AppServiceRepository appServiceRepository;
    private final OrderRepository orderRepository;
    private final PaymentDetailRepository paymentDetailRepository;
    private final AppPackageRepository appPackageRepository;
    private final UserVoucherDetailRepository userVoucherDetailRepository;
    private final NotificationService notificationService;

    @Transactional
    public QrResponse generateQr(GenerateQrRequest request, HttpServletRequest httpRequest) {
        User currentUser = authService.getCurrentUser(httpRequest);

        UserVoucher linkedVoucher = userVoucherRepository.findById(request.getVoucherId())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        // 1. Validate Quyền sở hữu
        if (!linkedVoucher.getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 2. Validate Trạng thái Voucher
        if (linkedVoucher.getStatus() != UserVoucherStatus.ACTIVE) {
            throw new AppException(ErrorCode.VOUCHER_USED_OR_EXPIRED);
        }

        // Check hạn sử dụng gốc của Voucher
        LocalDateTime now = LocalDateTime.now();
        if (linkedVoucher.getExpiresAt() != null && linkedVoucher.getExpiresAt().isBefore(now)) {
            throw new AppException(ErrorCode.VOUCHER_USED_OR_EXPIRED);
        }

        int quantityToUse = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;

        // Xác định loại Combo (Mặc định là SELECT_ONE / SINGLE vì dùng chung logic Ví Tổng)
        String comboType = "SELECT_ONE";
        if (linkedVoucher.getPackageId() != null) {
            AppPackage pkg = appPackageRepository.findById(linkedVoucher.getPackageId()).orElse(null);
            if (pkg != null && pkg.getComboType() != null) {
                comboType = pkg.getComboType();
            } else if (pkg != null) {
                comboType = "ALL_INCLUSIVE"; // Mặc định nếu package không set type
            }
        }

        int finalQrUsageLimit = quantityToUse;

        if ("ALL_INCLUSIVE".equals(comboType)) {

            List<UserVoucherDetail> details = userVoucherDetailRepository.findByUserVoucher(linkedVoucher);
            if (details.isEmpty()) {
                if (linkedVoucher.getTotalRemainingUsage() < quantityToUse)
                    throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
            } else {
                for (UserVoucherDetail detail : details) {
                    if (detail.getRemainingQuantity() < quantityToUse) {
                        throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
                    }
                }
            }


            int totalRealItemsLeft = linkedVoucher.getTotalRemainingUsage();
            int totalOwnedPackages = linkedVoucher.getQuantity();

            if (totalOwnedPackages > 0) {
                long calculatedLimit = ((long) totalRealItemsLeft * quantityToUse) / totalOwnedPackages;

                finalQrUsageLimit = (int) calculatedLimit;

                if (finalQrUsageLimit < quantityToUse && totalRealItemsLeft >= quantityToUse) {
                    finalQrUsageLimit = quantityToUse;
                }

                finalQrUsageLimit = Math.min(finalQrUsageLimit, totalRealItemsLeft);

            } else {
                finalQrUsageLimit = totalRealItemsLeft;
            }

        }
        else {
            if (linkedVoucher.getTotalRemainingUsage() < quantityToUse) {
                throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
            }

            finalQrUsageLimit = quantityToUse;
        }

        // 4. TÍNH TOÁN GIÁ TRỊ & HẠN DÙNG
        BigDecimal totalQrValue = linkedVoucher.getPriceAtPurchase().multiply(BigDecimal.valueOf(quantityToUse));

        LocalDateTime proposedQrExpiry = now.plusDays(1);
        if (linkedVoucher.getExpiresAt() != null && proposedQrExpiry.isAfter(linkedVoucher.getExpiresAt())) {
            proposedQrExpiry = linkedVoucher.getExpiresAt();
        }

        // 5. SINH MÃ CODE MỚI (Luôn sinh chuỗi mới để đảm bảo bảo mật, tránh người khác chụp lại mã cũ dùng tiếp)
        String newCodeString = "QR-V-" + System.currentTimeMillis() + "-" + RandomStringUtils.randomAlphanumeric(8).toUpperCase();

        // 6. [LOGIC MỚI] TÌM HOẶC TẠO (REUSE OR CREATE)
        QRCode qrCode;

        // Tìm QR cũ đã hết hạn của chính Voucher này
        Optional<QRCode> recyclableQr = qrCodeRepository.findFirstByPayerVoucherAndExpiresAtBefore(linkedVoucher, now);

        if (recyclableQr.isPresent()) {
            // A. TÁI SỬ DỤNG (UPDATE)
            qrCode = recyclableQr.get();
            log.info("Recycling expired QR Code ID: {}", qrCode.getQrId());

            qrCode.setCodeString(newCodeString);       // Cập nhật mã hiển thị mới
            qrCode.setAmount(totalQrValue);            // Cập nhật giá trị (đề phòng giá thay đổi)
            qrCode.setUsageLimit(finalQrUsageLimit);       // Cập nhật số lượng
            qrCode.setUsageCount(0);                   // Reset số lần dùng
            qrCode.setStatus(QrCodeStatus.ACTIVE);     // Kích hoạt lại
            qrCode.setExpiresAt(proposedQrExpiry);     // Gia hạn
            qrCode.setCreatedAt(now);                  // Làm mới ngày tạo (tuỳ chọn, để sort cho dễ)

            // Lưu ý: owner và payerVoucher giữ nguyên không đổi
        } else {
            // B. TẠO MỚI (CREATE)
            qrCode = QRCode.builder()
                    .codeString(newCodeString)
                    .type(QrCodeType.VOUCHER)
                    .owner(currentUser)
                    .payerVoucher(linkedVoucher)
                    .ownerType("USER")
                    .amount(totalQrValue)
                    .usageLimit(finalQrUsageLimit)
                    .usageCount(0)
                    .status(QrCodeStatus.ACTIVE)
                    .expiresAt(proposedQrExpiry)
                    .createdAt(now)
                    .build();
        }

        QRCode savedQr = qrCodeRepository.save(qrCode);

        // Log Audit (Vẫn log bình thường để tra soát lịch sử sinh mã)
        saveGenerateQrLog(currentUser, savedQr, linkedVoucher, totalQrValue);

        return mapToQrResponse(savedQr);
    }

    public QrResponse verifyQrContent(String qrCodeString, HttpServletRequest httpRequest) {
        User merchant = authService.getCurrentUser(httpRequest);

        // =========================================================================
        // 1. LẤY QUẦY CỦA MERCHANT
        // =========================================================================
        Counter merchantCounter = counterRepository.findByManagedBy_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        // =========================================================================
        // 2. TÌM VÀ KIỂM TRA HẠN SỬ DỤNG QR
        // =========================================================================
        QRCode qr = qrCodeRepository.findByCodeString(qrCodeString)
                .orElseThrow(() -> new AppException(ErrorCode.QR_CODE_NOT_FOUND));

        if (qr.getStatus() != QrCodeStatus.ACTIVE) {
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }
        if (qr.getExpiresAt() != null && qr.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }

        // =========================================================================
        // 3. VALIDATE QUYỀN PHỤC VỤ (CÓ THUỘC QUẦY KHÔNG)
        // =========================================================================
        UserVoucher voucher = qr.getPayerVoucher();
        boolean isValidForCounter = false;

        if (voucher.getServiceId() != null) {
            // [TRƯỜNG HỢP VÉ LẺ] - Check trực tiếp service
            AppService originService = appServiceRepository.findById(voucher.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

            if (originService.getCounter() != null &&
                    originService.getCounter().getCounterId().equals(merchantCounter.getCounterId())) {
                isValidForCounter = true;
            } else if (originService.getMasterServiceCode() != null) {
                Optional<AppService> matchingService = appServiceRepository.findByCounterAndMasterServiceCode(
                        merchantCounter.getCounterId(),
                        originService.getMasterServiceCode()
                );
                if (matchingService.isPresent()) {
                    isValidForCounter = true;
                }
            }
        } else if (voucher.getPackageId() != null) {
            // [TRƯỜNG HỢP COMBO] - Check trực tiếp counter_id của gói Package
            AppPackage pkg = appPackageRepository.findById(voucher.getPackageId()).orElse(null);

            if (pkg != null && pkg.getCounter() != null &&
                    pkg.getCounter().getCounterId().equals(merchantCounter.getCounterId())) {
                isValidForCounter = true;
            }
        }

        // Nếu không thuộc quầy quản lý -> Ném lỗi từ chối quét
        if (!isValidForCounter) {
            throw new AppException(ErrorCode.SERVICE_NOT_BELONG_TO_COUNTER);
        }

        // =========================================================================
        // 4. TRẢ VỀ KẾT QUẢ NẾU HỢP LỆ
        // =========================================================================
        return mapToQrResponse(qr);
    }

    /**
     * Xử lý giao dịch khi quét QR
     * Logic mới:
     * 1. Xác định người quét (Payer).
     * 2. Trừ Xu trong UserCredits của người quét.
     * 3. Cập nhật trạng thái UserVoucher (Item) thành ACTIVE/USED.
     */
    /**
     * Xử lý giao dịch khi quét QR (Cập nhật logic Confirm số lượng)
     */
    /**
     * Xử lý giao dịch khi quét QR
     * Cập nhật:
     * 1. Cập nhật đúng usageCount và usageLimit của QR (hỗ trợ QR dùng nhiều lần).
     * 2. Log giao dịch tập trung vào "Trừ số lượng" thay vì "Trừ tiền" để tránh User hiểu nhầm.
     */
    @Transactional(rollbackFor = Exception.class)
    public ProcessQrResponse processTransaction(ProcessQrRequest req, HttpServletRequest httpRequest) {
        User merchant = authService.getCurrentUser(httpRequest);

        // =========================================================================
        // 1. VALIDATE MERCHANT & QUẦY
        // =========================================================================
        Counter merchantCounter = counterRepository.findByManagedBy_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        // =========================================================================
        // 2. VALIDATE QR & LẤY THÔNG TIN VOUCHER
        // =========================================================================
        QRCode targetQr = qrCodeRepository.findActiveQRCodeForUpdate(req.getQrCode())
                .orElseThrow(() -> new AppException(ErrorCode.QR_CODE_NOT_FOUND));

        if (targetQr.getStatus() != QrCodeStatus.ACTIVE) {
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }
        if (targetQr.getExpiresAt() != null && targetQr.getExpiresAt().isBefore(LocalDateTime.now())) {
            targetQr.setStatus(QrCodeStatus.EXPIRED);
            qrCodeRepository.save(targetQr);
            throw new AppException(ErrorCode.QR_CODE_EXPIRED);
        }

        UserVoucher voucher = targetQr.getPayerVoucher();

        // =========================================================================
        // XÁC ĐỊNH SERVICE GỐC & QUYỀN PHỤC VỤ
        // =========================================================================
        AppService originService = null;
        if (req.getServiceId() != null) {
            originService = appServiceRepository.findById(req.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        } else if (voucher.getServiceId() != null) {
            originService = appServiceRepository.findById(voucher.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        }

        AppService actualServiceToProcess = null;
        if (originService != null) {
            boolean isDirectOwner = false;
            if (originService.getCounter() != null &&
                    originService.getCounter().getCounterId().equals(merchantCounter.getCounterId())) {
                isDirectOwner = true;
                actualServiceToProcess = originService;
            }

            if (!isDirectOwner) {
                if (originService.getMasterServiceCode() != null) {
                    Optional<AppService> matchingService = appServiceRepository.findByCounterAndMasterServiceCode(
                            merchantCounter.getCounterId(),
                            originService.getMasterServiceCode()
                    );
                    if (matchingService.isPresent()) {
                        actualServiceToProcess = matchingService.get();
                    } else {
                        throw new AppException(ErrorCode.SERVICE_NOT_BELONG_TO_COUNTER);
                    }
                } else {
                    throw new AppException(ErrorCode.COUNTER_NOT_FOUND);
                }
            }
        } else {
            if (voucher.getPackageId() == null) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
        }

        // =========================================================================
        // 3. CẬP NHẬT TRẠNG THÁI QR
        // =========================================================================
        int currentUsage = targetQr.getUsageCount();
        int remainingQrUsage = targetQr.getUsageLimit() - currentUsage;
        int qtyToProcess = 1;

        if (qtyToProcess > remainingQrUsage) {
            throw new AppException(ErrorCode.EXCEED_QR_LIMIT);
        }

        targetQr.setUsageCount(currentUsage + qtyToProcess);
        targetQr.setLastUsedAt(LocalDateTime.now());

        if (targetQr.getUsageCount() >= targetQr.getUsageLimit()) {
            targetQr.setStatus(QrCodeStatus.EXPIRED);
        }
        qrCodeRepository.save(targetQr);

        // =========================================================================
        // 4. CHUẨN BỊ DỮ LIỆU CỐT LÕI
        // =========================================================================
        AppPackage targetPackage = voucher.getPackageId() != null ? appPackageRepository.findById(voucher.getPackageId()).orElse(null) : null;
        AppService targetService = actualServiceToProcess;
        List<UserVoucherDetail> allDetails = userVoucherDetailRepository.findByUserVoucher(voucher);

        BigDecimal displayTransactionValue = BigDecimal.ZERO; // Tiền ghi sổ/Dashboard (Giá trị hàng hóa)
        BigDecimal actualWalletCredit = BigDecimal.ZERO;      // Tiền thực cộng ví Merchant
        List<PaymentDetail> paymentDetailsToSave = new ArrayList<>();
        List<UserVoucherDetail> affectedDetails = new ArrayList<>();
        List<ProcessQrRequest.QrItemRequest> requestedItems = req.getItems();

        // Lấy tổng số gói khách đã mua ban đầu để chia tỷ lệ
        int initialPackages = voucher.getQuantity() != null ? voucher.getQuantity() : 1;
        // Tính giá trị của 1 gói nguyên
        BigDecimal pricePerPack = voucher.getPriceAtPurchase().divide(BigDecimal.valueOf(initialPackages), 2, RoundingMode.HALF_UP);

        // =========================================================================
        // 5. TRỪ KHO & TÍNH TIỀN (LOGIC BEFORE - AFTER CHUẨN CHỈ)
        // =========================================================================
        if (voucher.getPackageId() == null) {
            // [TRƯỜNG HỢP VÉ LẺ]
            int qtyToDeduct = (req.getQuantity() != null) ? req.getQuantity() : 1;
            if (voucher.getTotalRemainingUsage() < qtyToDeduct) throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
            voucher.setTotalRemainingUsage(voucher.getTotalRemainingUsage() - qtyToDeduct);

            if (voucher.getServiceId() != null) {
                UserVoucherDetail detail = allDetails.stream().findFirst().orElseThrow();
                detail.setRemainingQuantity(detail.getRemainingQuantity() - qtyToDeduct);
                affectedDetails.add(detail);

                displayTransactionValue = voucher.getPriceAtPurchase().multiply(BigDecimal.valueOf(qtyToDeduct));
                actualWalletCredit = displayTransactionValue;

                paymentDetailsToSave.add(PaymentDetail.builder()
                        .service(detail.getService())
                        .quantity(BigDecimal.valueOf(qtyToDeduct))
                        .amount(displayTransactionValue)
                        .build());
            }
        } else {
            // [TRƯỜNG HỢP PACKAGE]
            String comboType = (targetPackage != null && targetPackage.getComboType() != null) ? targetPackage.getComboType() : "ALL_INCLUSIVE";

            if ("SELECT_ONE".equals(comboType)) {
                int qtyToDeduct = (requestedItems != null && !requestedItems.isEmpty()) ?
                        requestedItems.stream().mapToInt(ProcessQrRequest.QrItemRequest::getQuantity).sum() :
                        (req.getQuantity() != null ? req.getQuantity() : 1);

                if (voucher.getTotalRemainingUsage() < qtyToDeduct) throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
                voucher.setTotalRemainingUsage(voucher.getTotalRemainingUsage() - qtyToDeduct);

                displayTransactionValue = pricePerPack.multiply(BigDecimal.valueOf(qtyToDeduct));
                actualWalletCredit = displayTransactionValue;

                if (requestedItems != null && !requestedItems.isEmpty()) {
                    for (ProcessQrRequest.QrItemRequest item : requestedItems) {
                        // [ĐÃ FIX] Lọc trực tiếp từ allDetails trên RAM
                        UserVoucherDetail detail = allDetails.stream()
                                .filter(d -> d.getService().getServiceId().equals(item.getServiceId()))
                                .findFirst()
                                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

                        if (detail.getRemainingQuantity() < item.getQuantity()) throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
                        detail.setRemainingQuantity(detail.getRemainingQuantity() - item.getQuantity());
                        affectedDetails.add(detail);

                        BigDecimal itemLineAmount = pricePerPack.multiply(BigDecimal.valueOf(item.getQuantity()));

                        paymentDetailsToSave.add(PaymentDetail.builder()
                                .service(detail.getService())
                                .packageRef(targetPackage)
                                .quantity(BigDecimal.valueOf(item.getQuantity()))
                                .amount(itemLineAmount)
                                .build());
                    }
                }
            } else {
                // === [LOGIC ALL_INCLUSIVE - BEFORE vs AFTER THEO LỆNH CHỦ NHÂN] ===

                // BƯỚC 1: Đếm số gói đã lấy TRỌN BỘ TRƯỚC KHI xử lý transaction này
                int completedBefore = calculateCompletedPacks(initialPackages, allDetails);
                int packsPaid = 0;

                if (requestedItems != null && !requestedItems.isEmpty()) {
                    // BƯỚC 2: Trừ kho từng món và tạo Hóa đơn lưu giá thành (Nominal Value)
                    for (ProcessQrRequest.QrItemRequest item : requestedItems) {
                        // [ĐÃ FIX] Lấy object tham chiếu TRỰC TIẾP từ allDetails, KHÔNG QUERY DB LẠI
                        UserVoucherDetail detail = allDetails.stream()
                                .filter(d -> d.getService().getServiceId().equals(item.getServiceId()))
                                .findFirst()
                                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

                        if (detail.getRemainingQuantity() < item.getQuantity()) throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
                        // Cập nhật giá trị này sẽ ảnh hưởng trực tiếp đến allDetails
                        detail.setRemainingQuantity(detail.getRemainingQuantity() - item.getQuantity());
                        affectedDetails.add(detail);

                        // Lấy giá gốc của món để hiện Dashboard (1 Phở -> Lưu giá thành)
                        AppService s = detail.getService();
                        BigDecimal unitPrice = s.getUnitPrice() != null ? s.getUnitPrice() : BigDecimal.ZERO;
                        BigDecimal itemNominalValue = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

                        displayTransactionValue = displayTransactionValue.add(itemNominalValue);

                        paymentDetailsToSave.add(PaymentDetail.builder()
                                .service(s)
                                .packageRef(targetPackage)
                                .quantity(BigDecimal.valueOf(item.getQuantity()))
                                .amount(itemNominalValue)
                                .build());
                    }

                    // BƯỚC 3: Đếm số gói đã lấy TRỌN BỘ SAU KHI xử lý xong (Lúc này allDetails đã được trừ)
                    int completedAfter = calculateCompletedPacks(initialPackages, allDetails);

                    // BƯỚC 4: Số gói "chính thức bị bóc xong" trong lượt quét này
                    packsPaid = completedAfter - completedBefore;

                    // Cập nhật số gói còn lại trên App (Chỉ trừ đi khi lấy xong đủ bộ)
                    voucher.setTotalRemainingUsage(Math.max(0, voucher.getTotalRemainingUsage() - packsPaid));

                } else {
                    // Xử lý khi Frontend gửi nguyên số lượng gói
                    packsPaid = (req.getQuantity() != null) ? req.getQuantity() : 1;
                    for (UserVoucherDetail d : allDetails) {
                        int initialPerPack = d.getInitialQuantity() / initialPackages;
                        int qtyToDeduct = initialPerPack * packsPaid;
                        if (d.getRemainingQuantity() < qtyToDeduct) throw new AppException(ErrorCode.INSUFFICIENT_VOUCHER_QUANTITY);
                        d.setRemainingQuantity(d.getRemainingQuantity() - qtyToDeduct);
                        affectedDetails.add(d);

                        AppService s = d.getService();
                        BigDecimal unitPrice = s.getUnitPrice() != null ? s.getUnitPrice() : BigDecimal.ZERO;
                        BigDecimal itemNominalValue = unitPrice.multiply(BigDecimal.valueOf(qtyToDeduct));
                        displayTransactionValue = displayTransactionValue.add(itemNominalValue);

                        paymentDetailsToSave.add(PaymentDetail.builder()
                                .service(s)
                                .packageRef(targetPackage)
                                .quantity(BigDecimal.valueOf(qtyToDeduct))
                                .amount(itemNominalValue)
                                .build());
                    }
                    voucher.setTotalRemainingUsage(Math.max(0, voucher.getTotalRemainingUsage() - packsPaid));
                }

                // BƯỚC 5: Tính TIỀN THỰC CỘNG VÀO VÍ (Merchant Payout)
                if (packsPaid > 0) {
                    actualWalletCredit = pricePerPack.multiply(BigDecimal.valueOf(packsPaid));
                } else {
                    actualWalletCredit = BigDecimal.ZERO;
                }
            }
        }

        // Lưu trạng thái Voucher (Đánh dấu USED khi dùng cạn sạch tất cả detail)
        boolean isFullyUsed = (voucher.getPackageId() != null) ? allDetails.stream().allMatch(d -> d.getRemainingQuantity() == 0) : voucher.getTotalRemainingUsage() == 0;
        if (isFullyUsed) {
            voucher.setStatus(UserVoucherStatus.USED);
            voucher.setUsedAt(LocalDateTime.now());
            voucher.setTotalRemainingUsage(0);
        }
        userVoucherRepository.save(voucher);
        if (!affectedDetails.isEmpty()) userVoucherDetailRepository.saveAll(affectedDetails);

        // =========================================================================
        // 6. CỘNG TIỀN MERCHANT (CỘNG TIỀN THỰC - actualWalletCredit)
        // =========================================================================
        UserCredit merchantCredit = userCreditRepository.findWithLockByUser_UserId(merchant.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.CREDIT_NOT_FOUND));

        if (actualWalletCredit.compareTo(BigDecimal.ZERO) > 0) {
            merchantCredit.setBalance(merchantCredit.getBalance().add(actualWalletCredit));
            userCreditRepository.save(merchantCredit);
        }

        // =========================================================================
        // 7. TẠO ORDER & TRANSACTION (LƯU GIÁ THÀNH ĐỂ XEM - displayTransactionValue)
        // =========================================================================
        String transactionDesc = req.getDescription();
        if (transactionDesc == null || transactionDesc.isEmpty()) {
            StringBuilder sb = new StringBuilder("Xuất: ");
            for (UserVoucherDetail d : affectedDetails) {
                int used = requestedItems != null ? requestedItems.stream().filter(i -> i.getServiceId().equals(d.getService().getServiceId())).mapToInt(ProcessQrRequest.QrItemRequest::getQuantity).sum() : 0;
                if (used == 0 && targetPackage == null) used = req.getQuantity() != null ? req.getQuantity() : 1;
                if (used > 0) sb.append(used).append(" x ").append(d.getService().getServiceName()).append(", ");
            }
            if (sb.length() > 2) sb.setLength(sb.length() - 2);

            // Chú thích cho Merchant hiểu vì sao sổ sách chênh với tiền ví
            if (actualWalletCredit.compareTo(displayTransactionValue) != 0) {
                if (actualWalletCredit.compareTo(BigDecimal.ZERO) == 0) {
                    sb.append(" (Lấy món lẻ của gói - Đã thanh toán ví trước đó)");
                } else {
                    sb.append(" (Thực nhận ví: ").append(actualWalletCredit).append("đ)");
                }
            }
            transactionDesc = sb.toString();
        }

        Order order = Order.builder()
                .user(voucher.getOwner())
                .serviceEntity(targetService)
                .packageEntity(targetPackage)
                .orderRef("ORD-QR-" + System.currentTimeMillis())
                .amountPaid(displayTransactionValue)
                .paymentMethod(OrderMethod.QR_VOUCHER)
                .paymentStatus(PaymentStatus.PAID)
                .completedAt(LocalDateTime.now())
                .build();
        orderRepository.save(order);

        // Lưu Tiền Ví (actualWalletCredit) vào bảng Transaction để không bị lỗi Dashboard
        Transaction mainTxn = Transaction.builder()
                .transactionRef("TXN-" + order.getOrderRef())
                .qrCode(targetQr)
                .transactionType(TransactionType.REDEMPTION)
                .payee(merchant)
                .credit(merchantCredit)
                .amount(actualWalletCredit)
                .balanceAfter(merchantCredit.getBalance())
                .status(TransactionStatus.COMPLETED)
                .description(transactionDesc)
                .createdAt(LocalDateTime.now())
                .build();

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("counter_name", merchantCounter.getCounterName());
        metadata.put("merchant_id", merchant.getUserId().toString());
        metadata.put("type", "VOUCHER_REDEMPTION");
        metadata.put("actual_credit_added", actualWalletCredit); // Dev dễ theo dõi chênh lệch
        if (targetPackage != null) metadata.put("package_name", targetPackage.getPackageName());
        mainTxn.setMetadata(metadata);
        transactionRepository.save(mainTxn);

        // Lưu Payment Details
        if (!paymentDetailsToSave.isEmpty()) {
            for (PaymentDetail pd : paymentDetailsToSave) {
                pd.setTransaction(mainTxn);
            }
            paymentDetailRepository.saveAll(paymentDetailsToSave);
        }

        // =========================================================================
        // 8. LOGS & NOTIFICATION
        // =========================================================================
        saveAuditLogForTransaction(merchant, mainTxn, voucher, BigDecimal.ZERO, merchantCounter);
        saveQrScanLog(targetQr, merchant, "SUCCESS", transactionDesc, req.getImageUrl());

        try {
            notificationService.createNotification(voucher.getOwner(), "Sử dụng thành công",
                    "Bạn đã dùng: " + transactionDesc, "SUCCESS", "/history");
            notificationService.createNotification(merchant, "Giao dịch thành công",
                    "Đã xuất hàng: " + transactionDesc, "SUCCESS", "/merchant/history");
        } catch (Exception e) { log.error("Notif Error", e); }

        return ProcessQrResponse.builder()
                .transactionId(mainTxn.getTransactionId())
                .transactionRef(mainTxn.getTransactionRef())
                .paidAmount(actualWalletCredit)
                .status("SUCCESS")
                .message("Giao dịch thành công. " + transactionDesc)
                .build();
    }

    // =========================================================================
    // HÀM PHỤ TRỢ MỚI: TÍNH SỐ GÓI "ĐÃ HOÀN THÀNH" DỰA TRÊN SỐ LƯỢNG ĐÃ LẤY
    // =========================================================================
    private int calculateCompletedPacks(int initialPackages, List<UserVoucherDetail> details) {
        if (initialPackages <= 0) return 0;
        int completedPacks = Integer.MAX_VALUE;

        for (UserVoucherDetail d : details) {
            int initialPerPack = d.getInitialQuantity() / initialPackages;
            if (initialPerPack == 0) continue;

            // Tính xem khách ĐÃ LẤY bao nhiêu món này
            int taken = d.getInitialQuantity() - d.getRemainingQuantity();

            // Quy đổi ra số "Bộ trọn vẹn" có thể ghép được từ món này
            int packsForThisItem = taken / initialPerPack;

            // Lấy Minimum (Chỉ khi tất cả các món trong gói đều đã bị lấy thì mới tính là 1 gói hoàn thành)
            if (packsForThisItem < completedPacks) {
                completedPacks = packsForThisItem;
            }
        }
        return completedPacks == Integer.MAX_VALUE ? 0 : completedPacks;
    }

    private void processRefund(User owner, BigDecimal refundAmount, String voucherCode) {
        UserCredit userWallet = userCreditRepository.findWithLockByUser_UserId(owner.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        userWallet.setBalance(userWallet.getBalance().add(refundAmount));
        userCreditRepository.save(userWallet);

        // Ghi Transaction Refund
        Transaction refundTxn = Transaction.builder()
                .credit(userWallet)
                .transactionRef("TXN-REFUND-" + System.currentTimeMillis())
                .transactionType(TransactionType.REFUND)
                .amount(refundAmount)
                .balanceAfter(userWallet.getBalance())
                .status(TransactionStatus.COMPLETED)
                .description("Hoàn tiền thừa từ voucher: " + voucherCode)
                .createdAt(LocalDateTime.now())
                .build();
        transactionRepository.save(refundTxn);
    }

    private void savePaymentDetail(Transaction txn, int quantity, BigDecimal amount) {
        PaymentDetail detail = PaymentDetail.builder()
                .transaction(txn)
                .quantity(BigDecimal.valueOf(quantity))
                .amount(amount)
                .createdAt(LocalDateTime.now())
                .build();
        paymentDetailRepository.save(detail);
    }

    private void saveQrScanLog(QRCode qr, User scannedBy, String result, String reason, String imageUrl) {
        try {
            String ip = (request != null) ? request.getRemoteAddr() : "UNKNOWN";
            QrScanLog log = QrScanLog.builder()
                    .qrCode(qr)
                    .scannedBy(scannedBy)
                    .scanResult(result)
                    .failureReason(reason)
                    .ipAddress(ip)
                    .imageUrl(imageUrl)
                    .createdAt(LocalDateTime.now())
                    .build();
            qrScanLogRepository.save(log);
        } catch (Exception e) {
            log.error("Log Error", e);
        }
    }

    private void saveAuditLogForTransaction(User merchant, Transaction txn, UserVoucher voucher, BigDecimal refund, Counter counter) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("voucher_code", voucher.getVoucherCode());
            details.put("refund_amount", refund);
            details.put("counter_code", counter.getCounterCode());
            details.put("transaction_ref", txn.getTransactionRef()); // Nên thêm ref để dễ tìm

            AuditLog audit = AuditLog.builder()
                    .user(merchant) // Người thực hiện hành động (Merchant)
                    .action("PROCESS_QR")
                    .entityType("TRANSACTION")
                    .entityId(txn.getTransactionId())
                    .details(details)
                    .ipAddress(request.getRemoteAddr())
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(audit);
        } catch (Exception e) {
            log.error("Audit Error", e); // Không throw lỗi để tránh rollback transaction chính
        }
    }

    private QrResponse mapToQrResponse(QRCode qr) {
        UserVoucher voucher = qr.getPayerVoucher();
        String voucherCode = (voucher != null) ? voucher.getVoucherCode() : null;
        UUID voucherId = (voucher != null) ? voucher.getVoucherId() : null;
        User owner = qr.getOwner();
        Integer currentTotalUsage = 0;
        String comboType = "ALL_INCLUSIVE";
        String packageName = null;
        List<ServiceResponse> includedServices = new ArrayList<>();

        if (voucher != null) {
            currentTotalUsage = voucher.getTotalRemainingUsage();
            List<UserVoucherDetail> details = userVoucherDetailRepository.findByUserVoucher(voucher);

            if (voucher.getPackageId() != null) {
                AppPackage pkg = appPackageRepository.findById(voucher.getPackageId()).orElse(null);
                if (pkg != null) {
                    comboType = pkg.getComboType();
                    packageName = pkg.getPackageName();
                }
            } else {
                comboType = "SELECT_ONE";
                packageName = voucher.getServiceName();
            }
            if (details != null && !details.isEmpty()) {
                // Map từ UserVoucherDetail sang ServiceResponse
                includedServices = details.stream()
                        .map(this::mapDetailToResponse) // Gọi hàm mapper mới viết bên dưới
                        .collect(Collectors.toList());
            }
            // Fallback: Nếu bảng detail chưa có dữ liệu (do migrate thiếu), giữ lại logic cũ hoặc trả về rỗng
        }

        return QrResponse.builder()
                .qrId(qr.getQrId())
                .codeString(qr.getCodeString()) // Lưu ý: Entity của bạn là code hay codeString? Code bạn đưa là codeString
                .type(qr.getType().name())
                .status(qr.getStatus().name())
                .creditAmount(qr.getAmount()) // Nếu voucher thì cái này null, ví thì có value

                .voucherId(voucherId)
                .voucherCode(voucherCode)

                .expiresAt(qr.getExpiresAt())
                .createdAt(qr.getCreatedAt())

                .userId(owner != null ? owner.getUserId() : null)
                .fullName(owner != null ? owner.getFullName() : "Khách vãng lai")
                .userType(owner != null ? owner.getUserType().name() : null)
                .email(owner != null ? owner.getEmail() : null)
                .phoneNumber(owner != null ? owner.getPhoneNumber() : "")
                .imageUrl(owner != null ? owner.getImageUrl() : null)

                .includedServices(includedServices) // Danh sách này giờ đã có remainingQuantity
                .usageLimit(qr.getUsageLimit())
                .totalRemainingUsage(currentTotalUsage)
                .comboType(comboType)
                .packageName(packageName)
                .build();
    }

    // [HÀM MỚI] Map từ chi tiết voucher (Có số lượng)
    private ServiceResponse mapDetailToResponse(UserVoucherDetail detail) {
        // detail.getService() sẽ lấy thông tin tĩnh (Tên, ảnh gốc)
        AppService service = detail.getService();

        return ServiceResponse.builder()
                .serviceId(service.getServiceId())
                .serviceName(service.getServiceName())
                .imageUrl(service.getImageUrl())
                // Giá này là giá phân bổ hoặc giá gốc, tùy logic bạn muốn hiện cho Merchant
                .unitPrice(detail.getAllocatedPrice() != null ? detail.getAllocatedPrice() : service.getUnitPrice())

                // [QUAN TRỌNG] Hai thông tin Merchant cần nhất:
                .detailId(detail.getDetailId())             // Để gửi lên khi trừ
                .remainingQuantity(detail.getRemainingQuantity()) // Để biết khách còn bao nhiêu
                .build();
    }

    private void saveGenerateQrLog(User user, QRCode qr, UserVoucher voucher, BigDecimal credit) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("qr_code", qr.getCodeString());
            details.put("credit_amount", credit); // Log rõ là credit_amount
            details.put("voucher_code", voucher.getVoucherCode());
            details.put("expires_at", qr.getExpiresAt());

            // Tự build AuditLog tại đây hoặc gọi hàm chung nếu có
            // (Code mẫu giả định gọi hàm saveAuditLog chung hoặc tự build)
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

}