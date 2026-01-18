import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/components/DashboardPage';
import WalletPage from '@/components/WalletPage';
import MenuPage from '@/components/MenuPage';
import HistoryPage from '@/components/HistoryPage';
import SettingsPage from '@/components/SettingsPage';
import TransactionDetailPage from './components/transactions/TransactionDetailPage';
import TopUpPage from "@/pages/payment/TopUpPage";
import PaymentResultPage from "@/pages/payment/PaymentResultPage";

// Layouts & Hooks
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import VoucherPage from "@/components/VoucherPage.tsx";
import VoucherDetailPage from "@/pages/VoucherDetailPage.tsx";
import {NotificationProvider} from "@/context/NotificationContext.tsx";

function App() {
    const { user, logout } = useAuth();

    // --- Dark Mode Logic ---
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                return savedTheme === 'dark';
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

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

    return (
        <NotificationProvider>
        <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route
                path="/login"
                element={!user ? <AuthPage /> : <Navigate to="/dashboard" />}
            />

            {/* --- PROTECTED ROUTES --- */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout user={user} onLogout={logout} />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/menu" element={<MenuPage />} />

                    {/* History Route */}
                    <Route path="/history" element={<HistoryPage />} />

                    {/* Settings Route */}
                    <Route
                        path="/settings"
                        element={
                            <SettingsPage
                                onLogout={logout}
                                isDarkMode={darkMode}
                                onToggleTheme={toggleTheme}
                                user={user}
                            />
                        }
                    />

                    <Route>

                    </Route>
                    <Route path="/voucher" element={<VoucherPage />}/>
                    <Route path="/vouchers/:id" element={<VoucherDetailPage />} />
                    {/* Payment Routes */}
                    <Route path="/payment/topup" element={<TopUpPage />}  />
                    <Route path="/payment/result" element={<PaymentResultPage />} />

                    {/* Transaction Detail Route (Sửa lại path đúng chuẩn) */}
                    <Route path="/transactions/:id" element={<TransactionDetailPage />} />
                </Route>
            </Route>

            {/* --- 404 --- */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
        </NotificationProvider>
    );
}

export default App;