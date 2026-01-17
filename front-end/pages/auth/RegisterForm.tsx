import React, { useState } from 'react';
import { User, Phone, GraduationCap, Lock, CheckCircle2, Mail, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthForm } from '../../hooks/useAuthForm';
import { AuthMode } from '../../types';

interface RegisterFormProps {
    onSwitchMode: () => void;
    onError: (msg: string) => void;
    onSuccess?: (msg: any) => void; // Callback để hiện thông báo ở Page cha
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchMode, onError, onSuccess }) => {
    // Sử dụng hook quản lý form với mode REGISTER
    const { formData, errors, handleInputChange, validate } = useAuthForm(AuthMode.REGISTER);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate Form
        if (!validate()) {
            onError('Vui lòng kiểm tra lại thông tin nhập liệu');
            return;
        }

        setIsLoading(true);

        // 2. Giả lập gọi API Register (Sau này sẽ thay bằng authService.register)
        // Hiện tại Backend AuthController chưa có endpoint public register đầy đủ flow này
        setTimeout(() => {
            setIsLoading(false);

            // Tạo nội dung thông báo thành công (JSX)
            const successMessage = (
                <div className="flex flex-col gap-1">
                    <span>Chào mừng <span className="font-bold text-slate-800">{formData.fullName}</span>!</span>
                    <span>Tài khoản liên kết với <span className="font-bold text-indigo-600 font-mono">{formData.studentId}</span>.</span>
                    <span className="text-xs text-slate-400 mt-1">Vui lòng đăng nhập để bắt đầu.</span>
                </div>
            );

            if (onSuccess) onSuccess(successMessage);

            // Chuyển về trang đăng nhập
            onSwitchMode();
        }, 1500);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Nhóm thông tin cá nhân */}
            <Input
                label="Họ tên Phụ huynh"
                name="fullName"
                placeholder="Nguyễn Văn A"
                icon={<User size={20} />}
                value={formData.fullName}
                onChange={handleInputChange}
                error={errors.fullName}
            />

            <Input
                label="Mã số học sinh (MSSV)"
                name="studentId"
                placeholder="Ví dụ: HS2024001"
                icon={<GraduationCap size={20} />}
                value={formData.studentId}
                onChange={handleInputChange}
                error={errors.studentId}
            />

            <Input
                label="Số điện thoại liên hệ"
                name="phoneNumber"
                type="tel"
                placeholder="0912 345 678"
                icon={<Phone size={20} />}
                value={formData.phoneNumber}
                onChange={handleInputChange}
                error={errors.phoneNumber}
            />

            {/* Nhóm tài khoản */}
            <div className="my-4 border-t border-slate-100"></div>

            <Input
                label="Email / Tài khoản"
                name="username"
                placeholder="phuhuynh@example.com"
                icon={<Mail size={20} />}
                value={formData.username}
                onChange={handleInputChange}
                error={errors.username}
            />

            <Input
                label="Mật khẩu"
                name="password"
                type="password"
                placeholder="Tạo mật khẩu"
                icon={<Lock size={20} />}
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                showStrength={true} // Input mới sẽ render thanh sức mạnh đẹp hơn ở đây
            />

            <Input
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                icon={<CheckCircle2 size={20} />}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
            />

            <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                className="mt-4 py-3.5 text-lg shadow-xl shadow-indigo-200"
            >
                Đăng ký Tài khoản {!isLoading && <ArrowRight size={18} />}
            </Button>
        </form>
    );
};