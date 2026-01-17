
import React from 'react';
import { Loader2 } from 'lucide-react';
import { ButtonProps } from '../../types';

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-base tracking-wide";
  
  const variants = {
    // Solid Black button
    primary: "bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-[2px]",
    // Lime button
    secondary: "bg-primary text-slate-900 hover:bg-primary-hover dark:bg-slate-800 dark:text-slate-200",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
    ghost: "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  );
};
