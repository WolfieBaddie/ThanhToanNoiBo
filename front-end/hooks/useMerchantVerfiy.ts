// src/hooks/useMerchantVerify.ts

import { useState, useEffect, useMemo } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { qrService } from '@/services/qr.service';
import { QrCodeResponse, ProcessQrResponse, ProcessQrRequest, QrItemRequest } from '@/types/qr.type';
import { ServiceResponse } from "@/types/catalog.type.ts";
import {uploadService} from "@/services/upload.service.ts";

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

    // --- 1. PHÂN LOẠI ---
    const comboType = qrData?.comboType;
    const isSelectOne = comboType === 'SELECT_ONE';
    const isAllInclusive = comboType === 'ALL_INCLUSIVE'; // Quan trọng
    const isSingle = !comboType;

    // --- 2. STATE ---
    const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemState>>({});
    const [genericQuantity, setGenericQuantity] = useState(1); // Dùng cho vé lẻ
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 3. INIT STATE (Áp dụng cho cả COMBO) ---
    useEffect(() => {
        if ((isSelectOne || isAllInclusive) && qrData?.includedServices) {
            const initialSelection: Record<string, SelectedItemState> = {};
            qrData.includedServices.forEach((s) => {
                initialSelection[s.serviceId] = {
                    quantity: 1,
                    isSelected: false, // Mặc định chưa chọn, để Merchant hỏi khách
                    service: s
                };
            });
            setSelectedItems(initialSelection);
        }
    }, [qrData, isSelectOne, isAllInclusive]);

    // --- 4. TÍNH TỔNG SỐ LƯỢNG ĐANG CHỌN ---
    const currentTotalQuantity = useMemo(() => {
        if (isSingle) return genericQuantity;
        return Object.values(selectedItems)
            .filter(item => item.isSelected)
            .reduce((sum, item) => sum + item.quantity, 0);
    }, [selectedItems, isSingle, genericQuantity]);

    // Lấy limit của QR (Số gói khách mua)
    const qrPackageLimit = useMemo(() => qrData?.usageLimit ?? 1, [qrData]);

    // --- 5. LOGIC CHECK LIMIT (QUAN TRỌNG NHẤT) ---
    const isOverLimit = useMemo(() => {
        if (isSingle) return currentTotalQuantity > (qrData?.totalRemainingUsage ?? 999);

        if (isSelectOne) {
            // Select One: Tổng món chọn KHÔNG ĐƯỢC VƯỢT quá số lượt gói
            // VD: Mua 1 gói -> Chỉ được chọn 1 Phở HOẶC 1 Cafe (Tổng = 1)
            return currentTotalQuantity > qrPackageLimit;
        }

        if (isAllInclusive) {
            // All Inclusive: Tổng món chọn KHÔNG CẦN check với số gói.
            // Vì mua 1 gói (Phở + Cafe) -> Tổng item là 2.
            // Chỉ cần check tồn kho từng món (đã làm ở hàm changeQuantity).
            // Check sơ bộ: Không được chọn quá tổng số item thực tế đang có
            // (Logic này check ở toggleItem rồi nên ở đây return false hoặc check lỏng)
            return false;
        }

        return false;
    }, [currentTotalQuantity, qrPackageLimit, isSelectOne, isAllInclusive, isSingle, qrData]);

    // --- 6. ACTIONS ---
    const toggleItem = (serviceId: string) => {
        // Cho phép cả 2 loại Combo đều được toggle
        if (isSingle) return;

        setSelectedItems(prev => {
            const current = prev[serviceId];
            if (!current) return prev;

            // Nếu tích chọn
            if (!current.isSelected) {
                // Check tồn kho riêng của món đó
                const itemRemaining = current.service.remainingQuantity ?? 999;
                if (itemRemaining <= 0) {
                    notify.error("Món này đã hết lượt dùng!");
                    return prev;
                }

                // Check Logic Combo
                if (isSelectOne) {
                    // Select One: Cộng dồn không được quá limit gói
                    if (currentTotalQuantity + current.quantity > qrPackageLimit) {
                        notify.error(`Gói này chỉ được chọn tối đa ${qrPackageLimit} món.`);
                        return prev;
                    }
                }
                // All Inclusive: Không cần check tổng, chỉ cần check món đó còn hàng (đã check ở trên)
            }
            return { ...prev, [serviceId]: { ...current, isSelected: !current.isSelected } };
        });
    };

    const changeQuantity = (serviceId: string, delta: number) => {
        if (isSingle) return;

        setSelectedItems(prev => {
            const current = prev[serviceId];
            if (!current) return prev;
            const newQty = current.quantity + delta;

            if (newQty < 1) return prev; // Không cho giảm dưới 1

            if (delta > 0) {
                // 1. Luôn check tồn kho món đó
                const itemMax = current.service.remainingQuantity ?? 999;
                if (newQty > itemMax) {
                    notify.error(`Món này chỉ còn ${itemMax} phần.`);
                    return prev;
                }

                // 2. Nếu là Select One -> Check tổng
                if (isSelectOne) {
                    if (currentTotalQuantity + delta > qrPackageLimit) {
                        notify.error(`Vượt quá giới hạn gói.`);
                        return prev;
                    }
                }
            }
            return { ...prev, [serviceId]: { ...current, quantity: newQty } };
        });
    };

    // --- IMAGE HANDLER ---
    const handleImageUpload = (file: File) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            notify.error("Kích thước ảnh không được vượt quá 5MB");
            return;
        }
        setImageFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        try {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } catch (e) {
            console.error("Error creating object URL", e);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const submitTransaction = async () => {
        if (!qrData) return;
        setIsSubmitting(true);

        try {
            // [CHỈ SỬA Ở ĐÂY] Thực thi up ảnh lên Cloudinary nếu Merchant có đính kèm ảnh
            let uploadedUrl = "";
            if (imageFile) {
                uploadedUrl = await uploadService.uploadToCloudinary(imageFile);
            }

            // CHUẨN BỊ PAYLOAD
            let itemsPayload: QrItemRequest[] | undefined = undefined;
            let description = "";

            if (isSelectOne || isAllInclusive) {
                // CẢ 2 LOẠI COMBO ĐỀU GỬI LIST ITEMS
                itemsPayload = Object.values(selectedItems)
                    .filter(item => item.isSelected)
                    .map(item => ({
                        serviceId: item.service.serviceId,
                        quantity: item.quantity
                    }));

                if (itemsPayload.length === 0) {
                    notify.error("Vui lòng chọn món cần trừ.");
                    setIsSubmitting(false);
                    return;
                }

                const detailText = Object.values(selectedItems)
                    .filter(i => i.isSelected)
                    .map(i => `${i.quantity} ${i.service.serviceName}`)
                    .join(", ");
                description = `Đổi: ${detailText}`;

            } else {
                // VÉ LẺ
                itemsPayload = undefined;
                description = `Sử dụng ${genericQuantity} vé lẻ`;
            }

            // Gửi request
            const requestData: ProcessQrRequest = {
                qrCode: qrData.codeString,
                billAmount: 0,
                // Với Combo: Gửi tổng số món. Backend All Inclusive sẽ dùng list items để trừ.
                quantity: isSingle ? genericQuantity : currentTotalQuantity,
                description: description,
                imageUrl: uploadedUrl,
                items: itemsPayload,
                serviceId: (isSingle && qrData.includedServices?.length === 1)
                    ? qrData.includedServices[0].serviceId
                    : undefined
            };

            const res = await qrService.redeem(requestData);
            notify.success(`Giao dịch thành công!`);
            if (onSuccess) onSuccess(res);

        } catch (error: any) {
            // ... Error handling
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        selectedItems,
        genericQuantity,
        setGenericQuantity,
        effectiveQuantity: isSingle ? genericQuantity : currentTotalQuantity,
        totalBillAmount: 0,
        previewUrl,
        isSubmitting,
        isOverLimit,
        isSelectOne,
        isAllInclusive,
        isSingle,
        toggleItem,
        changeQuantity,
        handleImageUpload,
        removeImage,
        submitTransaction,
        // ...
    };
};