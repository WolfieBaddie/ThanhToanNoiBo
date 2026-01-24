package com.example.thanhtoannoibo.DTO.Request.Counter;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateCounterRequest {
    @NotBlank(message = "Mã quầy không được để trống")
    private String counterCode;

    @NotBlank(message = "Tên quầy không được để trống")
    private String counterName;

    @NotBlank(message = "Loại quầy không được để trống")
    private String counterType; // CANTEEN, KIOSK...

    private String location;

    private UUID managedById; // ID của User (Merchant) quản lý
}