
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ForgotPasswordFormProps {
  onBack: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: React.ReactNode) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onBack, 
  showNotification 
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    } else if (!emailRegex.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showNotification('info', 'Đã gửi hướng dẫn khôi phục mật khẩu vào email của bạn.');
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Khôi phục</h2>
                <p className="text-slate-500 font-medium">Nhập email để lấy lại mật khẩu.</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                <User size={24} className="text-slate-400" />
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input 
                className="!mb-0"
                label="Email / Tài khoản" 
                name="email" 
                placeholder="example@school.edu.vn" 
                value={email} 
                onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                }} 
                error={error}
            />

            <Button type="submit" isLoading={isLoading} fullWidth className="mt-4 shadow-xl shadow-slate-900/10">
                Gửi mã
            </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <button 
                onClick={onBack}
                className="w-full py-2 font-bold text-slate-500 hover:text-slate-900"
            >
                Quay lại đăng nhập
            </button>
        </div>
    </div>
  );
};
