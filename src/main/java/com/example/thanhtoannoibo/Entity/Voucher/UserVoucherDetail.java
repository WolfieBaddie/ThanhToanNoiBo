package com.example.thanhtoannoibo.Entity.Voucher;

import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "user_voucher_details", schema = "app")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVoucherDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "detail_id")
    private UUID detailId;

    // Liên kết ngược về bảng cha (Tấm vé tổng)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_voucher_id")
    private UserVoucher userVoucher;

    // Liên kết tới Service thực tế (Món ăn: Cơm, Nước...)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id")
    private AppService service;

    // Số lượng ban đầu (Ví dụ: Mua 1 gói có 2 cơm -> initial = 2)
    @Column(name = "initial_quantity")
    private int initialQuantity;

    // Số lượng còn lại (Mỗi lần dùng sẽ trừ đi. Khi = 0 là hết)
    @Column(name = "remaining_quantity")
    private int remainingQuantity;

    // Giá trị phân bổ (Optional: Để hoàn tiền/báo cáo doanh thu chính xác)
    @Column(name = "allocated_price")
    private BigDecimal allocatedPrice;
}
