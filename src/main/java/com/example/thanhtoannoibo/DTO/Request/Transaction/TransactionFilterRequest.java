package com.example.thanhtoannoibo.DTO.Request.Transaction;

import com.example.thanhtoannoibo.Common.TransactionType;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class TransactionFilterRequest {
    // Lọc theo khoảng thời gian (Optional)
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;

    // Lọc theo loại giao dịch (Nạp tiền, Mua vé...)
    private TransactionType type;

    // Tìm theo mã giao dịch
    private String transactionRef;
}