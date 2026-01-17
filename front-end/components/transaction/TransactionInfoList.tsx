
import React from 'react';
import { Clock } from 'lucide-react';

interface TransactionInfoListProps {
  title: string;
  location: string;
  time: string;
  method: string;
}

export const TransactionInfoList: React.FC<TransactionInfoListProps> = ({ title, location, time, method }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <span className="text-slate-500 text-sm font-medium">Dịch vụ</span>
        <span className="text-slate-900 dark:text-white font-bold text-right max-w-[60%]">{title}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-500 text-sm font-medium">Địa điểm</span>
        <span className="text-slate-900 dark:text-white font-bold">{location}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-500 text-sm font-medium">Thời gian</span>
        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
          <Clock size={14} className="text-slate-400"/>
          {time}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-500 text-sm font-medium">Nguồn tiền</span>
        <span className="text-slate-900 dark:text-white font-bold">{method}</span>
      </div>
    </div>
  );
};
