export interface UserCreditInfoResponse {
    balance: number;
    totalDeposited: number;

    // Spending Control
    dailyLimitAmount: number | null;
    currentDaySpending: number;
    remainingDailyLimit: number | null;

    // Khai báo cả 2 kiểu tên để tránh lỗi hiển thị
    isUnlimited?: boolean;
    unlimited?: boolean;
}