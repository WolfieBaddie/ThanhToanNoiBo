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
        if (s === 0) return 'bg-slate-200';
        if (s <= 1) return 'bg-red-400';
        if (s <= 2) return 'bg-orange-400';
        if (s <= 3) return 'bg-yellow-400';
        return 'bg-emerald-400';
    };

    return (
        <div className={`flex flex-col gap-2 w-full mb-5 ${className}`}>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl py-3.5 px-4 text-base text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300 font-medium
            ${icon ? 'pl-11' : ''} 
            ${error
                        ? 'bg-red-50 border-red-200 focus:border-red-500'
                        : 'focus:bg-white focus:border-slate-200 focus:shadow-lg focus:shadow-slate-100/50'
                    }`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {/* Password Strength Indicator */}
            {showStrength && value.length > 0 && !error && (
                <div className="mt-1 px-1 flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                        <div
                            key={level}
                            className={`flex-1 rounded-full transition-all duration-500 ${
                                level <= strength ? getStrengthColor(strength) : 'bg-slate-100'
                            }`}
                        />
                    ))}
                </div>
            )}

            {error && (
                <span className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
          ⚠️ {error}
        </span>
            )}
        </div>
    );
};