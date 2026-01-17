
import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (current: string, newPass: string, confirm: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [pwdData, setPwdData] = useState({ current: '', new: '', confirm: '' });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setPwdData({ current: '', new: '', confirm: '' });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(pwdData.current, pwdData.new, pwdData.confirm);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi mật khẩu">
         <form onSubmit={handleSubmit} className="space-y-4">
             <Input 
                label="Mật khẩu hiện tại" 
                type="password"
                value={pwdData.current}
                onChange={e => setPwdData({...pwdData, current: e.target.value})}
                icon={<Lock size={18}/>}
             />
             <Input 
                label="Mật khẩu mới" 
                type="password"
                value={pwdData.new}
                onChange={e => setPwdData({...pwdData, new: e.target.value})}
                icon={<Lock size={18}/>}
                showStrength
             />
             <Input 
                label="Xác nhận mật khẩu mới" 
                type="password"
                value={pwdData.confirm}
                onChange={e => setPwdData({...pwdData, confirm: e.target.value})}
                icon={<Lock size={18}/>}
             />
             <div className="flex gap-3 pt-4">
                 <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Hủy</Button>
                 <Button type="submit" className="flex-1">Xác nhận</Button>
             </div>
         </form>
      </Modal>
  );
};
