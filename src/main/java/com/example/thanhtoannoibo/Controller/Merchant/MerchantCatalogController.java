package com.example.thanhtoannoibo.Controller.Merchant;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.DTO.Request.Catalog.*;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.Service.Catalog.Manager.MerchantPackageManager;
import com.example.thanhtoannoibo.Service.Catalog.Manager.MerchantServiceManager;
import com.example.thanhtoannoibo.Service.Catalog.MerchantCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/merchant/catalog")
@RequiredArgsConstructor
public class MerchantCatalogController {

    private final MerchantCatalogService merchantCatalogService;
    private final MerchantServiceManager serviceManager;
    private final MerchantPackageManager packageManager;

    // =========================================================================
    // 1. VIEW & SEARCH (READ-ONLY) - GIỮ NGUYÊN
    // =========================================================================

    @GetMapping("/services")
    public BaseResponse<PageResponse<ServiceResponse>> getServices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) CatalogStatus status,
            @RequestParam(defaultValue = "false") Boolean system,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        ServiceFilterRequest filter = new ServiceFilterRequest();
        filter.setKeyword(keyword);
        filter.setCategoryId(categoryId);
        filter.setStatus(status);
        filter.setSystem(system);

        Page<ServiceResponse> pageData = merchantCatalogService.getMyServices(filter, pageable);
        return BaseResponse.success(PageResponse.from(pageData));
    }

    @GetMapping("/packages")
    public BaseResponse<PageResponse<PackageResponse>> getPackages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "false") Boolean system
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        ServiceFilterRequest filter = new ServiceFilterRequest();
        filter.setKeyword(keyword);
        filter.setSystem(system);

        Page<PackageResponse> pageData = merchantCatalogService.getMyPackages(filter, pageable);
        return BaseResponse.success(PageResponse.from(pageData));
    }

    // =========================================================================
    // 2. QUẢN LÝ DỊCH VỤ (SERVICES) - [BỔ SUNG MỚI]
    // =========================================================================

    /**
     * Tạo mới hoặc Đăng ký dịch vụ từ hệ thống
     * (Hàm create trong Manager trả về List vì hỗ trợ đăng ký nhiều món cùng lúc)
     */
    @PostMapping("/services")
    public BaseResponse<List<ServiceResponse>> createService(
            @RequestBody @Valid CreateServiceRequest request
    ) {
        List<ServiceResponse> responses = serviceManager.create(request);
        return BaseResponse.success(responses);
    }

    /**
     * Cập nhật thông tin dịch vụ
     */
    @PutMapping("/services/{serviceId}")
    public BaseResponse<ServiceResponse> updateService(
            @PathVariable UUID serviceId,
            @RequestBody @Valid UpdateServiceRequest request
    ) {
        ServiceResponse response = serviceManager.update(serviceId, request);
        return BaseResponse.success(response);
    }

    /**
     * Thay đổi nhanh trạng thái (Active/Inactive)
     */
    @PatchMapping("/services/{serviceId}/status")
    public BaseResponse<ServiceResponse> toggleServiceStatus(
            @PathVariable UUID serviceId,
            @RequestParam CatalogStatus status
    ) {
        ServiceResponse response = serviceManager.toggleStatus(serviceId, status);
        return BaseResponse.success(response);
    }

    /**
     * Xóa mềm dịch vụ (Soft Delete)
     */
    @DeleteMapping("/services/{serviceId}")
    public BaseResponse<Void> deleteService(@PathVariable UUID serviceId) {
        serviceManager.delete(serviceId);
        return BaseResponse.success(null);
    }

    // =========================================================================
    // 3. QUẢN LÝ GÓI COMBO (PACKAGES) - [BỔ SUNG DELETE]
    // =========================================================================

    /**
     * Tạo gói Combo mới (GIỮ NGUYÊN endpoint cũ)
     */
    @PostMapping("/packages")
    public BaseResponse<PackageResponse> createPackage(
            @RequestBody @Valid CreatePackageRequest request
    ) {
        PackageResponse response = packageManager.create(request);
        return BaseResponse.success(response);
    }

    /**
     * Cập nhật gói Combo (GIỮ NGUYÊN endpoint cũ)
     */
    @PutMapping("/packages/{packageId}")
    public BaseResponse<PackageResponse> updatePackage(
            @PathVariable UUID packageId,
            @RequestBody @Valid UpdatePackageRequest request
    ) {
        PackageResponse response = packageManager.update(packageId, request);
        return BaseResponse.success(response);
    }

    /**
     * Xóa mềm gói Combo (BỔ SUNG MỚI)
     */
    @DeleteMapping("/packages/{packageId}")
    public BaseResponse<Void> deletePackage(@PathVariable UUID packageId) {
        packageManager.delete(packageId);
        return BaseResponse.success(null);
    }
}