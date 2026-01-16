import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthForm } from '../../hooks/useAuthForm';
import { AuthMode } from '../../types';

interface ForgotPasswordFormProps {
    onBack: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
    const { formData, errors, handleInputChange, validate } = useAuthForm(AuthMode.FORGOT_PASSWORD);
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);

        // Giả lập gọi API gửi mail reset
        setTimeout(() => {
            setIsLoading(false);
            setIsSent(true); // Chuyển sang trạng thái đã gửi
        }, 1500);
    };

    // UI khi đã gửi thành công
    if (isSent) {
        return (
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <Mail size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Đã gửi liên kết!</h3>
                <p className="text-slate-600 mb-6 text-sm">
                    Vui lòng kiểm tra hộp thư <strong>{formData.username}</strong> để đặt lại mật khẩu của bạn.
                </p>
                <Button onClick={onBack} fullWidth variant="outline">
                    <ArrowLeft size={18} className="mr-2" /> Quay lại đăng nhập
                </Button>
            </div>
        );
    }

    // UI Form nhập email
    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-800 mb-2">
                Nhập địa chỉ email hoặc tài khoản bạn đã đăng ký. Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.
            </div>

            <Input
                label="Email đăng ký"
                name="username"
                type="email"
                placeholder="nhap_email@example.com"
                icon={<Mail size={20} />}
                value={formData.username}
                onChange={handleInputChange}
                error={errors.username}
            />

            <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                className="mt-2 py-3.5 text-lg shadow-xl shadow-indigo-200"
            >
                Gửi liên kết {!isLoading && <ArrowRight size={18} />}
            </Button>

            <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={onBack}
                className="text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft size={18} className="mr-2" /> Quay lại
            </Button>
        </form>
    );
};