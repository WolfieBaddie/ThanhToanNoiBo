package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.DTO.Request.Admin.AdminUpdateCounterRequest;
import com.example.thanhtoannoibo.DTO.Request.Admin.UpdateMerchantItemStatusRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdatePackageRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdateServiceRequest;
import com.example.thanhtoannoibo.DTO.Response.Admin.AdminMerchantDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.Admin.MerchantSummaryResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.Service.Catalog.Manager.AdminMerchantManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/merchants")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMerchantController {

    private final AdminMerchantManager adminMerchantManager;

    @GetMapping
    public BaseResponse<Page<MerchantSummaryResponse>> getMerchants(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        // Trả về Page trực tiếp
        return BaseResponse.success(adminMerchantManager.getMerchants(keyword, status, pageable));
    }

    /**
     * 1. Lấy chi tiết thông tin Merchant (Bao gồm Quầy, Service, Package)
     */
    @GetMapping("/{merchantId}")
    public BaseResponse<AdminMerchantDetailResponse> getMerchantDetail(@PathVariable UUID merchantId) {
        return BaseResponse.success(adminMerchantManager.getMerchantDetail(merchantId));
    }

    /**
     * 2. Cập nhật thông tin Quầy hàng (Địa chỉ, Tên)
     */
    @PutMapping("/{merchantId}/counter")
    public BaseResponse<String> updateCounterInfo(
            @PathVariable UUID merchantId,
            @RequestBody @Valid AdminUpdateCounterRequest request
    ) {
        adminMerchantManager.updateCounterInfo(merchantId, request);
        return BaseResponse.success("Cập nhật thông tin quầy hàng thành công.");
    }

    /**
     * 3. Quản lý Service (Duyệt / Khóa / Xóa)
     * Payload: status = ACTIVE / INACTIVE / DELETED
     */
    @PutMapping("/services/{serviceId}/status")
    public BaseResponse<String> updateServiceStatus(
            @PathVariable UUID serviceId,
            @RequestBody @Valid UpdateMerchantItemStatusRequest request
    ) {
        adminMerchantManager.updateServiceStatus(serviceId, request);
        return BaseResponse.success("Cập nhật trạng thái dịch vụ thành công.");
    }

    /**
     * 4. Quản lý Package (Duyệt / Khóa / Xóa)
     */
    @PutMapping("/packages/{packageId}/status")
    public BaseResponse<String> updatePackageStatus(
            @PathVariable UUID packageId,
            @RequestBody @Valid UpdateMerchantItemStatusRequest request
    ) {
        adminMerchantManager.updatePackageStatus(packageId, request);
        return BaseResponse.success("Cập nhật trạng thái gói dịch vụ thành công.");
    }

    @PutMapping("/services/{serviceId}")
    public BaseResponse<String> updateMerchantService(
            @PathVariable UUID serviceId,
            @RequestBody @Valid UpdateServiceRequest request
    ) {
        adminMerchantManager.updateMerchantService(serviceId, request);
        return BaseResponse.success("Cập nhật dịch vụ thành công.");
    }

    @PutMapping("/packages/{packageId}")
    public BaseResponse<String> updateMerchantPackage(
            @PathVariable UUID packageId,
            @RequestBody @Valid UpdatePackageRequest request
    ) {
        adminMerchantManager.updateMerchantPackage(packageId, request);
        return BaseResponse.success("Cập nhật gói dịch vụ thành công.");
    }
}