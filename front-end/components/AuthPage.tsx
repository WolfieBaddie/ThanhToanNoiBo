import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // [MỚI]
import { AuthMode } from '../types';
import { Notification, NotificationType } from './ui/Notification';
import { AuthLayout } from './auth/AuthLayout';
import { TermsModal } from './auth/TermsModal';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';
import { useAuth } from '@/context/AuthContext';
import {UserRole} from "@/types/common.types.tsx";

interface AuthPageProps {
    onLoginSuccess?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const navigate = useNavigate(); // [MỚI] Hook điều hướng
    const { user } = useAuth();     // [MỚI] Lấy user từ Context để check

    const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
    const [showTerms, setShowTerms] = useState(false);

    const [notification, setNotification] = useState<{
        isOpen: boolean;
        type: NotificationType;
        message: React.ReactNode;
    }>({
        isOpen: false,
        type: 'success',
        message: ''
    });

    // [LOGIC QUAN TRỌNG]: Tự động chuyển trang khi User đã đăng nhập thành công
    useEffect(() => {
        if (user) {
            console.log("User detected, redirecting...", user.roles);

            // Kiểm tra role để điều hướng đúng trang
            if (user.roles && user.roles.includes(UserRole.MERCHANT)) {
                navigate('/merchant/dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [user, navigate]);

    const showNotification = (type: NotificationType, message: React.ReactNode) => {
        setNotification({ isOpen: true, type, message });
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    const showError = (msg: string) => setNotification({ isOpen: true, type: 'error', message: msg });
    const showSuccess = (msg: string) => setNotification({ isOpen: true, type: 'success', message: msg });

    const renderForm = () => {
        switch (mode) {
            case AuthMode.LOGIN:
                return (
                    <LoginForm
                        onSuccess={() => {
                            // Không cần làm gì ở đây nữa vì useEffect ở trên sẽ tự bắt sự kiện user thay đổi
                            console.log("Login API success, waiting for context update...");
                        }}
                        onForgotPassword={() => setMode(AuthMode.FORGOT_PASSWORD)}
                        onError={showError}
                    />
                );
            case AuthMode.REGISTER:
                return (
                    <RegisterForm
                        onSwitchMode={() => setMode(AuthMode.LOGIN)}
                        onError={showError}
                        onSuccess={() => {
                            showSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
                            setMode(AuthMode.LOGIN);
                        }}
                    />
                );
            case AuthMode.FORGOT_PASSWORD:
                return (
                    <ForgotPasswordForm
                        onBack={() => setMode(AuthMode.LOGIN)}
                        showNotification={showNotification}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Notification
                isOpen={notification.isOpen}
                type={notification.type}
                message={notification.message}
                onClose={closeNotification}
            />

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />

            <AuthLayout>
                {renderForm()}
            </AuthLayout>
        </>
    );
};

export default AuthPage;