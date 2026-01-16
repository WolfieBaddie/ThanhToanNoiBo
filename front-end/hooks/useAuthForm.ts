import { useState, useEffect } from 'react';
import { AuthMode } from '../types';
import React from "react";
interface FormData {
    username: string; // Đổi từ email -> username cho đúng bản chất
    password: string;
    fullName: string;
    phoneNumber: string;
    studentId: string;
    confirmPassword: string;
}

export const useAuthForm = (mode: AuthMode) => {
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        studentId: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form khi chuyển chế độ
    useEffect(() => {
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setErrors({});
    }, [mode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate Username (Email/Account)
        if (!formData.username.trim()) {
            newErrors.username = 'Vui lòng nhập tài khoản hoặc email';
        }

        // Validate Password
        if (mode !== AuthMode.FORGOT_PASSWORD) {
            if (!formData.password) {
                newErrors.password = 'Vui lòng nhập mật khẩu';
            }
        }

        // Validate Register Fields
        if (mode === AuthMode.REGISTER) {
            if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
            if (!formData.studentId.trim()) newErrors.studentId = 'Vui lòng nhập MSSV';

            if (!formData.phoneNumber.trim()) {
                newErrors.phoneNumber = 'Vui lòng nhập SĐT';
            } else if (!/^\d{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
                newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return { formData, errors, handleInputChange, validate };
};