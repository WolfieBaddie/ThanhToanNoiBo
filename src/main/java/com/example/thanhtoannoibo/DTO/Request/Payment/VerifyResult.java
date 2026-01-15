package com.example.thanhtoannoibo.DTO.Request.Payment;

import lombok.*;

@Getter
@Setter
@Data
@NoArgsConstructor
public class VerifyResult {
    public boolean isSuccess;
    public String result;
    public String message;
    public String transactionRef;
}
