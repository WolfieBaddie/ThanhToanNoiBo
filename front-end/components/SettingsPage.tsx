
import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Notification, NotificationType } from './ui/Notification';

// Import refactored components
import { ProfileCard } from './settings/ProfileCard';
import { SecuritySection } from './settings/SecuritySection';
import { PreferencesSection } from './settings/PreferencesSection';
import { ChangePasswordModal } from './settings/ChangePasswordModal';

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

  // --- State: Settings ---
  const [settings, setSettings] = useState({
    notifications: true,
    language: 'Tiếng Việt'
  });

  // --- State: Modals ---
  const [showPwdModal, setShowPwdModal] = useState(false);

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
  const handleChangePassword = (current: string, newPass: string, confirm: string) => {
    if (!current || !newPass || !confirm) {
      showNotif('error', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (newPass !== confirm) {
        showNotif('error', 'Mật khẩu xác nhận không khớp');
        return;
    }
    if (newPass.length < 6) {
        showNotif('error', 'Mật khẩu mới phải từ 6 ký tự trở lên');
        return;
    }
    
    // Simulate API call
    setShowPwdModal(false);
    showNotif('success', 'Đổi mật khẩu thành công');
  };

  // --- Handlers: Settings ---
  const handleToggleTheme = () => {
    onToggleTheme();
    showNotif('info', `Đã chuyển sang giao diện ${!isDarkMode ? 'Tối' : 'Sáng'}`);
  };

  const handleToggleNotifications = () => {
    setSettings(prev => ({...prev, notifications: !prev.notifications}));
    showNotif('info', `Đã ${!settings.notifications ? 'bật' : 'tắt'} thông báo`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Notification 
        isOpen={notification.isOpen}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />

      <ChangePasswordModal 
        isOpen={showPwdModal}
        onClose={() => setShowPwdModal(false)}
        onSubmit={handleChangePassword}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Profile Card */}
        <div className="lg:col-span-1">
            <ProfileCard 
              name={profile.name}
              role={profile.role}
              avatar={profile.avatar}
              isEditing={isEditing}
              onNameChange={(name) => setProfile(prev => ({ ...prev, name }))}
              onAvatarChange={handleFileChange}
              onStartEdit={() => setIsEditing(true)}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
            />
        </div>

        {/* RIGHT COLUMN: Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
            
            <SecuritySection 
              email={profile.email}
              phone={profile.phone}
              isEditing={isEditing}
              onPhoneChange={(phone) => setProfile(prev => ({ ...prev, phone }))}
              onChangePasswordClick={() => setShowPwdModal(true)}
            />

            <PreferencesSection 
              notifications={settings.notifications}
              isDarkMode={isDarkMode}
              language={settings.language}
              onToggleNotifications={handleToggleNotifications}
              onToggleTheme={handleToggleTheme}
            />

            {/* Logout Button */}
            <button 
                onClick={onLogout}
                className="w-full p-5 rounded-[32px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <LogOut size={20} />
                Đăng xuất
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
