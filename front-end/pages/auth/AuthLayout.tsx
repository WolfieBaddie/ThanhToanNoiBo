import React from 'react';
import { Logo } from '../../components/ui/Logo';
import { Utensils } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-[#0f172a] relative flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[120px] animate-blob mix-blend-screen opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen opacity-50"></div>

            <div className="w-full max-w-7xl flex items-center justify-between relative z-10 lg:px-8">
                {/* Left Side (Marketing) - Hidden on Mobile */}
                <div className="hidden lg:flex flex-col justify-center w-1/2 pr-16 text-white">
                    {/* ... Copy từ AuthPage cũ ... */}
                    <h2 className="text-5xl font-bold mb-6">Căng tin số hóa <br/><span className="text-indigo-300">cho trường học</span></h2>
                </div>

                {/* Right Side (Form Card) */}
                <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
                    <div className="bg-white w-full max-w-[480px] rounded-[40px] shadow-2xl p-8 sm:p-12 relative overflow-hidden">
                        <div className="mb-8">
                            <Logo className="mb-6" />
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
                            <p className="text-slate-500">{subtitle}</p>
                        </div>

                        {children}

                    </div>
                </div>
            </div>
        </div>
    );
};