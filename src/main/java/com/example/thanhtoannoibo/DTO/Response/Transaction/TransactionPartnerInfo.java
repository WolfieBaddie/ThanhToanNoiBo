package com.example.thanhtoannoibo.DTO.Response.Transaction;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class TransactionPartnerInfo {
    private UUID partnerId;
    private String partnerName;
    private String partnerImage;
    private String partnerType;
    private String subTitle;
}
