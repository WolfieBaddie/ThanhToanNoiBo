import { useState } from 'react';
import { paymentService } from '../services/payment.service';
import { PaymentRequest, PaymentDetailResponse } from '../types/payment.types';
// import { useNavigate } from 'react-router-dom'; // Bật lại nếu cần dùng navigate

interface UsePaymentReturn {
    isLoading: boolean;
    error: string | null;
    paymentReceipt: PaymentDetailResponse | null;
    initiatePayment: (data: PaymentRequest) => Promise<void>;
    verifyPaymentCallback: (queryParams: URLSearchParams) => Promise<void>;
}

export const usePayment = (): UsePaymentReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentReceipt, setPaymentReceipt] = useState<PaymentDetailResponse | null>(null);
    // const navigate = useNavigate();

    // 1. Hàm bắt đầu thanh toán
    const initiatePayment = async (data: PaymentRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            // Service đã trả về VnPayResponse (gồm paymentUrl)
            const response = await paymentService.createPayment(data);

            if (response.paymentUrl) {
                // Chuyển hướng sang VNPay
                window.location.href = response.paymentUrl;
            } else {
                setError("Hệ thống không trả về đường dẫn thanh toán.");
            }
        } catch (err: any) {
            console.error("Payment Error:", err);
            // Axios error thường nằm trong err.response.data
            setError(err.response?.data?.message || "Lỗi khi khởi tạo thanh toán.");
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Hàm xác thực khi quay về
    const verifyPaymentCallback = async (queryParams: URLSearchParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const receipt = await paymentService.verifyPayment(queryParams);
            setPaymentReceipt(receipt);
        } catch (err: any) {
            console.error("Verify Error:", err);
            setError(err.response?.data?.message || "Xác thực thanh toán thất bại.");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        paymentReceipt,
        initiatePayment,
        verifyPaymentCallback
    };
};