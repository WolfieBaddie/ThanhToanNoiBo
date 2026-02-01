import React, { useState, useEffect } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { Notification, NotificationType } from './ui/Notification';
import { useAuth } from '@/hooks/useAuth';
import { uploadService } from '@/services/upload.service'; // [MỚI] Import Upload Service

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
    const { user, updateProfile, logout } = useAuth();

    // --- State: Profile ---
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // [MỚI] State loading khi lưu

    const [profile, setProfile] = useState({
        name: '',
        role: '',
        email: '',
        phone: '',
        avatar: ''
    });

    // [MỚI] State để lưu file ảnh người dùng vừa chọn (chưa upload)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Đồng bộ dữ liệu User thật vào Form
    useEffect(() => {
        if (user) {
            setProfile({
                name: user.fullName || '',
                role: user.roles?.join(', ') || 'User',
                email: user.email || '',
                phone: user.phoneNumber || '',
                avatar: user.imageUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`
            });
        }
    }, [user]);

    // --- State: Settings ---
    const [settings, setSettings] = useState({
        notifications: true,
        language: 'Tiếng Việt'
    });

    const [showPwdModal, setShowPwdModal] = useState(false);
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
            // Validate kích thước (VD: 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotif('error', 'Kích thước ảnh quá lớn (Max 5MB)');
                return;
            }

            // Tạo URL preview local để hiển thị ngay lập tức
            const previewUrl = URL.createObjectURL(file);
            setProfile(prev => ({ ...prev, avatar: previewUrl }));

            // Lưu file vào state để tý nữa bấm Lưu thì mới upload
            setSelectedFile(file);
        }
    };

    const handleSaveProfile = async () => {
        // Validate
        if (!/^\d{10,11}$/.test(profile.phone.replace(/\s/g, ''))) {
            showNotif('error', 'Số điện thoại không hợp lệ');
            return;
        }
        if (!profile.name.trim()) {
            showNotif('error', 'Tên không được để trống');
            return;
        }

        setIsSaving(true); // Bắt đầu loading

        try {
            let finalImageUrl = profile.avatar; // Mặc định là URL hiện tại

            // 1. Nếu có file mới -> Upload lên Cloudinary trước
            if (selectedFile) {
                try {
                    // Hiển thị thông báo nhỏ để user biết đang up ảnh
                    showNotif('info', 'Đang tải ảnh lên...');
                    finalImageUrl = await uploadService.uploadToCloudinary(selectedFile);
                } catch (uploadError) {
                    console.error(uploadError);
                    showNotif('error', 'Lỗi tải ảnh lên Cloudinary. Vui lòng thử lại.');
                    setIsSaving(false);
                    return; // Dừng lại nếu up ảnh lỗi
                }
            }

            // 2. Gọi API cập nhật thông tin User với URL ảnh (mới hoặc cũ)
            await updateProfile({
                fullName: profile.name,
                phoneNumber: profile.phone,
                imageUrl: finalImageUrl.startsWith('blob:') ? user?.imageUrl : finalImageUrl // Fallback an toàn nếu blob url bị lọt
            });

            setIsEditing(false);
            setSelectedFile(null); // Reset file sau khi lưu thành công
            showNotif('success', 'Đã cập nhật hồ sơ thành công!');

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Cập nhật thất bại';
            showNotif('error', msg);
        } finally {
            setIsSaving(false); // Kết thúc loading
        }
    };

    const handleCancelEdit = () => {
        // Reset lại dữ liệu ban đầu
        if (user) {
            setProfile({
                name: user.fullName || '',
                role: user.roles?.join(', ') || 'User',
                email: user.email || '',
                phone: user.phoneNumber || '',
                avatar: user.imageUrl || `https://ui-avatars.com/api/?name=${user.fullName}`
            });
        }
        setSelectedFile(null); // Xóa file đang chọn dở
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
        // Gọi API đổi pass ở đây...
        setShowPwdModal(false);
        showNotif('info', 'Vui lòng sử dụng chức năng "Quên mật khẩu" nếu cần reset.');
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

    const handleLogout = () => {
        if (onLogout) onLogout();
        else logout();
    };

    if (!user) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

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
                        isLoading={isSaving} // [MỚI] Truyền loading state xuống
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
                        onClick={handleLogout}
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