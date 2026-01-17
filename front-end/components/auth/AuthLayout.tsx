
import React from 'react';
import { AuthMarketingSection } from './AuthMarketingSection';


interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-[1400px] h-full lg:h-[85vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 relative">
        <AuthMarketingSection />
        
        {/* Right Side Form Container */}
        <div className="flex-1 bg-white relative z-30 overflow-y-auto">
            <div className="min-h-full flex flex-col justify-center p-8 sm:p-12 lg:p-16">
                 {/* Mobile Header (Visible only on small screens) */}
                 <div className="lg:hidden mb-8 text-center">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Swallet</h1>
                </div>
                
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};
