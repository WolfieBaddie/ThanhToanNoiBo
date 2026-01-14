package com.example.thanhtoannoibo.Repository.Order;

import com.example.thanhtoannoibo.Common.OrderStatus;

import com.example.thanhtoannoibo.Entity.Order.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.*;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    // Tìm đơn theo mã tham chiếu (Dùng khi VNPay callback)
    Optional<Order> findByOrderRef(String orderRef);

    // Lịch sử nạp tiền của người dùng
    List<Order> findByUser_UserIdOrderByCreatedAtDesc(UUID userId);

    // Tìm các đơn treo (Pending) quá lâu để hủy job chạy ngầm
    List<Order> findByPaymentStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime time);
}
