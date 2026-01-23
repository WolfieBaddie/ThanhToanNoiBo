package com.example.thanhtoannoibo.Common;

public enum OrderStatus {
    PENDING,    // Đang chờ thanh toán
    COMPLETED,       // Đã thanh toán thành công
    FAILED,     // Thanh toán thất bại
    CANCELLED,   // Hủy đơn
    PAID
}
