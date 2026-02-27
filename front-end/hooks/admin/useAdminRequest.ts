import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {adminRequestService} from "@/services/admin/admin.request.service";
import { AdminRequestFilter, AdminReviewRequest } from '@/types/admin.request.type';
import { toast } from 'react-hot-toast';

const ADMIN_KEYS = {
    REQUESTS: 'admin-merchant-requests',
    DETAIL: 'admin-merchant-request-detail'
};

export const useAdminRequest = () => {
    const queryClient = useQueryClient();

    // --- STATE FILTER & PAGINATION ---
    const [filters, setFilters] = useState<AdminRequestFilter>({
        page: 0,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
        keyword: '',
        status: '',
        fromDate: undefined,
        toDate: undefined
    });

    // --- QUERIES ---

    // 1. Lấy danh sách Request
    const {
        data: requestData,
        isLoading: isLoadingList,
        isFetching: isFetchingList,
        refetch // [ĐÃ BỔ SUNG] Lấy hàm refetch từ React Query
    } = useQuery({
        queryKey: [ADMIN_KEYS.REQUESTS, filters],
        queryFn: () => adminRequestService.getRequests(filters),
        placeholderData: (previousData) => previousData
    });

    // --- MUTATIONS ---

    // 2. Review Request (Duyệt/Từ chối)
    const reviewMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: AdminReviewRequest }) =>
            adminRequestService.reviewRequest(id, data),
        onSuccess: () => {
            // Không cần toast ở đây nếu component cha (Modal) đã xử lý hoặc muốn custom
            // Tuy nhiên invalidate là bắt buộc để list cập nhật
            queryClient.invalidateQueries({ queryKey: [ADMIN_KEYS.REQUESTS] });
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || "Có lỗi xảy ra khi duyệt yêu cầu.";
            toast.error(msg);
        }
    });

    // --- ACTIONS (HANDLERS) ---

    // Chuyển trang
    const setPage = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    // Tìm kiếm
    const handleSearch = (keyword: string) => {
        setFilters(prev => ({ ...prev, keyword, page: 0 }));
    };

    // Lọc theo trạng thái
    const handleFilterStatus = (status: string) => {
        setFilters(prev => ({ ...prev, status, page: 0 }));
    };

    // Lọc theo ngày
    const handleFilterDate = (from?: Date, to?: Date) => {
        setFilters(prev => ({
            ...prev,
            fromDate: from?.toISOString(),
            toDate: to?.toISOString(),
            page: 0
        }));
    };

    // Xem chi tiết
    const fetchRequestDetail = async (id: string) => {
        try {
            return await adminRequestService.getRequestDetail(id);
        } catch (error) {
            toast.error("Không thể tải chi tiết yêu cầu.");
            throw error;
        }
    };

    // Xuất báo cáo
    const exportReport = async (merchantId: string, month: number, year: number) => {
        try {
            // Hiển thị loading toast vì việc tải file có thể mất vài giây
            const promise = adminRequestService.exportReconciliationReport(merchantId, month, year);

            await toast.promise(promise, {
                loading: 'Đang tạo báo cáo...',
                success: 'Đã tải xuống báo cáo thành công!',
                error: 'Lỗi khi xuất báo cáo.'
            });

            return true;
        } catch (error) {
            console.error("Export error:", error);
            return false;
        }
    };

    return {
        // Data
        requests: requestData?.content || [],
        pagination: {
            pageIndex: requestData?.number || 0,
            pageSize: requestData?.size || 10,
            totalPages: requestData?.totalPages || 0,
            totalElements: requestData?.totalElements || 0
        },

        // Loading States
        isLoading: isLoadingList,
        isFetching: isFetchingList,
        isReviewing: reviewMutation.isPending,

        // Filters State
        filters,

        // Actions
        setPage,
        handleSearch,
        handleFilterStatus,
        handleFilterDate,
        fetchRequestDetail,
        exportReport,
        refetch, // [ĐÃ BỔ SUNG] Export hàm này ra để component dùng

        // Review Action
        submitReview: reviewMutation.mutateAsync
    };
};