import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Search, CheckSquare, Square, Layers, Edit3 } from 'lucide-react';
import { ServiceItem } from '@/types/merchant.types';
import { PackageResponse } from '@/types/catalog.type'; // Import PackageResponse để lấy dữ liệu cũ
import { formatCurrency } from '@/utils/format';

interface MerchantPackageFormProps {
    isOpen: boolean;
    onClose: () => void;
    // onSubmit nhận data linh hoạt (Create hoặc Update request)
    onSubmit: (data: any) => void;
    availableServices: ServiceItem[];
    isSubmitting?: boolean;

    // [MỚI] Thêm các props cho Edit
    mode: 'CREATE' | 'EDIT';
    initialData?: PackageResponse | null; // Dữ liệu gói cũ (nếu Edit)
}

export const MerchantPackageForm: React.FC<MerchantPackageFormProps> = ({
                                                                            isOpen,
                                                                            onClose,
                                                                            onSubmit,
                                                                            availableServices,
                                                                            isSubmitting = false,
                                                                            mode = 'CREATE',
                                                                            initialData
                                                                        }) => {
    // --- STATE FORM ---
    const [packageCode, setPackageCode] = useState('');
    const [packageName, setPackageName] = useState('');
    const [price, setPrice] = useState<number | string>('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DELETED'>('ACTIVE');

    // Mặc định luôn là ITEM_QUANTITY
    const [packageType] = useState('ITEM_QUANTITY');

    const [creditValue, setCreditValue] = useState<number | string>('');
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');

    // --- EFFECT: INIT DATA KHI MỞ FORM ---
    useEffect(() => {
        if (isOpen) {
            if (mode === 'EDIT' && initialData) {
                // FILL DATA KHI EDIT
                setPackageCode(initialData.packageCode);
                setPackageName(initialData.packageName);
                setPrice(initialData.price);
                setDescription(initialData.description || '');
                setStatus(initialData.status as any); // Gán trạng thái

                // Quan trọng: Map danh sách món ăn từ initialData.items (PackageServiceItem) sang mảng ID
                const existingIds = initialData.items?.map(item => String(item.serviceId)) || [];
                setSelectedServiceIds(existingIds);
            } else {
                // RESET DATA KHI CREATE
                setPackageCode('');
                setPackageName('');
                setPrice('');
                setDescription('');
                setStatus('ACTIVE');
                setCreditValue('');
                setSelectedServiceIds([]);
            }
            setSearchTerm(''); // Reset search
        }
    }, [isOpen, mode, initialData]);

    // --- HANDLERS ---
    const toggleServiceSelection = (serviceId: string) => {
        setSelectedServiceIds(prev => {
            if (prev.includes(serviceId)) {
                return prev.filter(id => id !== serviceId);
            } else {
                return [...prev, serviceId];
            }
        });
    };

    const handleGenerateCode = () => {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setPackageCode(`PKG_${random}`);
    };

    const handleSubmit = () => {
        // Prepare Payload dựa trên Mode
        if (mode === 'CREATE') {
            const payload = {
                packageCode,
                packageName,
                price: Number(price),
                description,
                packageType,
                creditValue: creditValue ? Number(creditValue) : null,
                serviceIds: selectedServiceIds
            };
            onSubmit(payload);
        } else {
            // Mode EDIT: Không gửi packageCode
            const payload = {
                packageName,
                price: Number(price),
                description,
                packageType,
                creditValue: creditValue ? Number(creditValue) : null,
                status, // Cho phép cập nhật trạng thái khi sửa
                serviceIds: selectedServiceIds
            };
            onSubmit(payload);
        }
    };

    // Filter danh sách món ăn
    const filteredServices = useMemo(() => {
        return availableServices.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [availableServices, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* 1. HEADER */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {mode === 'CREATE' ? (
                            <><Layers className="text-indigo-600" size={24} /> Tạo Gói Combo Mới</>
                        ) : (
                            <><Edit3 className="text-indigo-600" size={24} /> Cập nhật Combo</>
                        )}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={24} />
                    </button>
                </div>

                {/* 2. BODY (Scrollable) */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">

                    {/* --- Phần A: Thông tin chung --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Mã Gói */}
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                                Mã gói <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={packageCode}
                                    onChange={(e) => setPackageCode(e.target.value.toUpperCase())}
                                    placeholder="VD: COMBO_TET"
                                    // [QUAN TRỌNG] Disable khi đang Edit
                                    disabled={mode === 'EDIT'}
                                    className={`w-full p-3 border rounded-xl font-mono uppercase outline-none
                                        ${mode === 'EDIT'
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 cursor-not-allowed'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500'
                                    }
                                    `}
                                />
                                {mode === 'CREATE' && (
                                    <button
                                        onClick={handleGenerateCode}
                                        className="absolute right-2 top-2 text-xs bg-white dark:bg-slate-700 px-2 py-1.5 rounded border shadow-sm hover:bg-slate-100"
                                    >
                                        Auto
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Giá Bán */}
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                                Giá bán (VND) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0"
                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600"
                            />
                        </div>

                        {/* Tên Gói */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                                Tên gói hiển thị <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={packageName}
                                onChange={(e) => setPackageName(e.target.value)}
                                placeholder="VD: Combo Sáng Vui Vẻ"
                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Mô tả */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Mô tả chi tiết</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="VD: Bao gồm 1 Bánh mỳ + 1 Sữa đậu nành..."
                            ></textarea>
                        </div>

                        {/* [MỚI] Trạng thái (Chỉ hiện khi Edit) */}
                        {mode === 'EDIT' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Trạng thái kinh doanh</label>
                                <div className="flex gap-4 mt-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={status === 'ACTIVE'}
                                            onChange={() => setStatus('ACTIVE')}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-green-600">Đang bán (Active)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={status === 'INACTIVE'}
                                            onChange={() => setStatus('INACTIVE')}
                                            className="w-4 h-4 text-slate-400 focus:ring-slate-500"
                                        />
                                        <span className="text-sm font-medium text-slate-500">Tạm ngưng (Inactive)</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- Phần B: Chọn món ăn (Service Selection) --- */}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                Chọn món trong gói
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs border border-indigo-100">
                                    {selectedServiceIds.length} đã chọn
                                </span>
                            </label>

                            <div className="relative w-48">
                                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm món..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* List món ăn scrollable */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl h-60 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
                            {filteredServices.length > 0 ? (
                                <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredServices.map((service) => {
                                        const isSelected = selectedServiceIds.includes(String(service.id));
                                        return (
                                            <div
                                                key={service.id}
                                                onClick={() => toggleServiceSelection(String(service.id))}
                                                className={`flex items-center gap-3 p-3 cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800
                                                    ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                                `}
                                            >
                                                <div className={`shrink-0 transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>

                                                <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                                                    {service.image ? (
                                                        <img src={service.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">IMG</div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {service.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatCurrency(service.price)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <p className="text-sm">Không tìm thấy món ăn nào</p>
                                </div>
                            )}
                        </div>
                        {selectedServiceIds.length === 0 && (
                            <p className="text-xs text-red-500 mt-2">* Vui lòng chọn ít nhất 1 món ăn.</p>
                        )}
                    </div>

                </div>

                {/* 3. FOOTER */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3 justify-end bg-white dark:bg-slate-800 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        // Validate: Code, Tên, Giá, Items
                        disabled={isSubmitting || !packageCode || !packageName || !price || selectedServiceIds.length === 0}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isSubmitting ? <span className="animate-spin">⌛</span> : (
                            <>
                                <Save size={18} />
                                {mode === 'CREATE' ? 'Tạo Gói Combo' : 'Lưu Thay Đổi'}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};