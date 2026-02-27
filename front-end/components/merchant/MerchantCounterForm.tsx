import React, { useState, useEffect } from 'react';
import { X, Store, MapPin, Smartphone, Save, Loader2 } from 'lucide-react';
import { CreateCounterRequest, UpdateCounterRequest, Counter } from '@/types/merchant.type';

interface MerchantCounterFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: Counter | null;
    isSubmitting: boolean;
    mode: 'CREATE' | 'EDIT';
}

export const MerchantCounterForm: React.FC<MerchantCounterFormProps> = ({
                                                                            isOpen, onClose, onSubmit, initialData, isSubmitting, mode
                                                                        }) => {
    const [formData, setFormData] = useState({
        counterCode: '',
        counterName: '',
        location: '',
        deviceIdentifier: '',
        status: 'ACTIVE'
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'EDIT' && initialData) {
                setFormData({
                    counterCode: initialData.counterCode,
                    counterName: initialData.counterName,
                    location: initialData.location || '',
                    deviceIdentifier: initialData.deviceIdentifier || '',
                    status: initialData.status
                });
            } else {
                // Reset form for create
                setFormData({
                    counterCode: `CNT_${Math.floor(Math.random() * 10000)}`,
                    counterName: '',
                    location: '',
                    deviceIdentifier: '',
                    status: 'ACTIVE'
                });
            }
        }
    }, [isOpen, mode, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Store size={24} className="text-indigo-600" />
                        {mode === 'CREATE' ? 'Thêm quầy hàng mới' : 'Cập nhật thông tin quầy'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

                    {/* Mã quầy (Readonly nếu Edit) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mã quầy</label>
                        <input
                            type="text"
                            value={formData.counterCode}
                            disabled={mode === 'EDIT'}
                            onChange={e => setFormData({...formData, counterCode: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 font-mono"
                            placeholder="Mã tự động..."
                        />
                    </div>

                    {/* Tên quầy */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tên quầy hàng <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400"><Store size={18} /></span>
                            <input
                                type="text"
                                required
                                value={formData.counterName}
                                onChange={e => setFormData({...formData, counterName: e.target.value})}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                                placeholder="VD: Quầy Cà Phê Sảnh A"
                            />
                        </div>
                    </div>

                    {/* Vị trí */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Vị trí đặt quầy</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400"><MapPin size={18} /></span>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                                placeholder="VD: Tầng 1, Khu vực Canteen"
                            />
                        </div>
                    </div>

                    {/* Device ID (Optional) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Thiết bị POS (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400"><Smartphone size={18} /></span>
                            <input
                                type="text"
                                value={formData.deviceIdentifier}
                                onChange={e => setFormData({...formData, deviceIdentifier: e.target.value})}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                                placeholder="Mã thiết bị POS/Máy tính bảng"
                            />
                        </div>
                    </div>

                    {/* Status Toggle (Only Edit) */}
                    {mode === 'EDIT' && (
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300 block">Trạng thái hoạt động</span>
                                <span className="text-xs text-slate-500">Tắt để tạm ngưng nhận đơn tại quầy này</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.status === 'ACTIVE'}
                                    onChange={(e) => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {mode === 'CREATE' ? 'Tạo quầy hàng' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};  