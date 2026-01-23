package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.DTO.Request.Transaction.TransactionFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionResponse;

import com.example.thanhtoannoibo.Service.Admin.Transaction.AdminTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/transactions")
@RequiredArgsConstructor
// @PreAuthorize("hasRole('ADMIN')") // Uncomment khi chạy thật
public class AdminTransactionController {

    private final AdminTransactionService adminTransactionService;

    // 1. Lấy danh sách toàn bộ giao dịch
    @GetMapping
    public BaseResponse<PageResponse<TransactionResponse>> getAllTransactions(
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String transactionRef,

            // [MỚI] Nhận danh sách User ID
            @RequestParam(required = false) List<UUID> userIds,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        TransactionFilterRequest filter = new TransactionFilterRequest();
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setType(type);
        filter.setTransactionRef(transactionRef);

        // [MỚI] Set danh sách user vào filter
        filter.setUserIds(userIds);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        return BaseResponse.success(adminTransactionService.getAllTransactions(filter, pageable));
    }

    // 2. Xem chi tiết giao dịch (Bao gồm cả ảnh bằng chứng, user info...)
    @GetMapping("/{id}")
    public BaseResponse<TransactionDetailResponse> getTransactionDetail(@PathVariable UUID id) {
        // Admin xem thì không cần truyền currentUserId, service tự xử lý quyền admin
        return BaseResponse.success(adminTransactionService.getTransactionDetail(id));
    }
}