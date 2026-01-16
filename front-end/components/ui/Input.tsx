import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InputProps } from '../../types';

export const Input: React.FC<InputProps> = ({ 
  label, 
  icon, 
  type = 'text', 
  className = '', 
  error,
  showStrength = false,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const value = props.value as string || '';

  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = showStrength && value ? getStrength(value) : 0;

  const getStrengthColor = (s: number) => {
    if (s === 0) return 'bg-slate-200 dark:bg-slate-700';
    if (s <= 1) return 'bg-red-500';
    if (s <= 2) return 'bg-orange-500';
    if (s <= 3) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getStrengthText = (s: number) => {
    if (s === 0) return '';
    if (s <= 1) return 'Yếu';
    if (s <= 2) return 'Trung bình';
    if (s <= 3) return 'Tốt';
    return 'Rất mạnh';
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full mb-5 ${className}`}>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-base text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400
            ${icon ? 'pl-10' : ''} 
            ${error 
              ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      
      {/* Password Strength Indicator */}
      {showStrength && value.length > 0 && !error && (
        <div className="mt-1 px-1">
          <div className="flex gap-1 h-1 mb-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div 
                key={level}
                className={`h-full flex-1 rounded-full transition-all duration-500 ${
                  level <= strength ? getStrengthColor(strength) : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <div className={`text-xs font-medium text-right transition-colors duration-300 ${
             strength <= 1 ? 'text-red-500' : 
             strength <= 2 ? 'text-orange-500' : 
             strength <= 3 ? 'text-yellow-600' : 'text-emerald-600'
          }`}>
            {getStrengthText(strength)}
          </div>
        </div>
      )}

      {error && (
        <span className="text-xs text-red-500 font-medium ml-1">{error}</span>
      )}
    </div>
  );
};