import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { ExchangeVoucherModal } from './ExchangeVoucherModal';

export const ExchangeVoucherButton: React.FC<{ className?: string }> = ({ className }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-200 transition-all ${className}`}
            >
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <ArrowLeftRight size={16} />
                </div>
                <span>Đổi Voucher</span>
            </button>

            <ExchangeVoucherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};