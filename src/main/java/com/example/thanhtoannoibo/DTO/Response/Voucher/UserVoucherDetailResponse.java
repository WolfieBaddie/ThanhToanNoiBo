package com.example.thanhtoannoibo.DTO.Response.Voucher;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class UserVoucherDetailResponse {
    private UUID detailId;
    private UUID serviceId;
    private String serviceName;
    private String imageUrl;

    // Thông tin quan trọng nhất
    private int initialQuantity;   // Tổng số lượng mua ban đầu
    private int remainingQuantity; // Số lượng còn lại có thể dùng
}