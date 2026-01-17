
import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { Input } from '../ui/Input';

interface SecuritySectionProps {
  email: string;
  phone: string;
  isEditing: boolean;
  onPhoneChange: (value: string) => void;
  onChangePasswordClick: () => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  email,
  phone,
  isEditing,
  onPhoneChange,
  onChangePasswordClick,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 p-8 shadow-sm transition-colors">
      <div className="flex items-center gap-3 mb-6">
          <Shield className="text-slate-900 dark:text-slate-100" size={24} />
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Bảo mật & Tài khoản</h4>
      </div>
      
      <div className="space-y-4">
           <div className="grid grid-cols-1 gap-4">
              <Input 
                  label="Email" 
                  value={email}
                  readOnly
                  className="bg-slate-50/50 dark:bg-slate-900/50" 
              />
              <Input 
                  label="Số điện thoại" 
                  value={phone} 
                  onChange={(e) => onPhoneChange(e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-slate-50/50 dark:bg-slate-900/50" : "bg-white dark:bg-slate-700"}
              />
           </div>
           
           <div className="pt-2">
              <button 
                  onClick={onChangePasswordClick}
                  className="text-slate-900 dark:text-slate-400 font-bold text-sm hover:text-black dark:hover:text-white hover:underline transition-all flex items-center gap-1"
              >
                  <Lock size={14} />
                  Đổi mật khẩu
              </button>
           </div>
      </div>
    </div>
  );
};
