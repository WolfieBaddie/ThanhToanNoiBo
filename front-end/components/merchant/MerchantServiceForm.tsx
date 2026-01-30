import React, { useEffect, useState } from 'react';
import { X, Save, UploadCloud, CheckCircle, Lock } from 'lucide-react'; // Thêm icon Lock
import { ServiceCategory } from '@/types/catalog.type';
import { ServiceItem } from '@/types/merchant.types';

export type FormMode = 'CREATE' | 'EDIT' | 'REGISTER';

interface MerchantServiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<ServiceItem>) => Promise<void>;
    initialData?: ServiceItem | null;
    categories: ServiceCategory[];
    isSubmitting?: boolean;
    mode: FormMode;
}

export const MerchantServiceForm: React.FC<MerchantServiceFormProps> = ({
                                                                            isOpen,
                                                                            onClose,
                                                                            onSubmit,
                                                                            initialData,
                                                                            categories,
                                                                            isSubmitting = false,
                                                                            mode
                                                                        }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState<number | string>('');
    const [categoryId, setCategoryId] = useState('');
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setPrice(initialData.price);

            // Logic tìm Category ID từ Name (vì mappedItems đang trả về Name)
            // Nếu mappedItems trả về ID thì tốt hơn. Đoạn này giữ nguyên logic cũ của bạn.
            const cat = categories.find(c => c.categoryName === initialData.category || c.categoryId === initialData.category);
            setCategoryId(cat ? cat.categoryId : '');

            setImage(initialData.image || '');
            setDescription(initialData.description || '');
            setIsAvailable(initialData.isAvailable);
        } else {
            // Reset form
            setName('');
            setPrice('');
            setCategoryId('');
            setImage('');
            setDescription('');
            setIsAvailable(true);
        }
    }, [isOpen, initialData, categories, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            id: initialData?.id,
            name,
            price: Number(price),
            category: categoryId,
            image,
            description,
            isAvailable
        });
    };

    if (!isOpen) return null;

    // [LOGIC MỚI]
    // 1. Kiểm tra xem đây có phải món hệ thống không?
    const isSystemItem = !!initialData?.masterServiceCode;

    // 2. Form bị khóa (ReadOnly) khi:
    // - Đang ở chế độ ĐĂNG KÝ (REGISTER)
    // - HOẶC đang SỬA (EDIT) nhưng là món của hệ thống
    const isReadOnly = mode === 'REGISTER' || (mode === 'EDIT' && isSystemItem);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {mode === 'CREATE' && 'Tạo món mới (Custom)'}
                        {mode === 'REGISTER' && 'Đăng ký bán món hệ thống'}
                        {/* Hiển thị tiêu đề khác nếu đang sửa món hệ thống */}
                        {mode === 'EDIT' && isSystemItem && (
                            <span className="flex items-center gap-2 text-indigo-600">
                                <Lock size={20}/> Chi tiết món hệ thống
                            </span>
                        )}
                        {mode === 'EDIT' && !isSystemItem && 'Cập nhật món ăn'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-5">
                    {/* Thông báo cảnh báo */}
                    {isReadOnly && (
                        <div className="bg-orange-50 text-orange-800 p-3 rounded-xl text-sm border border-orange-100 mb-2 flex gap-2 items-start">
                            <Lock size={16} className="mt-0.5 shrink-0" />
                            <div>
                                <strong>Món ăn thuộc hệ thống.</strong>
                                <p className="opacity-90 mt-0.5">
                                    Thông tin tên, giá, và hình ảnh được quản lý bởi Admin.
                                    Bạn không thể chỉnh sửa các trường này.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Image */}
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center ${isReadOnly ? 'opacity-80' : ''}`}>
                            {image ? (
                                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <UploadCloud className="text-slate-400" />
                            )}
                        </div>
                        {/* Chỉ hiện input ảnh nếu không phải ReadOnly */}
                        {!isReadOnly && (
                            <input
                                type="text"
                                placeholder="Dán link ảnh..."
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                className="text-xs w-full p-2 bg-slate-50 rounded border border-slate-200"
                            />
                        )}
                    </div>

                    {/* Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên món ăn</label>
                            <input
                                required
                                disabled={isReadOnly} // Disable nếu là System Item
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Giá bán (VND)</label>
                                <input
                                    required
                                    type="number"
                                    disabled={isReadOnly} // Disable nếu là System Item
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Danh mục</label>
                                <select
                                    disabled={isReadOnly} // Disable nếu là System Item
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                >
                                    <option value="">-- Chọn --</option>
                                    {categories.map(c => (
                                        <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Mô tả</label>
                            <textarea
                                disabled={isReadOnly}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl disabled:bg-slate-100 disabled:text-slate-500 h-20 resize-none"
                            ></textarea>
                        </div>

                        {/* [TÙY CHỌN] Nếu bạn muốn cho phép Món Hệ Thống vẫn được bật/tắt Active
                           thì bỏ disabled ở checkbox này đi.
                           Thường thì Merchant vẫn cần quyền Tắt món hệ thống nếu hết hàng.
                        */}
                        {mode === 'EDIT' && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="status"
                                    checked={isAvailable}
                                    // Cho phép sửa Status ngay cả khi là System Item (để merchant tắt món)
                                    // Nếu muốn khóa luôn thì thêm disabled={isReadOnly}
                                    onChange={(e) => setIsAvailable(e.target.checked)}
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="status" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                                    Đang kinh doanh (Active)
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-100"
                    >
                        Đóng
                    </button>

                    {/* Nút Submit:
                       - Ẩn nếu là món hệ thống đang Edit (vì không cho sửa info)
                       - HOẶC Hiện nhưng đổi text thành "Lưu trạng thái" nếu bạn cho sửa checkbox Active
                       - Ở đây tôi để ẩn nút Lưu nếu là System Item trong chế độ Edit để an toàn tuyệt đối theo yêu cầu.
                    */}
                    {!isReadOnly && (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? <span className="animate-spin">⌛</span> : <><Save size={18} /> Lưu thay đổi</>}
                        </button>
                    )}

                    {/* Nút Đăng ký riêng cho mode Register */}
                    {mode === 'REGISTER' && (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? <span className="animate-spin">⌛</span> : <><CheckCircle size={18} /> Đăng ký bán</>}
                        </button>
                    )}

                    {/* Nếu muốn cho sửa trạng thái Active của món hệ thống thì hiện nút lưu riêng */}
                    {mode === 'EDIT' && isSystemItem && (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-70"
                        >
                            <Save size={18} /> Cập nhật trạng thái
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};