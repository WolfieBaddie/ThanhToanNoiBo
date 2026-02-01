package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.DTO.Request.Admin.AdminReviewRequest;
import com.example.thanhtoannoibo.DTO.Response.Admin.AdminMerchantRequestDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.Entity.User;

import com.example.thanhtoannoibo.Service.AdminRequestService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/merchant-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRequestController {

    private final AdminRequestService adminRequestService;
    private final AuthService authService;
    private final HttpServletRequest request;

    /**
     * 1. Lấy danh sách yêu cầu (Có phân trang & Tìm kiếm)
     * GET /api/admin/merchant-requests?keyword=...&status=...&page=0&size=10
     */
    @GetMapping
    public BaseResponse<Page<AdminMerchantRequestDetailResponse>> getRequests(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        // Tạo Pageable với Sort
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AdminMerchantRequestDetailResponse> result = adminRequestService.getRequests(
                keyword, status, fromDate, toDate, pageable
        );

        return BaseResponse.success(result);
    }

    /**
     * 2. Xem chi tiết yêu cầu
     * GET /api/admin/merchant-requests/{id}
     */
    @GetMapping("/{id}")
    public BaseResponse<AdminMerchantRequestDetailResponse> getRequestDetail(@PathVariable UUID id) {
        return BaseResponse.success(adminRequestService.getRequestDetail(id));
    }

    /**
     * 3. Duyệt hoặc Từ chối yêu cầu
     * POST /api/admin/merchant-requests/{id}/review
     */
    @PostMapping("/{id}/review")
    public BaseResponse<Void> reviewRequest(
            @PathVariable UUID id,
            @RequestBody AdminReviewRequest reviewDto
    ) {
        // Lấy thông tin Admin đang đăng nhập để lưu vào log người duyệt
        User admin = authService.getCurrentUser(request);

        adminRequestService.reviewRequest(id, admin.getUserId(), reviewDto);

        return BaseResponse.success(null, "Đã cập nhật trạng thái yêu cầu thành công.");
    }

    /**
     * 4. Xuất báo cáo Excel đối soát cho một Merchant
     * GET /api/admin/merchant-requests/export-report?merchantId=...
     */
    @GetMapping("/export-report")
    public ResponseEntity<byte[]> exportReport(@RequestParam UUID merchantId) throws Exception {
        byte[] excelContent = adminRequestService.exportReconciliationReport(merchantId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=admin_reconciliation_report_" + merchantId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelContent);
    }
}