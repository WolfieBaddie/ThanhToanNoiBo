import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl?: string | null;
    alt?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      imageUrl,
                                                                      alt = "Image Preview"
                                                                  }) => {
    // Đóng modal khi nhấn ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !imageUrl) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20 group"
            >
                <X size={28} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* Image */}
            <img
                src={imageUrl}
                alt={alt}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none"
                onClick={(e) => e.stopPropagation()}
            />
        </div>,
        document.body
    );
};