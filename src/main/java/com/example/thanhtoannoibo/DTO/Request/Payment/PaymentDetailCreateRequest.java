package com.example.thanhtoannoibo.DTO.Request.Payment;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentDetailCreateRequest {
    // If the QR code scanned was bound to a specific service (e.g., "Parking Ticket")
    private UUID serviceId;

    // If the QR code scanned belongs to a specific counter (e.g., "Library Desk")
    private UUID counterId;

    @NotNull
    private BigDecimal quantity;

    @NotNull
    private BigDecimal amount; // Should match the transaction amount usually
}
