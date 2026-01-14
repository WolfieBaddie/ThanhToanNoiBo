package com.example.thanhtoannoibo.Util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class VnPayUtil {

    public String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) {
                throw new IllegalArgumentException("HMAC key/data must not be null");
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey =
                    new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);

            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder(result.length * 2);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            // fail-fast để tránh tạo URL sai/verify sai âm thầm
            throw new IllegalStateException("Cannot compute HmacSHA512", ex);
        }
    }

    /** Random chuỗi số (0-9). */
    public String getRandomNumber(int len) {
        if (len <= 0) return "";
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Lấy IP client. Ưu tiên X-Forwarded-For (lấy IP đầu tiên nếu có nhiều IP).
     */
    public String getIpAddress(HttpServletRequest request) {
        if (request == null) return "0.0.0.0";

        String xff = request.getHeader("X-Forwarded-For");
        if (xff == null || xff.isBlank()) {
            xff = request.getHeader("X-FORWARDED-FOR"); // fallback
        }
        if (xff != null && !xff.isBlank()) {
            String first = xff.split(",")[0].trim();
            if (!first.isEmpty()) return first;
        }

        String remote = request.getRemoteAddr();
        return (remote == null || remote.isBlank()) ? "0.0.0.0" : remote;
    }

    /**
     * Build hashData theo Techspec: key=value&key=value (value THÔ, KHÔNG URL-encode).
     * - Sort theo key tăng dần
     * - Skip null/empty
     * - Không bị dư '&' cuối
     */
    public String buildHashData(Map<String, String> params) {
        if (params == null || params.isEmpty()) return "";

        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);

        StringBuilder sb = new StringBuilder();
        boolean first = true;

        for (String k : keys) {
            String v = params.get(k);
            if (v == null || v.isEmpty()) continue;

            if (!first) sb.append('&');
            first = false;

            sb.append(k).append('=').append(v);
        }
        return sb.toString();
    }

    /**
     * Build query string redirect: key=urlEncode(value)&key=urlEncode(value)
     * - Sort theo key tăng dần
     * - Skip null/empty
     * - Không bị dư '&' cuối
     */
    public String buildQueryString(Map<String, String> params) {
        if (params == null || params.isEmpty()) return "";

        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);

        StringBuilder sb = new StringBuilder();
        boolean first = true;

        for (String k : keys) {
            String v = params.get(k);
            if (v == null || v.isEmpty()) continue;

            if (!first) sb.append('&');
            first = false;

            sb.append(URLEncoder.encode(k, StandardCharsets.US_ASCII));
            sb.append('=');
            sb.append(URLEncoder.encode(v, StandardCharsets.US_ASCII));
        }
        return sb.toString();
    }

    /**
     * Helper: build URL redirect sang VNPAY.
     * - queryString: URL-encode (US_ASCII)
     * - hashData: KHONG URL-encode value (theo Techspec)
     */
    public String buildSignedPaymentUrl(String payUrl, String hashSecret, Map<String, String> params) {
        if (payUrl == null || payUrl.isBlank()) throw new IllegalArgumentException("payUrl is blank");
        if (hashSecret == null) throw new IllegalArgumentException("hashSecret is null");
        if (params == null || params.isEmpty()) throw new IllegalArgumentException("params is empty");

        String hashData = buildHashData(params);
        String query = buildQueryString(params);
        String secureHash = hmacSHA512(hashSecret, hashData);

        if (query == null || query.isEmpty()) {
            return payUrl + "?vnp_SecureHash=" + secureHash;
        }
        return payUrl + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    /**
     * Helper: build chuỗi param để verify chữ ký.
     * - encode=false: value THÔ (đúng cho verify vì Spring đã decode query param)
     * - encode=true : value URL-encode (ít dùng, chủ yếu để debug)
     */
    public String buildParamString(Map<String, String> params, boolean encode) {
        if (params == null || params.isEmpty()) return "";

        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);

        StringBuilder sb = new StringBuilder();
        boolean first = true;

        for (String k : keys) {
            String v = params.get(k);
            if (v == null || v.isEmpty()) continue;

            if (!first) sb.append('&');
            first = false;

            sb.append(k).append('=');
            sb.append(encode ? URLEncoder.encode(v, StandardCharsets.US_ASCII) : v);
        }
        return sb.toString();
    }

}
