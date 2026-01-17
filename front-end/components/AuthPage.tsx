
import React, { useState } from 'react';
import { AuthMode } from '../types';
import { Notification, NotificationType } from './ui/Notification';
import { AuthLayout } from './auth/AuthLayout';
import { TermsModal } from './auth/TermsModal';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';

interface AuthPageProps {
  onLoginSuccess?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [showTerms, setShowTerms] = useState(false);

  // Notification State managed here to be accessible by all forms
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    message: React.ReactNode;
  }>({
    isOpen: false,
    type: 'success',
    message: ''
  });

  const showNotification = (type: NotificationType, message: React.ReactNode) => {
    setNotification({ isOpen: true, type, message });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const renderForm = () => {
    switch (mode) {
      case AuthMode.LOGIN:
        return (
          <LoginForm 
            onLoginSuccess={() => onLoginSuccess?.()}
            onForgotPassword={() => setMode(AuthMode.FORGOT_PASSWORD)}
            onRegister={() => setMode(AuthMode.REGISTER)}
            showNotification={showNotification}
          />
        );
      case AuthMode.REGISTER:
        return (
          <RegisterForm 
            onRegisterSuccess={() => setMode(AuthMode.LOGIN)}
            onLogin={() => setMode(AuthMode.LOGIN)}
            showNotification={showNotification}
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
