package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreateCategoryRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdateCategoryRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import com.example.thanhtoannoibo.Service.Catalog.Manager.AdminCategoryManager;
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
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final AdminCategoryManager adminCategoryManager;

    /**
     * Lấy danh sách danh mục (Có phân trang, tìm kiếm, lọc trạng thái)
     */
    @GetMapping
    public BaseResponse<PageResponse<ServiceCategory>> getCategories(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CatalogStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        // 1. Setup Filter
        ServiceFilterRequest filter = new ServiceFilterRequest();
        filter.setKeyword(keyword);
        filter.setStatus(status);

        // 2. Setup Pageable
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // 3. Call Service
        Page<ServiceCategory> result = adminCategoryManager.getAllCategories(filter, pageable);

        return BaseResponse.success(PageResponse.from(result));
    }

    /**
     * Tạo danh mục mới
     */
    @PostMapping
    public BaseResponse<ServiceCategory> createCategory(@RequestBody @Valid CreateCategoryRequest request) {
        ServiceCategory created = adminCategoryManager.create(request);
        return BaseResponse.success(created);
    }

    /**
     * Cập nhật danh mục (Thông tin hoặc Trạng thái)
     */
    @PutMapping("/{id}")
    public BaseResponse<ServiceCategory> updateCategory(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCategoryRequest request) {
        ServiceCategory updated = adminCategoryManager.update(id, request);
        return BaseResponse.success(updated);
    }

    /**
     * Xóa mềm danh mục
     */
    @DeleteMapping("/{id}")
    public BaseResponse<String> deleteCategory(@PathVariable UUID id) {
        adminCategoryManager.delete(id);
        return BaseResponse.success("Đã xóa danh mục thành công");
    }
}