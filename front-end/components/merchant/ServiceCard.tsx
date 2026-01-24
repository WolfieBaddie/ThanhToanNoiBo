import React from 'react';
import { Edit3, Trash2, Flame } from 'lucide-react';
import { ServiceItem, SERVICE_CATEGORIES } from '@/types/merchant.types';

interface ServiceCardProps {
    item: ServiceItem;
    onEdit: (item: ServiceItem) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (id: number) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ item, onEdit, onDelete, onToggleStatus }) => {
    return (
        <div className={`group bg-white dark:bg-slate-800 rounded-[28px] border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${!item.isAvailable ? 'border-red-200 dark:border-red-900/50 opacity-80' : 'border-slate-100 dark:border-slate-700'}`}>
            {/* Image Area */}
            <div className="h-48 relative overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                <div className="absolute top-3 right-3 flex gap-2">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full text-slate-700 dark:text-slate-200 hover:text-primary transition-colors shadow-sm"
                    >
                        <Edit3 size={16} />
                    </button>
                </div>

                <div className="absolute bottom-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${
                        item.category === 'breakfast' ? 'bg-yellow-400/90 text-yellow-900' :
                            item.category === 'lunch' ? 'bg-orange-400/90 text-orange-900' :
                                item.category === 'drink' ? 'bg-blue-400/90 text-blue-900' :
                                    'bg-slate-200/90 text-slate-700'
                    }`}>
                        {SERVICE_CATEGORIES.find(c => c.id === item.category)?.label}
                    </span>
                </div>
            </div>

            {/* Info Area */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-2 h-12">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 leading-tight">{item.name}</h3>
                    {!item.isAvailable && (
                        <span className="shrink-0 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Hết hàng</span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mb-4">
                    <span className="flex items-center gap-1"><Flame size={12} /> {item.calories}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>Đã bán {item.soldCount}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">{item.price.toLocaleString()}đ</span>

                    <div className="flex items-center gap-2">
                        {/* Availability Switch */}
                        <button
                            onClick={() => onToggleStatus(item.id)}
                            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${item.isAvailable ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                            title={item.isAvailable ? 'Đang bán' : 'Hết hàng'}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${item.isAvailable ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </button>

                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};