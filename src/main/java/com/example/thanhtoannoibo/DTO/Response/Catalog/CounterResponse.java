package com.example.thanhtoannoibo.DTO.Response.Catalog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CounterResponse {
    private UUID counterId;
    private String counterCode;
    private String counterName;
    private String counterType;
    private String location;
    private String deviceIdentifier;
    private String status;
    private String createdBy;
}
