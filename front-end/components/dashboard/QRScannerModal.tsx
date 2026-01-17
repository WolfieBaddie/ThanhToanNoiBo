
import React, { useEffect, useState } from 'react';
import { X, ScanLine, Smartphone } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (data: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanComplete }) => {
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScanning(true);
      // Simulate scanning process
      const timer = setTimeout(() => {
        setScanning(false);
        if (onScanComplete) {
          onScanComplete("Canteen-Payment-Success");
        } else {
          // Default behavior if no callback: just close after a "success" delay
          setTimeout(onClose, 500); 
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, onScanComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-20"
      >
        <X size={24} />
      </button>

      {/* Header */}
      <div className="absolute top-12 left-0 w-full text-center z-10">
        <h3 className="text-xl font-bold mb-1">Quét mã QR</h3>
        <p className="text-white/60 text-sm">Di chuyển camera đến vùng chứa mã QR</p>
      </div>

      {/* Camera Viewfinder Area */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 border-2 border-transparent rounded-3xl overflow-hidden">
        {/* Corner Markers */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl"></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl"></div>

        {/* Camera Feed Simulation */}
        <div className="absolute inset-0 bg-slate-800 animate-pulse-slow flex items-center justify-center">
           <Smartphone size={48} className="text-slate-600 opacity-20" />
        </div>
        
        {/* Scanning Laser Animation */}
        <div className="absolute inset-x-4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(217,249,157,0.7)] animate-scan"></div>
      </div>

      {/* Status Text */}
      <div className="mt-12 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3">
        {scanning ? (
           <>
             <ScanLine className="animate-pulse text-primary" size={20} />
             <span className="font-medium">Đang tìm mã QR...</span>
           </>
        ) : (
           <>
             <span className="text-primary font-bold">Đã quét thành công!</span>
           </>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
