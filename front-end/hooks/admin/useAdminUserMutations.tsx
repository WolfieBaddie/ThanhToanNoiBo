import { useState } from 'react';
import { adminUserService } from '@/services/admin/admin.user.service';
import { CreateUserRequest, UpdateUserRequest } from '@/types/user.type';
import { uploadService } from '@/services/upload.service'; // Import service upload
import { toast } from "react-hot-toast";

export const useAdminUserMutations = (onSuccess?: () => void) => {
    const [loading, setLoading] = useState(false);

    // 1. Create Action (Tích hợp Upload)
    const createUser = async (data: CreateUserRequest, file?: File | null) => {
        setLoading(true);
        try {
            // Bước 1: Nếu có file ảnh, upload trước để lấy URL
            let finalImageUrl = data.imageUrl;
            if (file) {
                try {
                    finalImageUrl = await uploadService.uploadToCloudinary(file);
                } catch (upErr) {
                    toast.error("Lỗi upload ảnh, vui lòng thử lại hoặc bỏ qua ảnh.");
                    setLoading(false);
                    return false;
                }
            }

            // Bước 2: Gọi API tạo user với URL ảnh đã có
            const payload = { ...data, imageUrl: finalImageUrl };
            await adminUserService.createUser(payload);

            toast.success(`Đã tạo người dùng ${data.username} thành công`);
            if (onSuccess) onSuccess();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Tạo người dùng thất bại");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // 2. Update Action (Tích hợp Upload)
    const updateUser = async (userId: string, data: UpdateUserRequest, file?: File | null) => {
        setLoading(true);
        try {
            // Bước 1: Upload ảnh nếu có file mới được chọn
            let finalImageUrl = data.imageUrl;
            if (file) {
                try {
                    finalImageUrl = await uploadService.uploadToCloudinary(file);
                } catch (upErr) {
                    toast.error("Lỗi upload ảnh.");
                    setLoading(false);
                    return false;
                }
            }

            // Bước 2: Gọi API update
            const payload = { ...data, imageUrl: finalImageUrl };
            await adminUserService.updateUser(userId, payload);

            toast.success("Cập nhật thông tin thành công");
            if (onSuccess) onSuccess();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Cập nhật thất bại");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // 3. Delete Action
    const deleteUser = async (userId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa người dùng này? Các tài sản liên quan sẽ bị vô hiệu hóa.")) return;

        setLoading(true);
        try {
            await adminUserService.deleteUser(userId);
            toast.success("Đã xóa người dùng thành công");
            if (onSuccess) onSuccess();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Xóa thất bại");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        createUser,
        updateUser,
        deleteUser,
        loading
    };
};