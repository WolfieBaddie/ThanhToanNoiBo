export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) {
        return '0 xu';
    }

    // 1. Chia cho 1000 để đổi ra Xu
    const creditAmount = amount / 1000;

    // 2. Format số (Dùng locale vi-VN để có dấu chấm phân cách hàng nghìn)
    // Thêm maximumFractionDigits: 2 để nếu chia lẻ (VD: 1500đ -> 1.5 xu) nó vẫn hiện đẹp
    const formattedNumber = new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2
    }).format(creditAmount);

    // 3. Trả về kết quả
    return `${formattedNumber} xu`;
};