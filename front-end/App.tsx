import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT TYPES ---
import { UserRole } from "@/types/common.types.tsx";

// --- PAGES ---
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/components/DashboardPage';
import WalletPage from '@/components/WalletPage';
import MenuPage from '@/components/MenuPage';
import HistoryPage from '@/components/HistoryPage';
import SettingsPage from '@/components/SettingsPage';
import TransactionDetailPage from './components/transactions/TransactionDetailPage';
import TopUpPage from "@/pages/payment/TopUpPage";
import PaymentResultPage from "@/pages/payment/PaymentResultPage";
import VoucherPage from "@/components/VoucherPage";
import VoucherDetailPage from "@/pages/VoucherDetailPage";

import MerchantDashboard from '@/pages/merchant/MerchantDashboard';
import MerchantVerifyPage from '@/pages/merchant/MerchantVerifyPage';
import MerchantTransactionSuccess from "@/pages/merchant/MerchantTransactionSuccess.tsx";
import AdminDashboard from "@/admin/page/dashboard/AdminDashboard.tsx";
import LoginPage from "@/admin/components/login/LoginPage.tsx";

// --- LAYOUTS & CONTEXT ---
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from "@/components/layout/AdminKLayout.tsx";
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from "@/context/NotificationContext";
import { Settings } from "lucide-react";

// --- LANDING PAGE IMPORTS ---
import { LanguageProvider } from "@/translation/LanguageContext.tsx";
import Layout from "./landing-page/layout/Layout";
import Home from "@/landing-page/pages/Home.tsx";
import About from "@/landing-page/pages/About.tsx";
import Contact from "@/landing-page/pages/Contact.tsx";
import Policy from "@/landing-page/pages/Policy.tsx";

function App() {
    const { user, logout } = useAuth();

    // --- Dark Mode Logic ---
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) { return savedTheme === 'dark'; }
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    const isAdmin = user?.roles?.includes(UserRole.ADMIN) || false;
    const isMerchant = user?.roles?.includes(UserRole.MERCHANT) || false;

    const getDashboardRoute = () => {
        if (isAdmin) return "/admin/dashboard";
        if (isMerchant) return "/merchant/dashboard";
        return "/dashboard";
    };

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleTheme = () => setDarkMode(!darkMode);

    // Helper Component: Bọc Layout cho Landing Page
    // Giúp code gọn gàng hơn thay vì lặp lại LanguageProvider/Layout nhiều lần
    const LandingWrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider>
            <Layout>
                {children}
            </Layout>
        </LanguageProvider>
    );

    return (
        <NotificationProvider>
            <Routes>
                {/* ========================================================= */}
                {/* 1. PUBLIC LANDING PAGES (Không cần đăng nhập)             */}
                {/* Đặt lên đầu để React Router ưu tiên khớp trước              */}
                {/* ========================================================= */}
                <Route path="/" element={<LandingWrapper><Home /></LandingWrapper>} />
                <Route path="/about" element={<LandingWrapper><About /></LandingWrapper>} />
                <Route path="/contact" element={<LandingWrapper><Contact /></LandingWrapper>} />
                <Route path="/policy" element={<LandingWrapper><Policy /></LandingWrapper>} />


                {/* ========================================================= */}
                {/* 2. AUTH ROUTES (Redirect về Dashboard nếu đã login)       */}
                {/* ========================================================= */}
                <Route path="/login" element={!user ? <AuthPage /> : <Navigate to={getDashboardRoute()} replace />} />
                <Route path="/admin/login" element={!user ? <LoginPage /> : <Navigate to={getDashboardRoute()} replace />} />


                {/* ========================================================= */}
                {/* 3. PROTECTED ROUTES (Bắt buộc đăng nhập)                  */}
                {/* ========================================================= */}
                <Route element={<ProtectedRoute />}>
                    {/* GROUP A: ADMIN */}
                    <Route element={<AdminLayout />}>
                        <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                        </Route>
                    </Route>

                    {/* GROUP B: USER & MERCHANT (MainLayout) */}
                    <Route element={<MainLayout />}>
                        {/* Merchant */}
                        <Route element={<ProtectedRoute allowedRoles={[UserRole.MERCHANT]} />}>
                            <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
                            <Route path="/merchant/verify" element={<MerchantVerifyPage />} />
                            <Route path="/merchant/success" element={<MerchantTransactionSuccess />} />
                            <Route path="/merchant/settings" element={
                                <Settings onLogout={logout} isDarkMode={darkMode} onToggleTheme={toggleTheme} user={user} />
                            } />
                            <Route path="/merchant/*" element={<Navigate to="/merchant/dashboard" replace />} />
                        </Route>

                        {/* Regular User */}
                        <Route element={<ProtectedRoute allowedRoles={[UserRole.USER]} />}>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/wallet" element={<WalletPage />} />
                            <Route path="/menu" element={<MenuPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                            <Route path="/voucher" element={<VoucherPage />} />
                            <Route path="/vouchers/:id" element={<VoucherDetailPage />} />
                            <Route path="/payment/topup" element={<TopUpPage />} />
                            <Route path="/payment/result" element={<PaymentResultPage />} />
                            <Route path="/transactions/:id" element={<TransactionDetailPage />} />
                            <Route path="/settings" element={
                                <SettingsPage onLogout={logout} isDarkMode={darkMode} onToggleTheme={toggleTheme} user={user} />
                            } />
                        </Route>
                    </Route>
                </Route>


                {/* ========================================================= */}
                {/* 4. FALLBACK / 404 (Xử lý cuối cùng)                       */}
                {/* ========================================================= */}
                <Route path="*" element={
                    user ? (
                        // Nếu đã login mà vào link sai -> Về Dashboard tương ứng
                        isAdmin ? <Navigate to="/admin/dashboard" replace /> :
                            isMerchant ? <Navigate to="/merchant/dashboard" replace /> :
                                <Navigate to="/dashboard" replace />
                    ) : (
                        // Nếu chưa login mà vào link sai -> Về TRANG CHỦ (Landing Page)
                        // Thay vì ép về /login như cũ
                        <Navigate to="/" replace />
                    )
                } />

            </Routes>
        </NotificationProvider>
    );
}

export default App;