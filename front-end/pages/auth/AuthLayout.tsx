import React, { useState } from 'react';
import { Logo } from '../../components/ui/Logo';
import {AuthMarketingSection} from "@/pages/auth/AuthMarketingSection.tsx";
import { TermsModal } from '@/pages/auth/TermsModal';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    // State để quản lý việc hiển thị Modal Điều khoản
    const [showTerms, setShowTerms] = useState(false);

    return (
        <div className="min-h-screen bg-[#0f172a] relative flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-indigo-600/30 rounded-full blur-[80px] sm:blur-[120px] animate-blob mix-blend-screen pointer-events-none opacity-50 sm:opacity-100"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-purple-600/20 rounded-full blur-[80px] sm:blur-[120px] animate-blob animation-delay-2000 mix-blend-screen pointer-events-none opacity-50 sm:opacity-100"></div>

            {/* Modal Component */}
            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />

            <div className="w-full max-w-7xl flex items-center justify-between relative z-10 lg:px-8">

                {/* 1. Marketing Section (New Component) */}
                <AuthMarketingSection />

                {/* Right Side (Form Card) */}
                <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
                    <div className="bg-white w-full max-w-[480px] rounded-[32px] sm:rounded-[40px] shadow-2xl sm:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-6 sm:p-12 relative overflow-hidden">

                        {/* Header */}
                        <div className="mb-6 sm:mb-8">
                            <Logo className="mb-6 sm:mb-8" />
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{title}</h1>
                            <p className="text-slate-500 text-sm sm:text-base">{subtitle}</p>
                        </div>

                        {/* Form Content (Login/Register/Forgot) */}
                        {children}

                        {/* Footer - Copyright & Terms Trigger */}
                        <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                            &copy; 2024 Swallet School.
                            <button
                                onClick={() => setShowTerms(true)}
                                type="button"
                                className="ml-1 hover:text-indigo-600 hover:underline transition-colors block sm:inline mt-1 sm:mt-0"
                            >
                                Điều khoản & An toàn thực phẩm
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};