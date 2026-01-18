export const formatCurrency = (amount: number | undefined | null, type?: string): string => {
    if (amount === undefined || amount === null) {
        return '0 xu';
    }

    // 1. Đổi ra Xu (Chia 1000) và lấy giá trị tuyệt đối để format số đẹp trước
    let displayAmount = Math.abs(Number(amount) / 1000);

    // 2. Format số (Dùng locale vi-VN) -> Kết quả dạng chuỗi "15" hoặc "15,5"
    let formattedString = new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2
    }).format(displayAmount);

    // 3. Xử lý dấu: Nếu là giao dịch chi tiêu -> Ghép dấu "-" vào trước chuỗi
    const spendingTypes = ['BUY_VOUCHER', 'PAYMENT', 'TRANSFER', 'OUT'];

    if (type && spendingTypes.includes(type)) {
        formattedString = "-" + formattedString;
    }

    return `${formattedString} xu`;
};