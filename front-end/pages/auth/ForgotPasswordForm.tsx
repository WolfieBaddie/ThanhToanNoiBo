import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Lock, KeyRound, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ForgotPasswordFormProps {
    onBack: () => void;
    showNotification: (type: 'success' | 'error' | 'info', message: React.ReactNode) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack, showNotification }) => {
    const { requestPasswordResetOtp, submitResetPassword } = useAuth();

    // --- STATE ---
    const [step, setStep] = useState<1 | 2>(1); // 1: Nhập Email, 2: Nhập OTP & Pass mới

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0); // Đếm ngược gửi lại OTP

    // Helper: Đếm ngược
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // --- HANDLERS ---

    // Bước 1: Gửi yêu cầu lấy OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return showNotification('error', 'Vui lòng nhập email hợp lệ');
        }

        setIsLoading(true);
        try {
            await requestPasswordResetOtp(email);
            showNotification('success', `Mã OTP đã được gửi tới ${email}`);
            setStep(2);
            setCountdown(60); // Bắt đầu đếm ngược 60s
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Không thể gửi OTP. Vui lòng kiểm tra lại email.';
            showNotification('error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Bước 2: Đổi mật khẩu
    const handleSubmitReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length < 6) return showNotification('error', 'Mã OTP phải có 6 chữ số');
        if (!newPassword || newPassword.length < 6) return showNotification('error', 'Mật khẩu phải có ít nhất 6 ký tự');
        if (newPassword !== confirmPassword) return showNotification('error', 'Mật khẩu xác nhận không khớp');

        setIsLoading(true);
        try {
            await submitResetPassword({
                email,
                otp,
                newPassword
            });
            showNotification('success', 'Đổi mật khẩu thành công! Vui lòng đăng nhập.');
            onBack(); // Quay về trang Login
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Đổi mật khẩu thất bại. Kiểm tra lại mã OTP.';
            showNotification('error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Gửi lại OTP ở bước 2
    const handleResendOtp = async () => {
        if (countdown > 0) return;

        // UI loading tạm thời cho nút gửi lại
        try {
            await requestPasswordResetOtp(email);
            showNotification('success', 'Đã gửi lại mã OTP');
            setCountdown(60);
        } catch (error: any) {
            showNotification('error', 'Gửi lại OTP thất bại');
        }
    };

    return (
        <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8 text-center">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                    {step === 1 ? <KeyRound size={24} /> : <Lock size={24} />}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Quên mật khẩu?</h2>
                <p className="text-slate-500 text-sm">
                    {step === 1
                        ? "Nhập email đã đăng ký để nhận mã xác thực."
                        : <>Đã gửi mã xác thực tới <span className="font-bold text-slate-700">{email}</span></>}
                </p>
            </div>

            {step === 1 ? (
                // === FORM BƯỚC 1: NHẬP EMAIL ===
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <Input
                        label="Email đăng ký"
                        name="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="!mb-0"
                        autoFocus
                    />

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        fullWidth
                        className="mt-4 shadow-xl shadow-indigo-500/20"
                    >
                        Gửi mã xác thực <ArrowRight size={18} className="ml-2" />
                    </Button>
                </form>
            ) : (
                // === FORM BƯỚC 2: NHẬP OTP & PASS MỚI ===
                <form onSubmit={handleSubmitReset} className="space-y-4 animate-in fade-in duration-300">

                    {/* OTP Input với nút gửi lại */}
                    <div className="relative">
                        <Input
                            label="Mã OTP (6 số)"
                            name="otp"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            className="!mb-0 tracking-widest font-bold"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={countdown > 0}
                            className="absolute right-0 top-0 text-xs font-bold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 transition-colors mt-[30px] mr-2"
                        >
                            {countdown > 0 ? `${countdown}s` : 'Gửi lại'}
                        </button>
                    </div>

                    <Input
                        label="Mật khẩu mới"
                        name="newPassword"
                        type="password"
                        placeholder="Ít nhất 6 ký tự"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="!mb-0"
                    />

                    <Input
                        label="Xác nhận mật khẩu"
                        name="confirmPassword"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={confirmPassword && confirmPassword !== newPassword ? "Mật khẩu không khớp" : undefined}
                        className="!mb-0"
                    />

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        fullWidth
                        className="mt-6 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                    >
                        Xác nhận đổi mật khẩu
                    </Button>
                </form>
            )}

            {/* Back Button */}
            <div className="mt-8 text-center pt-6 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowLeft size={16} /> Quay lại đăng nhập
                </button>
            </div>
        </div>
    );
};