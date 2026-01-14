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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

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
        // Spec: VND * 100
        long amount100 = depositRequest.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        String txnRef = generateTxnRef();
        String orderInfo = "Nap xu: " + txnRef;

        // SỬA: Lấy IP thực tế thay vì hardcode 127.0.0.1
        String ipAddress = vnPayUtil.getIpAddress(request);

        Map<String, String> vnpParams = buildPaymentParams(
                txnRef,
                String.valueOf(amount100),
                orderInfo,
                depositRequest.getBankCode(),
                depositRequest.getLanguage(),
                ipAddress
        );

        // SỬA: Gọi method buildPaymentUrl mới trong Util
        String paymentUrl = vnPayUtil.buildPaymentUrl(vnpParams, vnPayConfig.getHashSecret(), vnPayConfig.getPayUrl());

        return VnPayResponse.builder()
                .paymentUrl(paymentUrl)
                .txnRef(txnRef)
                .build();
    }

    /**
     * Logic Verify tham khảo từ VNPayService.orderReturn (com.duc):
     * Cần encode lại các params nhận được trước khi hash để so sánh.
     */
    public int verifyPayment(Map<String, String> queryParams) {
        if (queryParams == null || queryParams.isEmpty()) return -1;

        String vnp_SecureHash = queryParams.get("vnp_SecureHash");
        if (vnp_SecureHash == null || vnp_SecureHash.isBlank()) return -1;

        // Tạo Map mới để tính checksum (giống logic orderReturn của file tham khảo)
        Map<String, String> fields = new HashMap<>();

        for (Map.Entry<String, String> entry : queryParams.entrySet()) {
            String fieldName = entry.getKey();
            String fieldValue = entry.getValue();

            // Skip các field hash
            if ("vnp_SecureHash".equals(fieldName) || "vnp_SecureHashType".equals(fieldName)) {
                continue;
            }

            try {
                // Logic quan trọng từ file tham khảo: Cần URLEncode cả Key và Value
                // Spring Boot đã decode params, nên ta cần encode lại để tính hash khớp với VNPAY
                String encodedName = URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString());
                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString());

                if (encodedValue != null && encodedValue.length() > 0) {
                    fields.put(encodedName, encodedValue);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Tính hash từ các field đã encode
        // Vì trong Util.buildPaymentUrl ta đã code logic: sort -> key=value (value đã encode ở trên) -> hash
        // Nên ta cần tự build chuỗi hashData ở đây tương tự
        String signValue = hashAllFields(fields);

        if (signValue.equals(vnp_SecureHash)) {
            return "00".equals(queryParams.get("vnp_TransactionStatus")) ? 1 : 0;
        } else {
            return -1; // Invalid Signature
        }
    }

    // Helper riêng để hash cho phần Verify (Mô phỏng VNPayConfig.hashAllFields của file tham khảo)
    private String hashAllFields(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                sb.append(fieldName);
                sb.append("=");
                sb.append(fieldValue);
            }
            if (itr.hasNext()) {
                sb.append("&");
            }
        }
        return vnPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), sb.toString());
    }

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
        vnpParams.put("vnp_OrderType", "other"); // Sử dụng 'other' thay vì order-type để chuẩn hơn

        vnpParams.put("vnp_Locale", (locale == null || locale.isBlank()) ? "vn" : locale.trim());
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", ipAddress); // IP thực tế

        ZonedDateTime now = ZonedDateTime.now(VN_TZ);
        vnpParams.put("vnp_CreateDate", now.format(VNP_DATE_FMT));
        vnpParams.put("vnp_ExpireDate", now.plusMinutes(15).format(VNP_DATE_FMT));

        return vnpParams;
    }

    private String generateTxnRef() {
        return vnPayUtil.getRandomNumber(8);
    }
}