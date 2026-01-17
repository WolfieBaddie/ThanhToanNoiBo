import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { InputProps } from '../../types';

export const Input: React.FC<InputProps> = ({
                                                label,
                                                icon,
                                                type = 'text',
                                                className = '',
                                                error,
                                                showStrength = false,
                                                fullWidth = true,
                                                ...props
                                            }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPasswordType = type === 'password';
    const currentType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
    const value = props.value as string || '';

    // Logic độ mạnh mật khẩu (Giữ nguyên)
    const getStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 6) score += 1;
        if (pass.length >= 10) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score;
    };

    const strength = showStrength && value ? getStrength(value) : 0;

    const getStrengthColor = (s: number) => {
        if (s <= 1) return 'bg-red-500';
        if (s <= 2) return 'bg-orange-500';
        if (s <= 3) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const getStrengthText = (s: number) => {
        if (s <= 1) return 'Yếu';
        if (s <= 2) return 'Trung bình';
        if (s <= 3) return 'Tốt';
        return 'Rất mạnh';
    };

    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                {/* Left Icon */}
                {icon && (
                    <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none
            ${error ? 'text-red-500' : isFocused ? 'text-indigo-600' : 'text-slate-500'}
          `}>
                        {icon}
                    </div>
                )}

                {/* Input Field - ĐÃ SỬA MÀU NỀN TẠI ĐÂY */}
                <input
                    type={currentType}
                    onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
                    onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
                    className={`
            w-full py-3 px-4 rounded-xl text-base font-semibold outline-none transition-all duration-200
            ${icon ? 'pl-11' : 'pl-4'} 
            ${isPasswordType || error ? 'pr-11' : 'pr-4'}
            
            /* --- PHẦN MÀU SẮC QUAN TRỌNG --- */
            /* Mặc định: Nền xám rõ (slate-100), viền trong suốt */
            bg-slate-100 dark:bg-slate-800 border border-transparent
            text-slate-900 placeholder:text-slate-400 placeholder:font-medium
            
            /* Hover: Đậm hơn chút để biết bấm được */
            hover:bg-slate-200 dark:hover:bg-slate-700
            
            /* Focus: Nền trắng bóc, viền màu Indigo, đổ bóng nhẹ */
            focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 
            /* -------------------------------- */

            ${error
                        ? '!bg-red-50 !border-red-300 !text-red-900 focus:!ring-red-500/10'
                        : ''
                    }
          `}
                    {...props}
                />

                {/* Right Icon: Password Toggle */}
                {isPasswordType && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1.5 rounded-full hover:bg-slate-200/50 transition-all"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}

                {/* Right Icon: Error Alert */}
                {error && !isPasswordType && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none animate-in fade-in zoom-in duration-300">
                        <AlertCircle size={18} />
                    </div>
                )}
            </div>

            {/* Password Strength Meter */}
            {showStrength && value.length > 0 && !error && (
                <div className="mt-2 px-1 animate-in slide-in-from-top-1 duration-300">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 flex gap-1 h-1.5">
                            {[1, 2, 3, 4].map((level) => (
                                <div
                                    key={level}
                                    className={`flex-1 rounded-full transition-all duration-500 ${
                                        level <= strength ? getStrengthColor(strength) : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className={`text-xs font-bold w-16 text-right transition-colors duration-300 ${
                            strength <= 1 ? 'text-red-500' :
                                strength <= 2 ? 'text-orange-500' :
                                    strength <= 3 ? 'text-yellow-600' : 'text-emerald-600'
                        }`}>
              {getStrengthText(strength)}
            </span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-1.5 mt-1.5 ml-1 text-red-500 text-xs font-bold animate-in slide-in-from-top-1 duration-200">
                    {isPasswordType && <AlertCircle size={12} />}
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};