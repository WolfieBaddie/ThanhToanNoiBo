package com.example.thanhtoannoibo.Controller;
import com.example.thanhtoannoibo.DTO.Request.MerchantSubmitRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.MerchantReconciliationDTO;
import com.example.thanhtoannoibo.DTO.Response.MerchantRequestResponse;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Service.MerchantRequestService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/merchant")
@RequiredArgsConstructor
public class MerchantRequestController {
    private final MerchantRequestService merchantRequestService;
    private final AuthService authService;
    private final HttpServletRequest request;

    /**
     * Merchant gửi yêu cầu cập nhật thông tin và ảnh QR
     */
    @PostMapping("/requests")
    public BaseResponse<Void> submitRequest(@RequestBody MerchantSubmitRequest submitRequest) throws Exception {
        // 1. Lấy User hiện tại từ Token thông qua AuthService
        User currentUser = authService.getCurrentUser(request);

        // 2. Gọi Service xử lý lưu yêu cầu
        merchantRequestService.submitUpdateInfoRequest(currentUser, submitRequest);

        return BaseResponse.success(null, "Gửi yêu cầu cập nhật thành công, vui lòng chờ Admin duyệt.");
    }

    /**
     * Merchant xem lịch sử yêu cầu của chính mình (để xem trạng thái, lý do từ chối, ảnh bill từ admin)
     */
    @GetMapping("/requests")
    public BaseResponse<List<MerchantRequestResponse>> getMyRequestHistory() {
        // 1. Lấy User hiện tại
        User currentUser = authService.getCurrentUser(request);

        // 2. Lấy danh sách yêu cầu theo MerchantId
        List<MerchantRequestResponse> history = merchantRequestService.getMyRequestHistory(currentUser.getUserId());

        return BaseResponse.success(history);
    }

    @GetMapping("/requests/{id}")
    public BaseResponse<MerchantRequestResponse> getRequestDetail(@PathVariable UUID id) {
        User currentUser = authService.getCurrentUser(request);
        return BaseResponse.success(merchantRequestService.getDetailRequest(id, currentUser.getUserId()));
    }

    /**
     * API Đối soát: Lấy danh sách giao dịch chi tiết (tên khách, voucher, số tiền...)
     */
    @GetMapping("/reconciliation")
    public BaseResponse<List<MerchantReconciliationDTO>> getReconciliation(
            @RequestParam UUID merchantId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return BaseResponse.success(merchantRequestService.getReconciliationData(merchantId, month, year));
    }

    @GetMapping("/reconciliation/export")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam int month,
            @RequestParam int year
    ) throws Exception {
        // 1. Lấy User hiện tại
        User currentUser = authService.getCurrentUser(request);

        // 2. Gọi Service xuất file (Truyền đúng tháng/năm)
        byte[] excelContent = merchantRequestService.exportReconciliationExcel(currentUser.getUserId(), month, year);

        // 3. Tạo tên file: DoiSoat_Username_T2_2026.xlsx
        String fileName = String.format("DoiSoat_%s_T%d_%d.xlsx", currentUser.getUsername(), month, year);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelContent);
    }
}