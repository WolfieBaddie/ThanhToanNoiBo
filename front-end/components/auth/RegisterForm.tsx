
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onLogin: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: React.ReactNode) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onRegisterSuccess, 
  onLogin, 
  showNotification 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    studentId: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!formData.studentId) newErrors.studentId = 'Vui lòng nhập MSSV';
    
    if (!formData.phoneNumber) {
        newErrors.phoneNumber = 'Vui lòng nhập SĐT';
    } else if (!/^\d{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

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

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
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
      showNotification('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
      onRegisterSuccess();
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản</h2>
                <p className="text-slate-500 font-medium">Điền thông tin bên dưới.</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                <User size={24} className="text-slate-400" />
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input className="!mb-0" label="Họ tên" name="fullName" placeholder="Nguyễn Văn A" value={formData.fullName} onChange={handleChange} error={errors.fullName} />
            <div className="grid grid-cols-2 gap-3">
                <Input className="!mb-0" label="MSSV" name="studentId" placeholder="HS2024..." value={formData.studentId} onChange={handleChange} error={errors.studentId} />
                <Input className="!mb-0" label="SĐT" name="phoneNumber" placeholder="0912..." value={formData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} />
            </div>

            <Input 
                className="!mb-0"
                label="Email / Tài khoản" 
                name="email" 
                placeholder="example@school.edu.vn" 
                value={formData.email} 
                onChange={handleChange} 
                error={errors.email}
            />
            
            <Input 
                className="!mb-0"
                label="Mật khẩu" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleChange} 
                error={errors.password} 
                showStrength
            />

            <Input 
                className="!mb-0" 
                label="Xác nhận mật khẩu" 
                name="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                error={errors.confirmPassword} 
            />

            <Button type="submit" isLoading={isLoading} fullWidth className="mt-4 shadow-xl shadow-slate-900/10">
                Đăng ký
            </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <span className="text-slate-500 font-medium">Đã có tài khoản?</span>
            <button 
                onClick={onLogin}
                className="ml-2 font-bold text-slate-900 hover:underline"
            >
                Đăng nhập
            </button>
        </div>
    </div>
  );
};
