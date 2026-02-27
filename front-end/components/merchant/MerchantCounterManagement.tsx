import React, { useEffect, useState } from 'react';
import { Store, MapPin, Edit, Plus, Power } from 'lucide-react';
import { useMerchantCounter } from '@/hooks/useMerchantCounter';
import { MerchantCounterForm } from './MerchantCounterForm';

export const MerchantCounterManagement: React.FC = () => {
    // 1. Chỉ lấy các hàm cơ bản, BỎ fetchQrCode, fetchStats
    const {
        counter, isLoading, fetchCounter,
        createCounter, updateCounter
    } = useMerchantCounter();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 2. Chỉ fetch thông tin quầy
    useEffect(() => {
        fetchCounter();
    }, [fetchCounter]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (formMode === 'CREATE') await createCounter(data);
            else if (counter) await updateCounter(counter.counterId, data);
            setIsFormOpen(false);
            fetchCounter();
        } catch (e) { console.error(e); }
        finally { setIsSubmitting(false); }
    };

    const handleToggleStatus = async () => {
        if (!counter) return;
        const newStatus = counter.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        if (window.confirm(`Bạn có chắc muốn ${newStatus === 'ACTIVE' ? 'mở lại' : 'tạm ngưng'} quầy này?`)) {
            await updateCounter(counter.counterId, { status: newStatus });
            fetchCounter();
        }
    };

    if (isLoading && !counter) return <div className="py-20 text-center text-slate-400">Đang tải thông tin quầy...</div>;

    // --- EMPTY STATE ---
    if (!counter && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4"><Store size={40} className="text-slate-300" /></div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Bạn chưa có quầy hàng nào</h3>
                <p className="text-slate-500 max-w-sm text-center mb-6">Tạo quầy hàng để bắt đầu kinh doanh.</p>
                <button onClick={() => { setFormMode('CREATE'); setIsFormOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">
                    <Plus size={20} /> Tạo quầy ngay
                </button>
                <MerchantCounterForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleSubmit} isSubmitting={isSubmitting} mode="CREATE" />
            </div>
        );
    }

    // --- INFO STATE (Đã bỏ QR & Stats) ---
    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Store size={180} /></div>

                <div className="relative z-10 space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${counter?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                                {counter?.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng'}
                            </span>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">#{counter?.counterCode}</span>
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{counter?.counterName}</h2>

                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                            <MapPin size={18} />
                            {counter?.location || "Chưa cập nhật vị trí"}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-700 w-full" />

                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => { setFormMode('EDIT'); setIsFormOpen(true); }} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200 dark:shadow-none">
                            <Edit size={18} /> Cập nhật thông tin
                        </button>

                        <button onClick={handleToggleStatus} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                            <Power size={18} /> {counter?.status === 'ACTIVE' ? 'Tạm ngưng hoạt động' : 'Kích hoạt lại'}
                        </button>
                    </div>
                </div>
            </div>

            <MerchantCounterForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleSubmit}
                initialData={counter}
                isSubmitting={isSubmitting}
                mode="EDIT"
            />
        </div>
    );
};