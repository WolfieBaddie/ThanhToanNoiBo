import React, { useState } from 'react';
import { User, X, ArrowRight, RefreshCw } from 'lucide-react'; // Thêm icon
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '@/hooks/useAuth'; // Import hook

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
    // Hooks
    const { register, sendOtp } = useAuth();

    // Form Data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        studentId: '', // Có thể dùng làm username hoặc mapping tuỳ logic
        confirmPassword: ''
    });

    // States
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false); // Loading chung

    // OTP States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isResending, setIsResending] = useState(false);

    // --- VALIDATION ---
    const validate = () => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.fullName) newErrors.fullName = 'Vui lòng nhập họ tên';
        // if (!formData.studentId) newErrors.studentId = 'Vui lòng nhập MSSV'; // Tuỳ chọn bắt buộc

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

    // --- STEP 1: GỬI OTP ---
    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            showNotification('error', 'Vui lòng kiểm tra lại thông tin nhập liệu');
            return;
        }

        setIsLoading(true);
        try {
            // Gọi API gửi OTP
            await sendOtp(formData.email);

            showNotification('success', 'Mã OTP đã được gửi đến email của bạn!');
            setShowOtpModal(true); // Mở Modal OTP
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || 'Lỗi gửi mã OTP. Vui lòng thử lại.';
            showNotification('error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- STEP 2: XÁC NHẬN ĐĂNG KÝ ---
    const handleVerifyAndRegister = async () => {
        if (!otpCode || otpCode.length < 6) {
            showNotification('error', 'Vui lòng nhập mã OTP 6 số');
            return;
        }

        setIsLoading(true);
        try {
            // Gọi API Register (kèm OTP)
            await register({
                username: formData.email, // Dùng email làm username (hoặc formData.studentId tuỳ logic backend)
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                otp: otpCode // [QUAN TRỌNG] Gửi kèm OTP
            });

            showNotification('success', 'Đăng ký thành công! Đang chuyển hướng...');
            setShowOtpModal(false);
            onRegisterSuccess(); // Callback chuyển trang / dashboard
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || 'Đăng ký thất bại. Mã OTP có thể không đúng.';
            showNotification('error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- RESEND OTP ---
    const handleResendOtp = async () => {
        setIsResending(true);
        try {
            await sendOtp(formData.email);
            showNotification('success', 'Đã gửi lại mã OTP mới!');
        } catch (err) {
            showNotification('error', 'Không thể gửi lại mã. Vui lòng thử sau.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300 relative">

            {/* --- FORM ĐĂNG KÝ --- */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản</h2>
                    <p className="text-slate-500 font-medium">Điền thông tin bên dưới.</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    <User size={24} className="text-slate-400" />
                </div>
            </div>

            <form onSubmit={handleInitialSubmit} className="flex flex-col gap-3">
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
                    Tiếp tục
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

            {/* --- POPUP XÁC THỰC OTP --- */}
            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowOtpModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RefreshCw size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Xác thực OTP</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Mã xác thực đã được gửi đến <br/> <span className="font-medium text-slate-900">{formData.email}</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    maxLength={6}
                                    className="w-full text-center text-2xl font-bold tracking-widest py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-slate-900 placeholder:text-slate-200"
                                    placeholder="000000"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    autoFocus
                                />
                            </div>

                            <Button
                                onClick={handleVerifyAndRegister}
                                isLoading={isLoading}
                                fullWidth
                                className="h-12 text-lg"
                            >
                                Xác nhận đăng ký <ArrowRight size={18} className="ml-2"/>
                            </Button>

                            <div className="text-center">
                                <button
                                    onClick={handleResendOtp}
                                    disabled={isResending}
                                    className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors disabled:opacity-50"
                                >
                                    {isResending ? 'Đang gửi...' : 'Gửi lại mã?'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};