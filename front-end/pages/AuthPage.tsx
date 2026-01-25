import React, { useState } from 'react';
import { AuthMode } from '../types';
import { AuthLayout } from './auth/AuthLayout';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';
import { Notification } from '../components/ui/Notification';

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);

    // Notification state
    const [notification, setNotification] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({
        isOpen: false, type: 'success', message: ''
    });

    const showError = (msg: string) => setNotification({ isOpen: true, type: 'error', message: msg });

    // [FIX] Tạo hàm wrapper để khớp với interface của RegisterForm
    // RegisterForm yêu cầu: (type: 'success'|'error'|'info', message: ReactNode)
    const handleShowNotification = (type: 'success' | 'error' | 'info', message: React.ReactNode) => {
        setNotification({
            isOpen: true,
            type: type === 'info' ? 'success' : type, // Map 'info' về 'success' nếu UI chỉ hỗ trợ 2 loại
            message: message as string
        });
    };

    const renderForm = () => {
        switch (mode) {
            case AuthMode.LOGIN:
                return (
                    <LoginForm
                        onSuccess={() => {
                            console.log("Login success, redirecting...");
                        }}
                        onForgotPassword={() => setMode(AuthMode.FORGOT_PASSWORD)}
                        onError={showError}
                    />
                );
            case AuthMode.REGISTER:
                return (
                    // [FIX] Truyền đúng props cho RegisterForm mới
                    <RegisterForm
                        onRegisterSuccess={() => {
                            handleShowNotification('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
                            setMode(AuthMode.LOGIN);
                        }}
                        onLogin={() => setMode(AuthMode.LOGIN)}
                        showNotification={handleShowNotification}
                    />
                );
            case AuthMode.FORGOT_PASSWORD:
                return <ForgotPasswordForm onBack={() => setMode(AuthMode.LOGIN)} />;
            default:
                return null;
        }
    };

    const getTitle = () => {
        if (mode === AuthMode.LOGIN) return 'Chào Phụ huynh! 👋';
        if (mode === AuthMode.REGISTER) return 'Đăng ký Tài khoản';
        return 'Quên mật khẩu? 🔒';
    };

    return (
        <>
            <Notification
                isOpen={notification.isOpen}
                type={notification.type}
                message={notification.message}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
            />

            <AuthLayout
                title={getTitle()}
                subtitle={mode === AuthMode.LOGIN ? 'Cổng thanh toán căng tin & quản lý suất ăn.' : 'Nhập thông tin để tiếp tục.'}
            >
                {renderForm()}

                {/* Footer Link switching */}
                {/* [FIX] Chỉ hiện footer của AuthPage khi ở màn Login.
                    Màn Register đã có footer riêng bên trong RegisterForm rồi. */}
                {mode === AuthMode.LOGIN && (
                    <div className="mt-8 text-center text-sm font-medium text-slate-500">
                        Chưa có tài khoản?
                        <button
                            onClick={() => setMode(AuthMode.REGISTER)}
                            className="text-indigo-600 font-bold ml-1.5 hover:underline transition-all"
                        >
                            Đăng ký ngay
                        </button>
                    </div>
                )}
            </AuthLayout>
        </>
    );
};

export default AuthPage;