package com.example.thanhtoannoibo.Controller.Voucher;

import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import com.example.thanhtoannoibo.DTO.Request.Voucher.BuyPackageRequest;
import com.example.thanhtoannoibo.DTO.Request.Voucher.BuyVoucherRequest;
import com.example.thanhtoannoibo.DTO.Request.Voucher.ExchangeVoucherRequest;
import com.example.thanhtoannoibo.DTO.Request.Voucher.VoucherFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.DTO.Response.Voucher.BuyVoucherResponse;
import com.example.thanhtoannoibo.DTO.Response.Voucher.UserVoucherResponse;
import com.example.thanhtoannoibo.Service.Voucher.UserVoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final UserVoucherService voucherService;

    @PostMapping("/buy")
    public ResponseEntity<BaseResponse<BuyVoucherResponse>> buyVoucher(@RequestBody BuyVoucherRequest request) {
        BuyVoucherResponse data = voucherService.buyVoucher(request);

        return ResponseEntity.ok(BaseResponse.success(data, "Mua vé thành công"));
    }

    // --- 1. LẤY DANH SÁCH VÉ CỦA TÔI ---
    @GetMapping("/my-vouchers")
    public BaseResponse<PageResponse<UserVoucherResponse>> getMyVouchers(
            @RequestParam(required = false) UserVoucherStatus status,
            @RequestParam(required = false) String code,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // 1. Tạo Filter
        VoucherFilterRequest filter = new VoucherFilterRequest();
        filter.setStatus(status);
        filter.setVoucherCode(code);

        // 2. Tạo Pageable (Sort: Sắp hết hạn lên trước hoặc Mới nhất lên trước)
        // Ở đây mình sort theo ngày tạo mới nhất
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // 3. Gọi Service
        Page<UserVoucherResponse> result = voucherService.getMyVouchers(filter, pageable);

        return BaseResponse.success(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public BaseResponse<UserVoucherResponse> getVoucherDetail(@PathVariable UUID id) {
        UserVoucherResponse voucher = voucherService.getVoucherDetail(id);
        return BaseResponse.success(voucher);
    }

    @PostMapping("/exchange")
    public BaseResponse<BuyVoucherResponse> exchangeVoucher(@RequestBody ExchangeVoucherRequest request) {
        return BaseResponse.success(voucherService.exchangeVoucher(request));
    }

    @PostMapping("/buy-package")
    public ResponseEntity<BaseResponse<BuyVoucherResponse>> buyPackage(@RequestBody @Valid BuyPackageRequest request) {
        BuyVoucherResponse response = voucherService.buyPackage(request);
        return ResponseEntity.ok(BaseResponse.success(response, "Mua gói dịch vụ thành công!"));
    }
}