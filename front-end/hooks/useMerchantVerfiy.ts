// src/hooks/useMerchantVerfiy.ts

import { useState, useEffect, useMemo } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { qrService } from '@/services/qr.service';
import { QrCodeResponse, ProcessQrResponse, ProcessQrRequest, QrItemRequest } from '@/types/qr.type';
import { ServiceResponse } from "@/types/catalog.type.ts";

interface SelectedItemState {
    quantity: number;
    isSelected: boolean;
    service: ServiceResponse;
}

export const useMerchantVerify = (
    qrData: QrCodeResponse | null,
    onSuccess?: (data: ProcessQrResponse) => void
) => {
    const notify = useNotification();

    // --- STATE ---
    const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemState>>({});
    const [genericQuantity, setGenericQuantity] = useState(1);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Kiểm tra xem đây có phải là Combo/Package không
    const isPackage = useMemo(() => {
        return qrData?.includedServices && qrData.includedServices.length > 0;
    }, [qrData]);

    // --- INIT ---
    useEffect(() => {
        if (qrData && qrData.includedServices && qrData.includedServices.length > 0) {
            const initialMap: Record<string, SelectedItemState> = {};
            qrData.includedServices.forEach(service => {
                initialMap[service.serviceId] = {
                    quantity: 0, // Mặc định là 0
                    isSelected: false,
                    service: service
                };
            });
            setSelectedItems(initialMap);
        } else {
            setGenericQuantity(1);
        }
    }, [qrData]);

    // --- LOGIC TÍNH TOÁN (ĐÃ SỬA) ---

    // 1. Số lượng vé thực tế sẽ bị trừ (Effective Quantity)
    // - SỬA ĐỔI: Chuyển từ Math.max() sang SUM() để cộng dồn số lượng các món.
    // - Ví dụ: 1 Phở + 1 Cafe => Tổng là 2 vé.
    const effectiveQuantity = useMemo(() => {
        if (!isPackage) {
            return genericQuantity;
        }

        // Lấy tổng số lượng của tất cả các món được chọn
        const totalQuantity = Object.values(selectedItems)
            .filter(i => i.isSelected)
            .reduce((sum, item) => sum + item.quantity, 0);

        return totalQuantity;
    }, [isPackage, genericQuantity, selectedItems]);

    // 2. Tổng tiền (Chỉ để hiển thị hoặc tính billAmount)
    const totalBillAmount = useMemo(() => {
        if (!qrData) return 0;
        if (isPackage) {
            return Object.values(selectedItems)
                .filter(item => item.isSelected)
                .reduce((sum, item) => sum + (item.service.unitPrice * item.quantity), 0);
        }
        return qrData.creditAmount * genericQuantity;
    }, [qrData, selectedItems, genericQuantity, isPackage]);

    // 3. Validation Limit
    const isOverLimit = useMemo(() => {
        if (!qrData) return false;
        const remaining = qrData.usageLimit - (qrData.usageCount || 0);
        return effectiveQuantity > remaining;
    }, [effectiveQuantity, qrData]);

    // --- HANDLERS ---
    const toggleItem = (serviceId: string) => {
        setSelectedItems(prev => {
            const current = prev[serviceId];
            const newState = !current.isSelected;
            return {
                ...prev,
                [serviceId]: {
                    ...current,
                    isSelected: newState,
                    // Nếu tick chọn mà đang là 0 thì tự set lên 1
                    quantity: (newState && current.quantity === 0) ? 1 : current.quantity
                }
            };
        });
    };

    const changeQuantity = (serviceId: string, delta: number) => {
        setSelectedItems(prev => {
            const current = prev[serviceId];
            const newQty = Math.max(0, current.quantity + delta);
            return {
                ...prev,
                [serviceId]: {
                    ...current,
                    quantity: newQty,
                    // Tự động bỏ chọn nếu về 0, tự động chọn nếu > 0
                    isSelected: newQty > 0
                }
            };
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    // --- SUBMIT ---
    const submitTransaction = async () => {
        if (!qrData) return;

        if (!imageFile) {
            notify.error("Vui lòng chụp ảnh xác thực.");
            return;
        }

        if (effectiveQuantity <= 0) {
            notify.error("Vui lòng chọn ít nhất 1 món/vé.");
            return;
        }

        if (isOverLimit) {
            notify.error(`Vượt quá giới hạn sử dụng còn lại.`);
            return;
        }

        setIsSubmitting(true);
        try {
            const uploadedImageUrl = await qrService.uploadProof(imageFile);

            const selectedItemsList = Object.values(selectedItems).filter(i => i.isSelected && i.quantity > 0);

            const itemsPayload: QrItemRequest[] = selectedItemsList.map(item => ({
                serviceId: item.service.serviceId,
                quantity: item.quantity
            }));

            // Tạo description chi tiết hơn
            const itemDescriptions = selectedItemsList
                .map(i => `${i.quantity} x ${i.service.serviceName}`)
                .join(", ");

            const description = isPackage
                ? `Đổi ${effectiveQuantity} vé: ${itemDescriptions}`
                : `Sử dụng ${effectiveQuantity} voucher`;

            const requestData: ProcessQrRequest = {
                qrCode: qrData.codeString,
                billAmount: totalBillAmount,
                quantity: effectiveQuantity, // Bây giờ là tổng số lượng các món
                description: description,
                imageUrl: uploadedImageUrl,
                items: isPackage ? itemsPayload : undefined,
                serviceId: (!isPackage && qrData.includedServices?.length === 1)
                    ? qrData.includedServices[0].serviceId
                    : undefined
            };

            const res = await qrService.redeem(requestData);
            notify.success(`Giao dịch thành công!`);
            if (onSuccess) onSuccess(res);

        } catch (error: any) {
            console.error("Redeem Error:", error);
            const msg = error.response?.data?.message || "Giao dịch thất bại.";
            notify.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        selectedItems,
        effectiveQuantity,
        totalBillAmount,
        previewUrl,
        isSubmitting,
        isOverLimit,
        isPackage,
        toggleItem,
        changeQuantity,
        handleImageUpload,
        removeImage,
        submitTransaction,
        genericQuantity,
        setGenericQuantity
    };
};