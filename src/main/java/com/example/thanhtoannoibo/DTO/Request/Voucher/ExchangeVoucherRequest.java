package com.example.thanhtoannoibo.DTO.Request.Voucher;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ExchangeVoucherRequest {
    private int quantity;        // Số lượng vé muốn đổi
    private BigDecimal creditValue; // Giá trị của mỗi vé (VD: 50.000đ)
}