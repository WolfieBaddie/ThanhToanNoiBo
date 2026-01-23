import React from 'react';
import { User, Store, Phone } from 'lucide-react';
import { TransactionPartnerInfo } from '@/types/transaction.type';

interface Props {
    info?: TransactionPartnerInfo;
}

export const TransactionPartnerCard: React.FC<Props> = ({ info }) => {
    if (!info) return null; // Không có thông tin thì không render

    const isCustomer = info.partnerType === 'CUSTOMER';

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            {/* Avatar / Logo */}
            <div className="shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                    {info.partnerImage ? (
                        <img src={info.partnerImage} alt={info.partnerName} className="w-full h-full object-cover" />
                    ) : (
                        // Icon mặc định tùy theo loại
                        isCustomer ? <User className="text-slate-400" /> : <Store className="text-indigo-500" />
                    )}
                </div>
            </div>

            {/* Thông tin chữ */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    {isCustomer ? "Khách hàng" : "Đơn vị chấp nhận"}
                </p>
                <h4 className="text-lg font-bold text-slate-900 truncate">
                    {info.partnerName}
                </h4>
                {info.subTitle && (
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                        {isCustomer && <Phone size={14} />}
                        {info.subTitle}
                    </p>
                )}
            </div>
        </div>
    );
};