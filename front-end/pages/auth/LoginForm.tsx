import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useAuthForm } from '../../hooks/useAuthForm';
import { AuthMode } from '../../types';

interface LoginFormProps {
    onSuccess: () => void;
    onForgotPassword: () => void;
    onError: (msg: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword, onError }) => {
    // Lấy trạng thái loading từ AuthContext (để đồng bộ với quá trình call API)
    const { login, isLoading: isAuthLoading } = useAuth();

    // State local để xử lý validation form
    const { formData, errors, handleInputChange, validate } = useAuthForm(AuthMode.LOGIN);
    const [rememberMe, setRememberMe] = useState(false);

    // State loading cục bộ (phòng hờ nếu bạn muốn control riêng)
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate Form
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            // 2. Gọi API Login
            await login({ username: formData.username, password: formData.password });

            // 3. Nếu thành công -> Gọi callback (AuthPage xử lý)
            // Lưu ý: Lúc này AuthContext đã update user -> App sẽ redirect ngay lập tức
            onSuccess();
        } catch (err: any) {
            // 4. Nếu lỗi -> Hiển thị lỗi
            console.error("Login Error:", err);
            onError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
            setIsSubmitting(false); // Mở lại nút để bấm tiếp
        }
    };

    // Kết hợp cả 2 trạng thái loading để disable nút chắc chắn nhất
    const isLoading = isAuthLoading || isSubmitting;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
                label="Email / Tài khoản"
                name="username"
                type="text"
                placeholder="phuhuynh@example.com"
                icon={<Mail size={20} />}
                value={formData.username}
                onChange={handleInputChange}
                error={errors.username}
                disabled={isLoading}
            />

            <Input
                label="Mật khẩu"
                name="password"
                type="password"
                placeholder="Nhập mật khẩu"
                icon={<Lock size={20} />}
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                disabled={isLoading}
            />

            <div className="flex items-center justify-between -mt-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}>
                        {rememberMe && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Ghi nhớ đăng nhập</span>
                </label>

                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm font-bold text-indigo-600 hover:text-purple-600 transition-colors hover:underline"
                    disabled={isLoading}
                >
                    Quên mật khẩu?
                </button>
            </div>

            <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                disabled={isLoading}
                className="mt-4 py-3.5 text-lg shadow-xl shadow-indigo-200"
            >
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                {!isLoading && <ArrowRight size={18} />}
            </Button>
        </form>
    );
};