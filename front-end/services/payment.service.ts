import { axiosClient } from '../lib/axios-client'; // Kiểm tra lại đường dẫn import này cho đúng với cấu trúc dự án của bạn
import { PaymentRequest, VnPayResponse, PaymentDetailResponse } from '../types/payment.types';

export const paymentService = {
    /**
     * Gọi API: POST /api/payment/create-payment
     * Tạo giao dịch và lấy URL thanh toán VNPay
     */
    createPayment: async (data: PaymentRequest): Promise<VnPayResponse> => {
        // 1. URL: Chỉ để '/payment/...' vì BASE_URL đã có '/api'
        // 2. Return: Trả về trực tiếp response (vì nó chính là data)
        const response = await axiosClient.post<VnPayResponse>('/payment/create-payment', data);
        return response as unknown as VnPayResponse;
    },

    /**
     * Gọi API: GET /api/payment/vnpay-return
     * Xác thực chữ ký và lấy thông tin hóa đơn sau khi VNPay redirect về
     */
    verifyPayment: async (queryParams: URLSearchParams): Promise<PaymentDetailResponse> => {
        const params = Object.fromEntries(queryParams.entries());

        // 1. Gọi API
        // Interceptor của axiosClient đã lấy cục data JSON ra rồi
        const response = await axiosClient.get<PaymentDetailResponse>('/payment/vnpay-return', {
            params: params
        });

        // 2. LOG DEBUG (Để bạn kiểm tra xem dữ liệu về chưa)
        console.log("🔥 [Service] Verify Response:", response);

        // 3. RETURN TRỰC TIẾP (Tuyệt đối không dùng response.data ở đây nữa)
        return response as unknown as PaymentDetailResponse;
    }
};