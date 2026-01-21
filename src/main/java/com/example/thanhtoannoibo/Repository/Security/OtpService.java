package com.example.thanhtoannoibo.Service.Security;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Exception.AppException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final JavaMailSender mailSender;
    private final StringRedisTemplate redisTemplate;

    @Value("${spring.mail.username}")
    private String senderEmail;

    private static final String OTP_PREFIX = "OTP:";
    private static final long OTP_EXPIRATION_MINUTES = 5;

    /**
     * Sinh mã OTP, lưu Redis và gửi Email (Async)
     */
    public void generateAndSendOtp(String email, String actionType) {
        // 1. Sinh mã 6 số
        String otpCode = RandomStringUtils.randomNumeric(6);

        // 2. Lưu Redis (Tự xóa sau 5 phút)
        String redisKey = getRedisKey(email, actionType);
        redisTemplate.opsForValue().set(redisKey, otpCode, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);

        log.info("OTP generated for {}: {}", email, otpCode); // Log để test (xóa khi lên prod)

        // 3. Gửi mail
        sendEmailAsync(email, otpCode, actionType);
    }

    /**
     * Kiểm tra mã OTP. Nếu sai ném lỗi, nếu đúng thì xóa key.
     */
    public void validateOtp(String email, String otpCode, String actionType) {
        String redisKey = getRedisKey(email, actionType);
        String storedOtp = redisTemplate.opsForValue().get(redisKey);

        if (storedOtp == null) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        if (!storedOtp.equals(otpCode)) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }

        // Xóa ngay để không dùng lại (Replay Attack)
        redisTemplate.delete(redisKey);
    }

    private String getRedisKey(String email, String actionType) {
        return OTP_PREFIX + email + ":" + actionType;
    }

    @Async
    protected void sendEmailAsync(String toEmail, String otpCode, String actionType) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);

            String subject = "TRANSACTION".equals(actionType)
                    ? "[ThanhToanNoiBo] Xác thực giao dịch"
                    : "[ThanhToanNoiBo] Mã OTP";

            String content = buildEmailContent(otpCode, actionType);

            helper.setSubject(subject);
            helper.setText(content, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Lỗi gửi email OTP tới {}", toEmail, e);
        }
    }

    private String buildEmailContent(String otpCode, String actionType) {
        return "<div style='font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px;'>"
                + "<h2 style='color: #4F46E5;'>Mã Xác Thực</h2>"
                + "<p>Mã OTP của bạn là:</p>"
                + "<h1 style='background: #f3f4f6; padding: 10px; text-align: center; letter-spacing: 5px; color: #111827;'>" + otpCode + "</h1>"
                + "<p>Mã này có hiệu lực trong <b>5 phút</b>.</p>"
                + "</div>";
    }
}