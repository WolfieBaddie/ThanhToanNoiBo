package com.example.thanhtoannoibo.Controller;
import com.example.thanhtoannoibo.DTO.Request.Counter.CreateCounterRequest;
import com.example.thanhtoannoibo.DTO.Request.Counter.UpdateCounterRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.CounterResponse;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Service.Catalog.Manager.MerchantCounterManager;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/merchant/counters")
@RequiredArgsConstructor
@Tag(name = "Merchant - Counter Management", description = "Quản lý quầy hàng (Tạo, Sửa, Xóa/Khóa)")
public class MerchantCounterController {

    private final MerchantCounterManager merchantCounterManager;

    @PostMapping
    @Operation(summary = "Tạo quầy hàng mới", description = "Mỗi Merchant chỉ được tạo 1 quầy (theo logic hiện tại).")
    public BaseResponse<Counter> createCounter(@RequestBody @Valid CreateCounterRequest request) {
        Counter counter = merchantCounterManager.create(request);
        // Sử dụng Builder của BaseResponse để set status 201 CREATED
        return BaseResponse.<Counter>builder()
                .code(HttpStatus.CREATED.value())
                .message("Tạo quầy hàng thành công.")
                .data(counter)
                .build();
    }

    @PutMapping("/{counterId}")
    @Operation(summary = "Cập nhật thông tin quầy", description = "Cập nhật tên, vị trí, hoặc trạng thái. Nếu chuyển trạng thái sang INACTIVE, hệ thống sẽ tự động khóa Voucher liên quan.")
    public BaseResponse<Counter> updateCounter(
            @PathVariable UUID counterId,
            @RequestBody @Valid UpdateCounterRequest request) {
        Counter updatedCounter = merchantCounterManager.update(counterId, request);
        // Sử dụng helper method success có sẵn trong BaseResponse
        return BaseResponse.success(updatedCounter, "Cập nhật quầy hàng thành công.");
    }

    @DeleteMapping("/{counterId}")
    @Operation(summary = "Xóa (Khóa) quầy hàng", description = "Chuyển trạng thái quầy sang INACTIVE và khóa toàn bộ Voucher/QR Code đang hoạt động thuộc quầy này.")
    public BaseResponse<Void> deleteCounter(@PathVariable UUID counterId) {
        merchantCounterManager.delete(counterId);
        // Trả về thành công nhưng data là null
        return BaseResponse.success(null, "Quầy hàng đã được xóa (tạm ngưng hoạt động).");
    }

    @GetMapping
    @Operation(summary = "Xem thông tin quầy hàng", description = "Lấy thông tin chi tiết quầy hàng mà Merchant đang quản lý.")
    public BaseResponse<CounterResponse> getMyCounter() {
        CounterResponse data = merchantCounterManager.getDetail();
        return BaseResponse.success(data);
    }
}