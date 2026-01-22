package com.example.thanhtoannoibo.Controller.Transaction;

import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.DTO.Request.Transaction.TransactionFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Transaction.TransactionResponse;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import com.example.thanhtoannoibo.Service.Transaction.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-credits")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;
    private final AuthService authService;

    @GetMapping("/transactions")
    public BaseResponse<PageResponse<TransactionResponse>> getHistory(
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) TransactionType type, // Spring tự convert String -> Enum
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        TransactionFilterRequest filter = new TransactionFilterRequest();
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setType(type);

        // Mặc định sort giao dịch mới nhất lên đầu
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        return BaseResponse.success(PageResponse.from(transactionService.getMyTransactions(filter, pageable)));
    }

    @GetMapping("/transactions/{id}")
    public BaseResponse<TransactionDetailResponse> getTransactionDetail(
            @PathVariable("id") UUID transactionId,
            HttpServletRequest request
    ) {
        // 1. Lấy User hiện tại từ Token
        User currentUser = authService.getCurrentUser(request);

        // 2. Gọi Service (Lưu ý thứ tự tham số: transactionId trước, userId sau)
        // Check file TransactionService.java để đảm bảo đúng thứ tự
        return BaseResponse.success(transactionService.getTransactionDetail(transactionId, currentUser.getUserId()));
    }
}
