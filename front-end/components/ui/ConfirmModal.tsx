import React from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
                                                              isOpen,
                                                              onClose,
                                                              onConfirm,
                                                              title,
                                                              message,
                                                              isLoading = false,
                                                              confirmText = "Xác nhận",
                                                              cancelText = "Hủy bỏ"
                                                          }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 scale-100 transform transition-all">
                {/* Close Button */}
                {!isLoading && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                        {message}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="animate-spin" size={18} />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};