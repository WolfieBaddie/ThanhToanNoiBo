import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantService } from "@/services/merchant.request.service";
import { uploadService } from "@/services/upload.service";
import { toast } from 'react-hot-toast';
import { MerchantSubmitRequest } from "@/types/merchant.request.type";
import React from "react";

const MERCHANT_KEYS = {
    REQUESTS: ['merchant', 'requests'],
    RECONCILIATION: ['merchant', 'reconciliation'],
    DETAIL: (id: string) => ['merchant', 'request', id] // Key cho detail
};

export const useMerchant = () => {
    const queryClient = useQueryClient();

    // --- STATE QUẢN LÝ ẢNH ---
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // 1. Hàm xử lý khi chọn file
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File quá lớn. Vui lòng chọn ảnh < 5MB");
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error("Vui lòng chọn file ảnh hợp lệ");
                return;
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (previewUrl && !previewUrl.startsWith('http')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    };

    // --- ACTIONS ---
    const refreshRequests = () => {
        queryClient.invalidateQueries({ queryKey: MERCHANT_KEYS.REQUESTS });
    };

    const exportExcel = () => {
        try {
            const url = merchantService.getExportReconciliationUrl();
            window.location.href = url;
            toast.success("Đang bắt đầu tải file đối soát...");
        } catch (error) {
            toast.error("Không thể tải file đối soát lúc này.");
        }
    };

    // [MỚI] Hàm gọi API chi tiết (Dùng để gọi trực tiếp hoặc wrap vào useQuery ở component con)
    const getRequestDetail = async (id: string) => {
        try {
            return await merchantService.getRequestDetail(id);
        } catch (error) {
            toast.error("Không thể tải chi tiết yêu cầu");
            throw error;
        }
    };

    // --- QUERIES ---
    const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
        queryKey: MERCHANT_KEYS.REQUESTS,
        queryFn: merchantService.getMyRequests,
    });

    const { data: reconciliationData = [], isLoading: isLoadingReport, refetch: refetchReport } = useQuery({
        queryKey: MERCHANT_KEYS.RECONCILIATION,
        queryFn: merchantService.getReconciliation,
    });

    // --- MUTATIONS ---
    const submitMutation = useMutation({
        mutationFn: async (data: MerchantSubmitRequest) => {
            let finalQrUrl = data.qrPaymentUrl;

            // Logic upload ảnh
            if (imageFile) {
                try {
                    const uploadedUrl = await uploadService.uploadToCloudinary(imageFile);
                    finalQrUrl = uploadedUrl;
                } catch (err) {
                    console.error("Upload Error:", err);
                    throw new Error("Lỗi khi tải ảnh lên Cloudinary.");
                }
            }

            return merchantService.submitRequest({
                ...data,
                qrPaymentUrl: finalQrUrl
            });
        },
        onSuccess: () => {
            refreshRequests();
            toast.success("Cập nhật thông tin thành công!");
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || error.message || "Gửi yêu cầu thất bại";
            toast.error(msg);
        }
    });

    return {
        requests,
        isLoadingRequests,
        reconciliationData,
        isLoadingReport,

        // Image State
        imageFile,
        previewUrl,
        setPreviewUrl,
        handleImageUpload,
        removeImage,

        // Actions
        refreshRequests,
        exportExcel,
        getRequestDetail, // <--- Đã export function này

        submitRequest: submitMutation.mutateAsync,
        isSubmitting: submitMutation.isPending,
        refreshReport: refetchReport
    };
};