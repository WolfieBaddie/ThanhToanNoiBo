
import React, { useState } from 'react';
import { User, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: React.ReactNode) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onLoginSuccess, 
  onForgotPassword, 
  onRegister,
  showNotification 
}) => {
  const [formData, setFormData] = useState({
    email: 'admin@school.edu.vn',
    password: '123456',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showNotification('error', 'Vui lòng kiểm tra lại thông tin nhập liệu');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showNotification('success', 'Đăng nhập thành công!');
      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    }, 1500);
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
                name="email" 
                placeholder="example@school.edu.vn" 
                value={formData.email} 
                onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    if (errors.email) setErrors({...errors, email: ''});
                }} 
                error={errors.email}
            />
            
            <Input 
                className="!mb-0"
                label="Mật khẩu" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    if (errors.password) setErrors({...errors, password: ''});
                }} 
                error={errors.password} 
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

            <Button type="submit" isLoading={isLoading} fullWidth className="mt-4 shadow-xl shadow-slate-900/10">
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
