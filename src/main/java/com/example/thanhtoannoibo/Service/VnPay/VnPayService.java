package com.example.thanhtoannoibo.Service.VnPay;

import com.example.thanhtoannoibo.Config.VnPayConfig;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentRequest;
import com.example.thanhtoannoibo.DTO.Response.Payment.VnPayResponse;
import com.example.thanhtoannoibo.Util.VnPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VnPayService {

    private final VnPayConfig vnPayConfig;
    private final VnPayUtil vnPayUtil;

    private static final ZoneId VN_TZ = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNP_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    public VnPayResponse createVnPayPayment(HttpServletRequest request, PaymentRequest depositRequest) {
        if (depositRequest == null || depositRequest.getAmount() == null) {
            throw new IllegalArgumentException("amount is required");
        }
        if (depositRequest.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("amount must be > 0");
        }

        // Spec: VND * 100
        long amount100 = depositRequest.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        // txnRef tạo 1 lần duy nhất
        String txnRef = generateTxnRef();

        String orderInfo = "Thanh toan don hang:" + txnRef;
        String ipAddress = vnPayUtil.getIpAddress(request);

        Map<String, String> vnpParams = buildPaymentParams(
                txnRef,
                String.valueOf(amount100),
                orderInfo,
                depositRequest.getBankCode(),
                depositRequest.getLanguage(),
                ipAddress
        );

        String paymentUrl = buildPaymentUrl(vnpParams);

        return VnPayResponse.builder()
                .paymentUrl(paymentUrl)
                .txnRef(txnRef)
                .build();
    }

    /**
     *  1 = success, 0 = failed, -1 = invalid signature / thiếu data
     */
    public int verifyPayment(Map<String, String> queryParams) {
        if (queryParams == null || queryParams.isEmpty()) return -1;

        String receivedHash = queryParams.get("vnp_SecureHash");
        if (receivedHash == null || receivedHash.isBlank()) return -1;

        // Không mutate map đầu vào
        Map<String, String> params = new HashMap<>(queryParams);
        params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        // (a) hashData KHÔNG encode value
        String hashData = vnPayUtil.buildHashData(params);
        String expectedHash = vnPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);

        if (!expectedHash.equalsIgnoreCase(receivedHash)) {
            return -1;
        }

        return "00".equals(params.get("vnp_TransactionStatus")) ? 1 : 0;
    }

    // ================== Private business helpers ==================

    private Map<String, String> buildPaymentParams(
            String txnRef,
            String amount,
            String orderInfo,
            String bankCode,
            String locale,
            String ipAddress
    ) {
        Map<String, String> vnpParams = new HashMap<>();

        vnpParams.put("vnp_Version", vnPayConfig.getVersion());
        vnpParams.put("vnp_Command", vnPayConfig.getCommand());
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", amount);
        vnpParams.put("vnp_CurrCode", vnPayConfig.getCurrCode());

        if (bankCode != null && !bankCode.isBlank()) {
            vnpParams.put("vnp_BankCode", bankCode.trim());
        }

        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other"); // TODO: map đúng orderType nếu cần

        vnpParams.put("vnp_Locale", (locale == null || locale.isBlank()) ? "vn" : locale.trim());
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", ipAddress);

        ZonedDateTime now = ZonedDateTime.now(VN_TZ);
        vnpParams.put("vnp_CreateDate", now.format(VNP_DATE_FMT));
        vnpParams.put("vnp_ExpireDate", now.plusMinutes(15).format(VNP_DATE_FMT));

        return vnpParams;
    }

    private String buildPaymentUrl(Map<String, String> vnpParams) {
        // (a) Theo Techspec: hashData KHÔNG encode value, chỉ queryString mới encode.
        return vnPayUtil.buildSignedPaymentUrl(vnPayConfig.getPayUrl(), vnPayConfig.getHashSecret(), vnpParams);
    }

    /**
     * Unique tốt hơn random 8 số: yyyyMMddHHmmss + 6 digits
     * (Khuyến nghị vẫn nên map với orderId/paymentId trong DB để tuyệt đối idempotent)
     */
    private String generateTxnRef() {
        String ts = ZonedDateTime.now(VN_TZ)
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return ts + vnPayUtil.getRandomNumber(6);
    }
}
