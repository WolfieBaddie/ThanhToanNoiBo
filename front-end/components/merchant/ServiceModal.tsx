import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, DollarSign, Flame } from 'lucide-react';
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ServiceItem, SERVICE_CATEGORIES } from '@/types/merchant.types';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<ServiceItem>) => void;
    editingItem: ServiceItem | null;
    isSubmitting?: boolean;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
                                                              isOpen, onClose, onSave, editingItem, isSubmitting = false
                                                          }) => {
    const [formData, setFormData] = useState<Partial<ServiceItem>>({
        name: '', price: 0, calories: '', category: 'lunch', image: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(editingItem || {
                name: '', price: 0, calories: '', category: 'lunch', image: '', isAvailable: true, soldCount: 0
            });
        }
    }, [isOpen, editingItem]);

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingItem ? "Chỉnh sửa món ăn" : "Thêm món mới"}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-full flex justify-center mb-2">
                        <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                            {formData.image ? (
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <ImageIcon size={24} className="mx-auto mb-1" />
                                    <span className="text-xs font-bold">Thêm ảnh</span>
                                </div>
                            )}
                            {/* Chỗ này sau này tích hợp upload file */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                Thay đổi
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Tên món ăn"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ví dụ: Cơm gà..."
                        className="md:col-span-2"
                    />

                    <Input
                        label="Giá bán (VNĐ)"
                        type="number"
                        value={formData.price || ''}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                        icon={<DollarSign size={16} />}
                    />

                    <Input
                        label="Calo"
                        value={formData.calories}
                        onChange={e => setFormData({ ...formData, calories: e.target.value })}
                        placeholder="400kcal"
                        icon={<Flame size={16} />}
                    />

                    <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1 mb-2 block">Danh mục</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {SERVICE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                                        formData.category === cat.id
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                    <Button variant="ghost" onClick={onClose} className="flex-1" disabled={isSubmitting}>Hủy bỏ</Button>
                    <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang lưu...' : (editingItem ? 'Lưu thay đổi' : 'Thêm món ngay')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};