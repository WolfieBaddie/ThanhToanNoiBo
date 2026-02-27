import { useState, useEffect, useCallback } from 'react';
import { adminRoleService } from '@/services/admin/admin.role.service';
import { RoleResponse } from '@/types/role.type';

export const useAdminRoles = () => {
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminRoleService.getAllRoles();
            setRoles(data);
        } catch (err: any) {
            console.error("Error fetching roles:", err);
            setError(err.response?.data?.message || "Lỗi tải danh sách vai trò");
        } finally {
            setLoading(false);
        }
    }, []);

    // Tự động gọi API khi mount
    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    return {
        roles,
        loading,
        error,
        refresh: fetchRoles
    };
};