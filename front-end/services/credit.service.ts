import { axiosClient } from "@/lib/axios-client"; // Đảm bảo đường dẫn import đúng
import { UserCreditInfoResponse } from '../types/credit.types';

export const creditService = {
    /**
     * Gọi API lấy thông tin ví user
     * GET /api/v1/credits/{userId}
     */
    getUserCredit: async (userId: string): Promise<UserCreditInfoResponse> => {
        console.log(`%c[CreditService] Fetching credit for UserID: ${userId}`, "color: blue; font-weight: bold;");

        // 1. Gọi API (Interceptor đã trả về data raw)
        const response = await axiosClient.get<UserCreditInfoResponse>(`/v1/credits/${userId}`);

        // 2. LOG QUAN TRỌNG: Kiểm tra cấu trúc thực tế trả về
        console.log("[CreditService] Response received:", response);

        // 3. Return trực tiếp (Không dùng .data nữa)
        // Ép kiểu để TypeScript không báo lỗi
        return response as unknown as UserCreditInfoResponse;
    }
};