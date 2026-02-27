package com.example.thanhtoannoibo.DTO.Response;
import java.math.BigDecimal;
import java.time.Instant;
public interface MerchantReconciliationDTO {
    String getMaGiaoDich();      // Alias: ma_giao_dich
    Instant getThoiGian();       // Alias: thoi_gian (Postgres timestamptz -> Java Instant)
    String getTrangThai();       // Alias: trang_thai
    String getNoiDung();         // Alias: noi_dung

    // 2. Thông tin Tài chính (Quan trọng)
    BigDecimal getTienGoc();       // Alias: tien_goc
    BigDecimal getThueVat();       // Alias: thue_vat
    BigDecimal getTongThanhToan(); // Alias: tong_thanh_toan
    BigDecimal getPhiSan();        // Alias: phi_san
    BigDecimal getThucNhan();      // Alias: thuc_nhan

    // 3. Thông tin Khách hàng
    String getNguoiThanhToan();  // Alias: nguoi_thanh_toan
    String getEmailKhach();      // Alias: email_khach
    String getSdtKhach();        // Alias: sdt_khach

    // 4. Thông tin Voucher & QR
    String getMaVoucher();           // Alias: ma_voucher
    String getTenDichVuVoucher();    // Alias: ten_dich_vu_voucher
    Instant getHanSuDungVoucher();   // Alias: han_su_dung_voucher
    String getQrNhanTien();          // Alias: qr_nhan_tien
}
