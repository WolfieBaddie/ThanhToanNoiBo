package com.example.thanhtoannoibo.DTO.Response;

import lombok.*;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private int page;           // Trang hiện tại (0-index)
    private int size;           // Kích thước trang
    private long totalItems;    // Tổng số phần tử
    private int totalPages;     // Tổng số trang
    private List<T> items;      // Danh sách dữ liệu

    // Hàm tiện ích để convert từ Spring Page sang Custom PageResponse
    public static <T> PageResponse<T> from(Page<T> pageData) {
        return PageResponse.<T>builder()
                .page(pageData.getNumber())
                .size(pageData.getSize())
                .totalItems(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .items(pageData.getContent())
                .build();
    }
}