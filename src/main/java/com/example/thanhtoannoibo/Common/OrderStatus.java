package com.example.thanhtoannoibo.Common;

public enum OrderStatus {
    PENDING,    // Đang chờ thanh toán
    PAID,       // Đã thanh toán thành công
    FAILED,     // Thanh toán thất bại
    CANCELLED   // Hủy đơn
}
