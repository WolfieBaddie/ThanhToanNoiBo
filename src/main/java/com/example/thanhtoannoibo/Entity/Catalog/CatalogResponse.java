package com.example.thanhtoannoibo.Entity.Catalog;

import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import lombok.*;

import java.util.List;
@Data
@Builder
public class CatalogResponse {
    private List<PackageResponse> packages;
    private PageResponse<ServiceResponse> services;
}
