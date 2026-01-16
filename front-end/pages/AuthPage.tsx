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
    const showSuccess = (msg: string) => setNotification({ isOpen: true, type: 'success', message: msg });

    const renderForm = () => {
        switch (mode) {
            case AuthMode.LOGIN:
                return (
                    <LoginForm
                        onSuccess={() => {
                            // KHÔNG làm gì ở đây cả (hoặc chỉ console.log).
                            // Lý do: App.tsx sẽ phát hiện user thay đổi và tự chuyển hướng sang Dashboard ngay lập tức.
                            // Nếu hiện notification ở đây, nó sẽ bị mất ngay khi chuyển trang.
                            console.log("Login success, redirecting...");
                        }}
                        onForgotPassword={() => setMode(AuthMode.FORGOT_PASSWORD)}
                        onError={showError}
                    />
                );
            case AuthMode.REGISTER:
                return (
                    <RegisterForm
                        onSwitchMode={() => setMode(AuthMode.LOGIN)}
                        // Đăng ký xong thì cần hiện thông báo để user biết mà đăng nhập
                        onError={showError}
                        onSuccess={() => {
                            showSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
                            setMode(AuthMode.LOGIN);
                        }}
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
                {mode !== AuthMode.FORGOT_PASSWORD && (
                    <div className="mt-8 text-center text-sm font-medium text-slate-500">
                        {mode === AuthMode.LOGIN ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                        <button
                            onClick={() => setMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN)}
                            className="text-indigo-600 font-bold ml-1.5 hover:underline transition-all"
                        >
                            {mode === AuthMode.LOGIN ? 'Đăng ký ngay' : 'Đăng nhập'}
                        </button>
                    </div>
                )}
            </AuthLayout>
        </>
    );
};

export default AuthPage;