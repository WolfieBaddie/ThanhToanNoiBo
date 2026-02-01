import { useState } from 'react';
import { adminUserService } from '@/services/admin/admin.user.service';
import { CreateUserRequest, UpdateUserRequest, UserResponse } from '@/types/user.type';
import {toast} from "react-hot-toast";

export const useAdminUserActions = (onSuccess?: () => void) => {
    const [loading, setLoading] = useState(false);

    // 1. Create Action
    const createUser = async (data: CreateUserRequest) => {
        setLoading(true);
        try {
            await adminUserService.createUser(data);
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

    // 2. Update Action
    const updateUser = async (userId: string, data: UpdateUserRequest) => {
        setLoading(true);
        try {
            await adminUserService.updateUser(userId, data);
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