package com.example.thanhtoannoibo.Service;
import com.example.thanhtoannoibo.Entity.Wallet.Wallet;
import com.example.thanhtoannoibo.Repository.Wallet.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository; // Inject your repository
    // This would normally be a repository, but keeping it simple for demo
    public Optional<UUID> getWalletIdByUserId(UUID userId) {
        // In real implementation, query the database
        // For demo, return a mock wallet ID
        return walletRepository.findByUserId(userId)
                .map(Wallet::getWalletId);
    }

    public void validateWalletBalance(UUID walletId, BigDecimal amount) {
        // In real implementation, check wallet balance in database
        // For demo, just validate
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Amount must be greater than zero");
        }

        // Mock validation - always pass for demo
        // In real app: check if wallet.balance >= amount
    }

    public boolean processTransfer(UUID senderWalletId, UUID receiverWalletId, BigDecimal amount) {
        // In real implementation, this would update wallet balances
        // and create transaction records

        // For demo, always return true
        return true;
    }
}
