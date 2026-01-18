
import React, { useState } from 'react';
import {User, Check, Mail, Lock} from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {useAuth} from "@/context/AuthContext.tsx";
import {useAuthForm} from "@/hooks/useAuthForm.ts";
import {AuthMode} from "@/types.ts";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: React.ReactNode) => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onLoginSuccess, 
  onForgotPassword, 
  onRegister,
  showNotification ,
    onSuccess,
    onError
}) => {

  const [isLoading, setIsLoading] = useState(false);


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
            const serverMessage = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
            onError(serverMessage || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
            setIsSubmitting(false); // Mở lại nút để bấm tiếp
        }
    };


  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Xin chào!</h2>
                <p className="text-slate-500 font-medium">Đăng nhập để quản lý ví.</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                <User size={24} className="text-slate-400" />
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input 
                className="!mb-0"
                label="Email / Tài khoản" 
                name="username"
                type="text"
                icon={<Mail size={20} />}
                value={formData.username}
                onChange={handleInputChange}
                error={errors.username}
                disabled={isLoading}
            />
            
            <Input 
                className="!mb-0"
                label="Mật khẩu" 
                name="password" 
                type="password" 
                placeholder="••••••••"
                icon={<Lock size={20} />}
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                disabled={isLoading}
            />

            <div className="flex items-center justify-between mt-1 mb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}>
                        {rememberMe && <Check size={14} className="text-white" strokeWidth={4} />}
                    </div>
                    <input type="checkbox" className="hidden" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                    <span className="text-sm font-bold text-slate-600">Ghi nhớ</span>
                </label>
                <button type="button" onClick={onForgotPassword} className="text-sm font-bold text-slate-900 hover:text-emerald-600">
                    Quên mật khẩu?
                </button>
            </div>

            <Button  type="submit"
                     isLoading={isLoading}
                     fullWidth
                     disabled={isLoading}
                     className="mt-4 shadow-xl shadow-slate-900/10">
                Đăng nhập
            </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <span className="text-slate-500 font-medium">Chưa có tài khoản?</span>
            <button 
                onClick={onRegister}
                className="ml-2 font-bold text-slate-900 hover:underline"
            >
                Đăng ký ngay
            </button>
        </div>
    </div>
  );
};
