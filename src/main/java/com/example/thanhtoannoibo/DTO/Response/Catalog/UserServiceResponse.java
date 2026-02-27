package com.example.thanhtoannoibo.DTO.Response.Catalog;
import com.example.thanhtoannoibo.Common.CatalogStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserServiceResponse {
    private String masterServiceCode; // Dùng để gom nhóm (hoặc serviceCode nếu là món riêng)
    private String serviceName;
    private String categoryName;
    private String imageUrl;
    private String description;

    // --- THỐNG KÊ GIÁ ---
    private BigDecimal minPrice; // Hiển thị "Từ 30.000đ"
    private BigDecimal maxPrice;

    // --- DANH SÁCH CÁC QUẦY ĐANG BÁN MÓN NÀY ---
    private List<ServiceOption> options;

    @Data
    @Builder
    public static class ServiceOption {
        private UUID serviceId;      // ID thực tế để User add vào giỏ hàng/mua
        private BigDecimal unitPrice; // Giá tại quầy này

        // Thông tin Quầy & Địa điểm (User cần cái này)
        private UUID counterId;
        private String counterName;
        private String location;     // VD: "Canteen Nhà A", "Tạp hóa Sảnh B"
        private String merchantName; // Tên chủ quán (nếu cần)

        private CatalogStatus status;
        private Integer remainingQuantity;
    }
}
