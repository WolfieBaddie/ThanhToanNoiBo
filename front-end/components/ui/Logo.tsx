
import React from 'react';
import { Wallet } from 'lucide-react';

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', light = false }) => {
  return (
    <div className={`flex items-center gap-2 font-bold text-2xl ${light ? 'text-white' : 'text-slate-900 dark:text-white'} ${className}`}>
      <div className={`p-2 rounded-xl flex items-center justify-center ${light ? 'bg-white/20 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`}>
        <Wallet size={24} strokeWidth={2.5} />
      </div>
      <span>Swallet</span>
    </div>
  );
};
