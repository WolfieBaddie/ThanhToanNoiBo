package com.example.thanhtoannoibo.DTO.Response.Catalog;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CatalogDataResponse {
    private List<PackageResponse> packages;
    private PageResponse<UserServiceResponse> services;
}
