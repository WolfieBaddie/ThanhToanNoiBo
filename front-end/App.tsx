import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import AuthPage from './pages/AuthPage';
import DashboardPage from './components/DashboardPage';
import WalletPage from './components/WalletPage';
import MenuPage from './components/MenuPage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';

// Layouts & Hooks
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
 import {useAuth} from './context/AuthContext';
import TopUpPage from "@/pages/payment/TopUpPage.tsx";
import PaymentResultPage from "@/pages/payment/PaymentResultPage.tsx";

function App() {
    // Now this is safe because App is already inside <BrowserRouter> and <AuthProvider>
    const { user, logout } = useAuth();

    // --- Dark Mode Logic (Keep as is) ---
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
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
    // ------------------------------------

    return (
        // REMOVE <BrowserRouter> here. Just return Routes directly or wrap in a div if needed.
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
                    <Route path="/history" element={<HistoryPage />} />
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
                    <Route path="/payment/topup" element={<TopUpPage />} />
                    <Route path="/payment/result" element={<PaymentResultPage />} />
                </Route>
            </Route>

            {/* --- 404 --- */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}

export default App;