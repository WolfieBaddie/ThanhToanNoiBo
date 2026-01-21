import { axiosClient } from '@/lib/axios-client';
import {
    BuyPackageRequest,
    BuyVoucherRequest,
    BuyVoucherResponse, ExchangeVoucherRequest,
    PageResponse,
    UserVoucherResponse,
    VoucherFilters,
    GenerateOtpRequest,
    GenerateOtpResponse
} from '@/types/voucher.type';

export const voucherService = {

    generateOtp: async (actionType: 'TRANSACTION'): Promise<GenerateOtpResponse> => {
        const response = await axiosClient.post<GenerateOtpResponse>('/auth/otp/generate', {
            actionType
        } as GenerateOtpRequest);
        return response as unknown as GenerateOtpResponse;
    },

    /**
     * Lấy danh sách voucher của user đang đăng nhập
     * GET /api/vouchers/my-vouchers
     */
    getMyVouchers: async (filters: VoucherFilters): Promise<PageResponse<UserVoucherResponse>> => {
        const params = {
            page: filters.page,
            size: filters.size,
            // Chỉ gửi status/code nếu có giá trị
            ...(filters.status && { status: filters.status }),
            ...(filters.code && { code: filters.code }),
        };

        // axiosClient đã xử lý BaseResponse -> trả về PageResponse
        const response = await axiosClient.get<PageResponse<UserVoucherResponse>>('/vouchers/my-vouchers', {
            params
        });

        return response as unknown as PageResponse<UserVoucherResponse>;
    },

    /**
     * Lấy chi tiết voucher
     * GET /api/vouchers/{id}
     */
    getVoucherDetail: async (id: string): Promise<UserVoucherResponse> => {
        const response = await axiosClient.get<UserVoucherResponse>(`/vouchers/${id}`);
        return response as unknown as UserVoucherResponse;
    },

    buyVoucher: async (data: BuyVoucherRequest): Promise<BuyVoucherResponse> => {
        // axiosClient đã gỡ BaseResponse, trả về data bên trong
        const response = await axiosClient.post<BuyVoucherResponse>('/vouchers/buy', data);
        return response as unknown as BuyVoucherResponse;
    },

    exchangeVoucher: async (data: ExchangeVoucherRequest): Promise<BuyVoucherResponse> => {
        const response = await axiosClient.post<BuyVoucherResponse>('/vouchers/exchange', data);
        return response as unknown as BuyVoucherResponse;
    },

    buyPackage: async (data: BuyPackageRequest): Promise<BuyVoucherResponse> => {
        const response = await axiosClient.post<BuyVoucherResponse>('/vouchers/buy-package', data);
        return response as unknown as BuyVoucherResponse;
    }
};