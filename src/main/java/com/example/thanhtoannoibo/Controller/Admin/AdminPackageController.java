package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreatePackageRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdatePackageRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Service.Catalog.Manager.AdminPackageManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/packages")
@RequiredArgsConstructor
public class AdminPackageController {

    private final AdminPackageManager adminPackageManager;

    /**
     * Lấy danh sách Gói (Packages)
     * - system = true: Chỉ lấy gói của hệ thống tạo
     * - system = false: Lấy gói của Merchant (nếu logic mở rộng sau này)
     * - status: Lọc trạng thái (PENDING, ACTIVE, DELETED...)
     */
    @GetMapping
    public BaseResponse<PageResponse<PackageResponse>> getPackages(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CatalogStatus status,
            @RequestParam(required = false) Boolean system, // True: Gói hệ thống, False/Null: All or Merchant
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        ServiceFilterRequest filter = new ServiceFilterRequest();
        filter.setKeyword(keyword);
        filter.setStatus(status);
        filter.setSystem(system); // Cần đảm bảo DTO ServiceFilterRequest có field 'Boolean system'

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<PackageResponse> result = adminPackageManager.getAllPackages(filter, pageable);

        return BaseResponse.success(PageResponse.from(result));
    }

    /**
     * Tạo Gói Combo mới (Gói Hệ thống)
     */
    @PostMapping
    public BaseResponse<PackageResponse> createPackage(@RequestBody @Valid CreatePackageRequest request) {
        PackageResponse created = adminPackageManager.create(request);
        return BaseResponse.success(created);
    }

    /**
     * Cập nhật thông tin Gói hoặc Duyệt/Khóa gói
     */
    @PutMapping("/{id}")
    public BaseResponse<PackageResponse> updatePackage(
            @PathVariable UUID id,
            @RequestBody @Valid UpdatePackageRequest request) {
        PackageResponse updated = adminPackageManager.update(id, request);
        return BaseResponse.success(updated);
    }

    /**
     * Shortcut: Duyệt nhanh một gói (Chuyển sang ACTIVE)
     * Dùng endpoint này khi Admin muốn nút bấm nhanh "Approve" trên UI
     */
    @PatchMapping("/{id}/approve")
    public BaseResponse<PackageResponse> approvePackage(@PathVariable UUID id) {
        PackageResponse approved = adminPackageManager.approve(id);
        return BaseResponse.success(approved);
    }

    /**
     * Xóa mềm Gói
     */
    @DeleteMapping("/{id}")
    public BaseResponse<String> deletePackage(@PathVariable UUID id) {
        adminPackageManager.delete(id);
        return BaseResponse.success("Đã xóa gói dịch vụ thành công");
    }
}