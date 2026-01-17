import React from 'react';
import { Utensils } from 'lucide-react';

export const AuthMarketingSection: React.FC = () => {
    return (
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-16 text-white">
            {/* Decorative Bars */}
            <div className="mb-8 flex gap-2">
                <div className="w-24 h-1.5 bg-indigo-400 rounded-full"></div>
                <div className="w-16 h-1.5 bg-purple-400 rounded-full"></div>
            </div>

            {/* Hero Title */}
            <h2 className="text-4xl xl:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
                Căng tin số hóa <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          cho trường học
        </span>
            </h2>

            {/* Description */}
            <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-lg">
                Giúp Phụ huynh an tâm về bữa ăn của con. Nạp tiền online, đặt món trước và kiểm soát dinh dưỡng dễ dàng ngay trên điện thoại.
            </p>

            {/* Social Proof */}
            <div className="flex items-center gap-6">
                <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map((i) => (
                        <img
                            key={i}
                            src={`https://picsum.photos/100/100?random=${i + 10}`}
                            alt="Parent"
                            className="w-12 h-12 rounded-full border-4 border-[#0f172a] object-cover"
                        />
                    ))}
                </div>
                <div>
                    <p className="text-white font-bold text-lg">2,000+</p>
                    <p className="text-slate-400 text-sm">Phụ huynh tin dùng</p>
                </div>
            </div>

            {/* Decorative Floating Widget */}
            <div className="absolute top-1/2 right-[10%] bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl animate-float hidden xl:block">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-400 text-orange-900 p-3 rounded-xl">
                        <Utensils size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-300 font-medium">Vừa thanh toán</p>
                        <p className="text-base font-bold text-white">🥗 Combo Cơm trưa</p>
                        <p className="text-xs text-emerald-300 font-medium mt-0.5">-35.000đ</p>
                    </div>
                </div>
            </div>
        </div>
    );
};