package com.example.thanhtoannoibo.Common;

public enum TransacitonType {
    // --- NHÓM NẠP TIỀN (CỘNG XU) ---
    DEPOSIT,        // Nạp Xu vào ví (Từ cổng thanh toán VNPay/VietQR -> UserCredit)
    REFUND,         // Hoàn tiền/Xu lại cho người dùng (Do hủy đơn hoặc khiếu nại)
    TRANSFER_IN,    // Nhận Xu chuyển khoản từ người khác (Nếu sau này làm tính năng P2P)

    // --- NHÓM CHI TIÊU (TRỪ XU) ---
    PAYMENT,        // Thanh toán trực tiếp bằng Xu (Quét QR trừ thẳng vào ví Xu)
    BUY_VOUCHER,    // Dùng Xu để mua Voucher/Vé (Trừ Xu -> Sinh ra UserVoucher)
    TRANSFER_OUT,   // Chuyển Xu cho người khác
}
