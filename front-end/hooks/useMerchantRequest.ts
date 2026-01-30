import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantService } from "@/services/merchant.request.service";
import { uploadService } from "@/services/upload.service"; // Import service upload chuẩn
import { toast } from 'react-hot-toast';
import { MerchantSubmitRequest } from "@/types/merchant.request.type";
import React from "react";
const MERCHANT_KEYS = {
    REQUESTS: ['merchant', 'requests'],
    RECONCILIATION: ['merchant', 'reconciliation'],
};

export const useMerchant = () => {
    const queryClient = useQueryClient();

    // --- STATE QUẢN LÝ ẢNH ---
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // 1. Hàm xử lý khi chọn file từ input
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate kích thước (Ví dụ: < 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File quá lớn. Vui lòng chọn ảnh < 5MB");
                return;
            }

            // Validate loại file
            if (!file.type.startsWith('image/')) {
                toast.error("Vui lòng chọn file ảnh (JPG, PNG)");
                return;
            }

            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Tạo preview local
        }
    };

    // 2. Hàm xóa ảnh đang chọn
    const removeImage = () => {
        setImageFile(null);
        if (previewUrl && !previewUrl.startsWith('http')) {
            // Chỉ revoke nếu là blob url local
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    };

    // --- ACTIONS KHÁC ---
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

            // [LOGIC CHUẨN] Nếu có chọn ảnh mới -> Upload lên Cloudinary trước
            if (imageFile) {
                try {
                    // Sử dụng uploadService đã có sẵn trong dự án
                    const uploadedUrl = await uploadService.uploadToCloudinary(imageFile);
                    finalQrUrl = uploadedUrl;
                } catch (err) {
                    console.error("Upload Error:", err);
                    throw new Error("Lỗi khi tải ảnh lên Cloudinary. Vui lòng thử lại.");
                }
            }

            // Gửi request cập nhật thông tin kèm URL ảnh đã có
            return merchantService.submitRequest({
                ...data,
                qrPaymentUrl: finalQrUrl
            });
        },
        onSuccess: () => {
            refreshRequests();
            // Không reset imageFile ngay để user thấy kết quả, hoặc reset tùy logic UX
            // removeImage();
            toast.success("Cập nhật thông tin thành công!");
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || error.message || "Gửi yêu cầu thất bại";
            toast.error(msg);
        }
    });

    return {
        // Data List
        requests,
        isLoadingRequests,
        reconciliationData,
        isLoadingReport,

        // Image State & Handlers
        imageFile,
        previewUrl,
        setPreviewUrl, // Dùng để set ảnh cũ từ user profile vào preview
        handleImageUpload,
        removeImage,

        // Actions
        refreshRequests,
        exportExcel,

        // Submit
        submitRequest: submitMutation.mutateAsync,
        isSubmitting: submitMutation.isPending,
        refreshReport: refetchReport
    };
};