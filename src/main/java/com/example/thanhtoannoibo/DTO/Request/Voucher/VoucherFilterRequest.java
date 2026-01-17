package com.example.thanhtoannoibo.DTO.Request.Voucher;

import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import lombok.Data;

@Data
public class VoucherFilterRequest {
    // Lọc theo trạng thái (ACTIVE, USED, EXPIRED)
    private UserVoucherStatus status;

    // Tìm theo mã voucher (nếu cần search)
    private String voucherCode;

    // Tìm theo tên dịch vụ (nếu cần)
    private String serviceName;
}