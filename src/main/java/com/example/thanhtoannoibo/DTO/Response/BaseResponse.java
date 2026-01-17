package com.example.thanhtoannoibo.DTO.Response;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseResponse<T> {
    private int code;           // Mã trạng thái (200, 400, 401...)
    private String message;     // Thông báo ("Thành công", "Lỗi hệ thống",...)
    private T data;             // Dữ liệu chính (LoginResponse, VnPayResponse...)

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // --- Helper Methods để gọi nhanh trong Controller ---

    public static <T> BaseResponse<T> success(T data) {
        return BaseResponse.<T>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(data)
                .build();
    }

    public static <T> BaseResponse<T> success(T data, String message) {
        return BaseResponse.<T>builder()
                .code(HttpStatus.OK.value())
                .message(message)
                .data(data)
                .build();
    }

    public static <T> BaseResponse<T> error(int code, String message) {
        return BaseResponse.<T>builder()
                .code(code)
                .message(message)
                .data(null)
                .build();
    }
}
