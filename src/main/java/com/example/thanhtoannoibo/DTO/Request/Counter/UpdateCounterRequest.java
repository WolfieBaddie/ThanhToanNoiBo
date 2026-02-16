package com.example.thanhtoannoibo.DTO.Request.Counter;
import lombok.Data;

@Data
public class UpdateCounterRequest {
    private String counterName;
    private String location;
    private String deviceIdentifier;
    private String status;
}
