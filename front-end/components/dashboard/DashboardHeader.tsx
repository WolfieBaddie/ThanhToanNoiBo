
import React from 'react';
import { TicketPercent } from 'lucide-react';
import { Button } from '../ui/Button';

interface DashboardHeaderProps {
  onScanClick: () => void; // Function này sẽ được dùng để chuyển tab sang Voucher
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onScanClick }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
             <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Dashboard</h1>
        </div>
        <p className="text-slate-500 font-medium text-sm">Quản lý chi tiêu dễ dàng & hiệu quả.</p>
      </div>
      <div className="flex gap-3">
        <Button 
            onClick={onScanClick}
            className="px-6 py-3 h-auto text-sm bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/10 rounded-2xl"
        >
          <TicketPercent size={18} />
          Kho Voucher
        </Button>
      </div>
    </div>
  );
};
