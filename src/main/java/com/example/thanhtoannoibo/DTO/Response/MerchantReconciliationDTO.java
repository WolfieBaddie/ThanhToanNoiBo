package com.example.thanhtoannoibo.DTO.Response;
import java.math.BigDecimal;
import java.time.Instant;
public interface MerchantReconciliationDTO {
    String getMaGiaoDich();
    Instant getThoiGian();
    BigDecimal getSoTien();
    String getTrangThai();
    String getNoiDung();

    // Thông tin khách hàng (Người thanh toán)
    String getNguoiThanhToan();
    String getEmailKhach();
    String getSdtKhach();

    // Thông tin Voucher (Nếu thanh toán bằng voucher)
    String getMaVoucher();
    String getTenDichVuVoucher();
    Instant getHanSuDungVoucher();

    // Thông tin QR của Merchant tại thời điểm đối soát
    String getQrNhanTien();
}
