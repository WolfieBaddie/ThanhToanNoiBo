import React, { useState, useRef } from 'react';
import { User, Bell, Shield, LogOut, ChevronRight, Moon, Globe, Camera, Save, X, Lock, Sun } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Notification, NotificationType } from './ui/Notification';

interface SettingsPageProps {
  onLogout?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout, isDarkMode, onToggleTheme }) => {
  // --- State: Profile ---
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Nguyễn Văn A',
    role: 'Phụ huynh (HS2024-0058)',
    email: 'nguyenvana@gmail.com',
    phone: '0912 345 678',
    avatar: 'https://picsum.photos/300/300?random=1'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State: Settings ---
  const [settings, setSettings] = useState({
    notifications: true,
    language: 'Tiếng Việt'
  });

  // --- State: Password Modal ---
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdData, setPwdData] = useState({ current: '', new: '', confirm: '' });

  // --- State: Notification ---
  const [notification, setNotification] = useState<{
      isOpen: boolean;
      type: NotificationType;
      message: React.ReactNode;
    }>({
      isOpen: false,
      type: 'success',
      message: ''
    });
  
  const showNotif = (type: NotificationType, message: string) => {
    setNotification({ isOpen: true, type, message });
  };

  // --- Handlers: Profile ---
  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, avatar: imageUrl }));
      showNotif('success', 'Đã cập nhật ảnh đại diện');
    }
  };

  const handleSaveProfile = () => {
    // Validate phone
    if (!/^\d{10,11}$/.test(profile.phone.replace(/\s/g, ''))) {
      showNotif('error', 'Số điện thoại không hợp lệ');
      return;
    }
    if (!profile.name.trim()) {
      showNotif('error', 'Tên không được để trống');
      return;
    }
    
    setIsEditing(false);
    showNotif('success', 'Đã lưu thay đổi hồ sơ');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // --- Handlers: Password ---
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdData.current || !pwdData.new || !pwdData.confirm) {
      showNotif('error', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (pwdData.new !== pwdData.confirm) {
        showNotif('error', 'Mật khẩu xác nhận không khớp');
        return;
    }
    if (pwdData.new.length < 6) {
        showNotif('error', 'Mật khẩu mới phải từ 6 ký tự trở lên');
        return;
    }
    
    // Simulate API call
    setShowPwdModal(false);
    setPwdData({ current: '', new: '', confirm: '' });
    showNotif('success', 'Đổi mật khẩu thành công');
  };

  // --- Handlers: Settings ---
  const handleToggleTheme = () => {
    onToggleTheme();
    showNotif('info', `Đã chuyển sang giao diện ${!isDarkMode ? 'Tối' : 'Sáng'}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Notification 
        isOpen={notification.isOpen}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Change Password Modal */}
      <Modal isOpen={showPwdModal} onClose={() => setShowPwdModal(false)} title="Đổi mật khẩu">
         <form onSubmit={handleChangePassword} className="space-y-4">
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
                 <Button type="button" variant="ghost" onClick={() => setShowPwdModal(false)} className="flex-1">Hủy</Button>
                 <Button type="submit" className="flex-1">Xác nhận</Button>
             </div>
         </form>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Profile Card */}
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 p-8 text-center shadow-sm sticky top-24 transition-colors">
                <div 
                    className={`relative inline-block mb-6 group ${isEditing ? 'cursor-pointer' : ''}`}
                    onClick={handleAvatarClick}
                >
                    <div className={`p-1 rounded-full border-2 border-dashed ${isEditing ? 'border-indigo-400 animate-pulse' : 'border-indigo-200 dark:border-indigo-900'} transition-colors`}>
                        <img 
                            src={profile.avatar} 
                            alt="Avatar" 
                            className="w-32 h-32 rounded-full object-cover" 
                        />
                    </div>
                    {isEditing && (
                        <div className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 border-4 border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-110">
                            <Camera size={16} />
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                
                {isEditing ? (
                    <div className="mb-6">
                        <input 
                            type="text" 
                            value={profile.name}
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                            className="text-center w-full text-xl font-bold text-slate-900 dark:text-white border-b-2 border-indigo-200 focus:border-indigo-500 outline-none pb-1 bg-transparent"
                            autoFocus
                        />
                    </div>
                ) : (
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{profile.name}</h3>
                )}
                
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-8">{profile.role}</p>
                
                {isEditing ? (
                    <div className="flex gap-2">
                        <Button onClick={handleCancelEdit} variant="secondary" className="flex-1 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200">
                             <X size={16} /> Hủy
                        </Button>
                        <Button onClick={handleSaveProfile} className="flex-1 py-2 text-sm">
                             <Save size={16} /> Lưu
                        </Button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full py-3 px-6 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Chỉnh sửa hồ sơ
                    </button>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Security Section */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 p-8 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Bảo mật & Tài khoản</h4>
                </div>
                
                <div className="space-y-4">
                     <div className="grid grid-cols-1 gap-4">
                        <Input 
                            label="Email" 
                            value={profile.email}
                            readOnly
                            className="bg-slate-50/50 dark:bg-slate-900/50" 
                        />
                        <Input 
                            label="Số điện thoại" 
                            value={profile.phone} 
                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                            readOnly={!isEditing}
                            className={!isEditing ? "bg-slate-50/50 dark:bg-slate-900/50" : "bg-white dark:bg-slate-700"}
                        />
                     </div>
                     
                     <div className="pt-2">
                        <button 
                            onClick={() => setShowPwdModal(true)}
                            className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-all flex items-center gap-1"
                        >
                            <Lock size={14} />
                            Đổi mật khẩu
                        </button>
                     </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                {/* Notification */}
                <div 
                    onClick={() => {
                        setSettings(prev => ({...prev, notifications: !prev.notifications}));
                        showNotif('info', `Đã ${!settings.notifications ? 'bật' : 'tắt'} thông báo`);
                    }}
                    className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${settings.notifications ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                            <Bell size={20} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Thông báo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${settings.notifications ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                            {settings.notifications ? 'Bật' : 'Tắt'}
                        </span>
                        
                        <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${settings.notifications ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                             <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${settings.notifications ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </div>
                </div>

                {/* Theme */}
                <div 
                    onClick={handleToggleTheme}
                    className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-orange-50 text-orange-600'}`}>
                            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Giao diện</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-400">
                            {isDarkMode ? 'Tối' : 'Sáng'}
                        </span>
                        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                    </div>
                </div>

                {/* Language */}
                <div className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Globe size={20} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Ngôn ngữ</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-400">Tiếng Việt</span>
                        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <button 
                onClick={onLogout}
                className="w-full py-4 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-200 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                Đăng xuất tài khoản
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;