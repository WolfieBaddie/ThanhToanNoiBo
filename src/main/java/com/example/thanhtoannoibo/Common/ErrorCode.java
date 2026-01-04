package com.example.thanhtoannoibo.Common;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // General
    UNCATEGORIZED_EXCEPTION("E0001", "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST("E0002", "Invalid request", HttpStatus.BAD_REQUEST),

    // Wallet & Transfer
    WALLET_NOT_FOUND("W0001", "Wallet not found", HttpStatus.NOT_FOUND),
    INSUFFICIENT_BALANCE("W0002", "Insufficient wallet balance", HttpStatus.BAD_REQUEST),
    CANNOT_TRANSFER_TO_SELF("W0003", "Cannot transfer to yourself", HttpStatus.BAD_REQUEST),

    // QR Code
    QR_CODE_NOT_FOUND("Q0001", "QR Code not found", HttpStatus.NOT_FOUND),
    QR_CODE_EXPIRED("Q0002", "QR Code has expired", HttpStatus.BAD_REQUEST),
    QR_CODE_INACTIVE("Q0003", "QR Code is not active", HttpStatus.BAD_REQUEST),

    // Transfer Request
    REQUEST_NOT_FOUND("R0001", "Transfer request not found", HttpStatus.NOT_FOUND),
    REQUEST_NOT_PENDING("R0002", "Transfer request is not pending", HttpStatus.BAD_REQUEST),
    REQUEST_EXPIRED("R0003", "Transfer request has expired", HttpStatus.BAD_REQUEST),

    // VNPAY
    VNPAY_INVALID_CHECKSUM("V0001", "Invalid VNPAY Checksum", HttpStatus.UNAUTHORIZED),
    VNPAY_PAYMENT_FAILED("V0002", "VNPAY Payment failed", HttpStatus.BAD_REQUEST),

    UNAUTHORIZED("U001", "Invalid user", HttpStatus.UNAUTHORIZED);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
