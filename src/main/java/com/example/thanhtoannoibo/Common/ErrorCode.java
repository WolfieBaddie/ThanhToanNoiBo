package com.example.thanhtoannoibo.Common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // --- 1. GENERAL (Lỗi chung) ---
    UNCATEGORIZED_EXCEPTION("E0001", "Lỗi hệ thống chưa được phân loại", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST("E0002", "Yêu cầu không hợp lệ hoặc thiếu thông tin bắt buộc", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("E0003", "Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("E0004", "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),

    // --- 2. USER (Người dùng) ---
    USER_NOT_FOUND("U0001", "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    USER_LOCKED("U0002", "Tài khoản người dùng đang bị khóa", HttpStatus.FORBIDDEN),
    ROLE_NOT_FOUND("R0001", "Quyền không tồn tại", HttpStatus.NOT_FOUND),
    // --- 3. CREDIT WALLET (Ví Xu - UserCredit) ---
    CREDIT_NOT_FOUND("W0001", "Không tìm thấy ví Xu của người dùng", HttpStatus.NOT_FOUND),
    INSUFFICIENT_BALANCE("W0002", "Số dư Xu không đủ để thực hiện giao dịch", HttpStatus.BAD_REQUEST),
    CANNOT_TRANSFER_TO_SELF("W0003", "Không thể chuyển Xu cho chính mình", HttpStatus.BAD_REQUEST),
    INVALID_AMOUNT("W0004", "Số tiền giao dịch không hợp lệ (phải lớn hơn 0)", HttpStatus.BAD_REQUEST),

    // --- 4. ORDER & PAYMENT (Đơn hàng & Thanh toán) ---
    ORDER_NOT_FOUND("O0001", "Đơn hàng không tồn tại", HttpStatus.NOT_FOUND),
    ORDER_ALREADY_PROCESSED("O0002", "Đơn hàng này đã được xử lý (đã thanh toán hoặc bị hủy)", HttpStatus.BAD_REQUEST),
    PAYMENT_FAILED("O0003", "Thanh toán thất bại", HttpStatus.BAD_REQUEST),

    // --- 5. CATALOG (Gói cước & Dịch vụ) ---
    PACKAGE_NOT_FOUND("P0001", "Gói combo không tồn tại", HttpStatus.NOT_FOUND),
    PACKAGE_INACTIVE("P0002", "Gói combo này đang tạm ngưng hoạt động", HttpStatus.BAD_REQUEST),
    PACKAGE_CODE_EXISTS("P0003", "Mã gói dịch vụ đã tồn tại", HttpStatus.BAD_REQUEST),
    PACKAGE_UPDATE_RESTRICTED("P0004", "Gói dịch vụ đang bị khóa hoặc ngưng hoạt động. Vui lòng kích hoạt lại trước khi cập nhật thông tin.", HttpStatus.BAD_REQUEST),
    SERVICE_NOT_BELONG_TO_COUNTER("P0005", "Dịch vụ được chọn không thuộc quản lý của quầy hàng này.", HttpStatus.FORBIDDEN),
    SERVICE_NOT_FOUND("S0001", "Dịch vụ không tồn tại", HttpStatus.NOT_FOUND),
    SERVICE_INACTIVE("S0002", "Dịch vụ này đang tạm ngưng hoạt động", HttpStatus.BAD_REQUEST),
    SERVICE_EXISTED("S0003", "Dịch vụ đã tồn tại", HttpStatus.NOT_FOUND),
    SERVICE_NOT_IN_VOUCHER("S004", "Dịch vụ không ồn tại trong voucher", HttpStatus.BAD_REQUEST),
    // --- 6. VOUCHER & ITEMS (Kho vé) ---
    VOUCHER_NOT_FOUND("V0001", "Không tìm thấy vé/voucher", HttpStatus.NOT_FOUND),
    VOUCHER_USED_OR_EXPIRED("V0002", "Voucher đã được sử dụng hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    VOUCHER_LOCKED("V0003", "Voucher đang bị khóa", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_VOUCHER_QUANTITY("V0004", "Số lượng voucher không đủ.", HttpStatus.BAD_REQUEST),
    // --- 7. QR CODE ---
    QR_CODE_NOT_FOUND("Q0001", "Mã QR không tồn tại", HttpStatus.NOT_FOUND),
    QR_CODE_EXPIRED("Q0002", "Mã QR đã hết hạn sử dụng", HttpStatus.BAD_REQUEST),
    QR_CODE_INACTIVE("Q0003", "Mã QR chưa được kích hoạt hoặc bị vô hiệu hóa", HttpStatus.BAD_REQUEST),
    QR_CODE_LIMIT_REACHED("Q0004", "Mã QR đã hết lượt sử dụng", HttpStatus.BAD_REQUEST),
    QR_CODE_ALREADY_EXISTS("Q0005", "Voucher này đang có một mã QR còn hiệu lực. Vui lòng sử dụng mã cũ hoặc hủy nó trước khi tạo mới.", HttpStatus.CONFLICT),
    EXCEED_QR_LIMIT("1033", "Số lượng xác nhận vượt quá hạn mức cho phép của mã QR.", HttpStatus.BAD_REQUEST),
    // --- 8. VNPAY INTEGRATION ---
    VNPAY_INVALID_CHECKSUM("VP001", "Sai chữ ký VnPay (Sai Checksum)", HttpStatus.UNAUTHORIZED),
    VNPAY_PAYMENT_FAILED("VP002", "Giao dịch thanh toán qua VNPay không thành công", HttpStatus.BAD_REQUEST),

    DAILY_LIMIT_EXCEEDED("W0005", "Giao dịch vượt quá hạn mức chi tiêu trong ngày", HttpStatus.BAD_REQUEST),

    TRANSACTION_NOT_FOUND("T0001", "Không tìm thấy giao dịch", HttpStatus.NOT_FOUND),
    PAYMENT_DETAIL_NOT_FOUND("T0002", "Không tìm thấy chi tiết hóa đơn", HttpStatus.NOT_FOUND),

    // [MỚI] Lỗi logic nghiệp vụ QR
    INVALID_SCOPE("Q0006", "Voucher không áp dụng tại quầy/dịch vụ này", HttpStatus.BAD_REQUEST),

    // --- 9. COUNTER (Quầy hàng) [MỚI] ---
    COUNTER_NOT_FOUND("C0001", "Không tìm thấy quầy hàng", HttpStatus.NOT_FOUND),
    COUNTER_INACTIVE("C0002", "Quầy hàng đang đóng cửa hoặc tạm ngưng hoạt động", HttpStatus.BAD_REQUEST),
    MERCHANT_NO_COUNTER("C0003", "Tài khoản này chưa được gán quản lý quầy hàng nào", HttpStatus.FORBIDDEN),
    MERCHANT_NOT_OWNER("S0003", "Dịch vụ này không thuộc quản lý của quầy hàng bạn", HttpStatus.FORBIDDEN),
    SERVICE_UPDATE_RESTRICTED("S0004", "Dịch vụ đang bị khóa hoặc ngưng hoạt động. Vui lòng kích hoạt lại trước khi cập nhật thông tin.", HttpStatus.BAD_REQUEST),
    COUNTER_ALREADY_EXISTS("C0004", "Tài khoản này đã sở hữu một quầy hàng. Không thể tạo thêm.", HttpStatus.CONFLICT),
    COUNTER_CODE_EXISTS("C0005", "Mã quầy hàng đã tồn tại.", HttpStatus.BAD_REQUEST),
    COUNTER_NAME_REQUIRED("C0006", "Tên quầy hàng không được để trống.", HttpStatus.BAD_REQUEST),
    // --- 10. OTP & AUTHENTICATION ---
    OTP_INVALID("A0001", "Mã OTP không chính xác.", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED("A0002", "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng lấy mã mới.", HttpStatus.BAD_REQUEST),
    OTP_LIMIT_REACHED("A0003", "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau.", HttpStatus.TOO_MANY_REQUESTS),
    EMAIL_SEND_FAILED("A0004", "Không thể gửi email OTP. Vui lòng thử lại sau.", HttpStatus.INTERNAL_SERVER_ERROR),

    // --- 11. MERCHANT NOTIFICATIONS (Thông báo nghiệp vụ) [MỚI] ---
    // %d, %s là placeholder để String.format điền giá trị vào
    NOTIFY_REGISTER_SUCCESS("N0001", "Bạn đã đăng ký thêm %d món vào menu.", HttpStatus.OK),
    NOTIFY_REQUEST_SUCCESS("N0002", "Món '%s' đã được gửi yêu cầu duyệt.", HttpStatus.OK),
    NOTIFY_UPDATE_SUCCESS("N0003", "Dịch vụ đã được cập nhật thành công.", HttpStatus.OK),

    CATEGORY_CODE_EXISTS("CA0001", "Mã danh mục đã tồn tại", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_FOUND("CA0002", "Danh mục không tồn tại", HttpStatus.NOT_FOUND),
    CATEGORY_INACTIVE("CA0003", "Danh mục này đang tạm ngưng hoạt động", HttpStatus.BAD_REQUEST),
    MASTER_SERVICE_CODE_EXISTS("AD002", "Mã dịch vụ hệ thống đã tồn tại", HttpStatus.BAD_REQUEST),
    SERVICE_ALREADY_APPROVED("AD003", "Dịch vụ này đã được duyệt trước đó", HttpStatus.BAD_REQUEST),
    PACKAGE_ALREADY_APPROVED("AD004", "Gói combo này đã được duyệt trước đó", HttpStatus.BAD_REQUEST),
    ITEM_IS_PENDING("MC003", "Mục này đang chờ duyệt, không thể chỉnh sửa hoặc xóa.", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION("MC004", "Chuyển đổi trạng thái không hợp lệ.", HttpStatus.BAD_REQUEST),
    CANNOT_REVERT_TO_PENDING("MC005", "Không thể chuyển thủ công về trạng thái chờ duyệt.", HttpStatus.BAD_REQUEST),
    INVALID_WITHDRAWAL_TIME("MC006", "Chưa đến kỳ đối soát. Hệ thống chỉ tiếp nhận yêu cầu vào 2 ngày cuối cùng của tháng.", HttpStatus.BAD_REQUEST),
    INVALID_PRICE("AD005", "Giá tiền không hợp lệ", HttpStatus.BAD_REQUEST);
    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}