import { axiosClient } from '@/lib/axios-client';
import { GenerateQrRequest, QrCodeResponse, ProcessQrRequest, ProcessQrResponse } from '@/types/qr.type';
import {uploadService} from "@/services/upload.service.ts";

// [HELPER] Hàm xử lý an toàn dữ liệu trả về (Tham khảo từ useNotification)
const ensureObject = <T>(data: any): T => {
    if (typeof data === 'string') {
        try {
            // console.warn("API returned string, parsing manually...");
            const parsed = JSON.parse(data);
            // Nếu parse xong mà nó vẫn bọc trong 'data' hoặc 'result' thì lấy ruột
            return (parsed.data || parsed) as T;
        } catch (e) {
            console.error("JSON Parse error:", e);
            return data as T; // Fallback về data gốc nếu lỗi
        }
    }
    return data as T;
};

export const qrService = {
    /**
     * Sinh mã QR mới
     * POST /api/qrcode/generate
     */
    generateQr: async (data: GenerateQrRequest): Promise<QrCodeResponse> => {
        const response = await axiosClient.post<QrCodeResponse>('/qrcode/generate', data);
        return ensureObject<QrCodeResponse>(response);
    },

    /**
     * [MỚI] Xác nhận thanh toán (Redeem)
     * POST /api/qrcode/redeem
     */
    redeem: async (data: ProcessQrRequest): Promise<ProcessQrResponse> => {
        const response = await axiosClient.post<ProcessQrResponse>('/qrcode/redeem', data);
        return ensureObject<ProcessQrResponse>(response);
    },

    /**
     * [MỚI] Verify QR (Xem trước thông tin khi quét)
     * GET /api/qrcode/verify?code=...
     */
    verifyQr: async (code: string): Promise<QrCodeResponse> => {
        const response = await axiosClient.get<QrCodeResponse>(`/qrcode/verify`, {
            params: { code }
        });
        return ensureObject<QrCodeResponse>(response);
    },

    /**
     * Upload ảnh bằng chứng
     */
    uploadProof: async (file: File): Promise<string> => {
        // Gọi service upload thật
        return await uploadService.uploadToCloudinary(file);
    },

    // Alias tên hàm cho đồng bộ với file frontend bạn gửi trước đó (có nơi gọi là uploadProofImage)
    uploadProofImage: async (file: File): Promise<string> => {
        return await uploadService.uploadToCloudinary(file);
    }
};