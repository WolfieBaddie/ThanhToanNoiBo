import React from "react";
import { FC, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, Eye, EyeOff, Upload, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { UserResponse, CreateUserRequest, UpdateUserRequest, UserStatus } from '@/types/user.type';
import { useAdminRoles } from "@/hooks/admin/useAdminRole";

interface AdminUserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserRequest | UpdateUserRequest, file?: File | null) => Promise<void>;
    initialData: UserResponse | null;
    mode: 'CREATE' | 'EDIT';
    isLoading: boolean;
}

// Form data nội bộ
interface UserFormData {
    username: string;
    password?: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string; // Chỉ 1 role duy nhất
    status?: UserStatus;
    imageUrl?: string;
}

export const AdminUserForm: FC<AdminUserFormProps> = ({
                                                          isOpen,
                                                          onClose,
                                                          onSubmit,
                                                          initialData,
                                                          mode,
                                                          isLoading
                                                      }) => {
    const [mounted, setMounted] = useState(false);
    const { roles: roleList } = useAdminRoles(); // Lấy danh sách role hệ thống để đối chiếu
    const [showPassword, setShowPassword] = useState(false);

    // State quản lý ảnh
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<UserFormData>({
        defaultValues: {
            status: UserStatus.ACTIVE,
            role: ''
        }
    });

    const currentRole = watch('role');

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Reset form & State ảnh khi mở Modal
    useEffect(() => {
        if (isOpen) {
            if (mode === 'EDIT' && initialData) {
                setPreviewUrl(initialData.imageUrl || null);
                setSelectedFile(null);

                // [FIX LOGIC] Map từ Role Name (API trả về) -> Role Code (Form Input Value)
                let mappedRoleCode = '';
                if (initialData.roles && initialData.roles.length > 0) {
                    const apiRoleName = initialData.roles[0]; // VD: "Merchant"

                    // Tìm role tương ứng trong danh sách role hệ thống
                    const foundRole = roleList.find(r =>
                        r.roleName === apiRoleName || r.roleCode === apiRoleName
                    );

                    // Nếu tìm thấy thì dùng Role Code (VD: "MERCHANT"), nếu không thì giữ nguyên
                    mappedRoleCode = foundRole ? foundRole.roleCode : apiRoleName;
                }

                reset({
                    username: initialData.username,
                    fullName: initialData.fullName,
                    email: initialData.email,
                    phoneNumber: initialData.phoneNumber,
                    status: initialData.status,
                    role: mappedRoleCode, // Gán giá trị đã được map chuẩn
                    password: '',
                    imageUrl: initialData.imageUrl || ''
                });
            } else {
                setPreviewUrl(null);
                setSelectedFile(null);
                reset({
                    username: '',
                    password: '',
                    fullName: '',
                    email: '',
                    phoneNumber: '',
                    status: UserStatus.ACTIVE,
                    role: '',
                    imageUrl: ''
                });
            }
        }
    }, [isOpen, initialData, mode, reset, roleList]); // Thêm roleList vào dependency để cập nhật khi load xong

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFormSubmit = async (data: UserFormData) => {
        if (mode === 'CREATE') {
            const payload: CreateUserRequest = {
                username: data.username,
                password: data.password || '123456',
                email: data.email,
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
                role: data.role,
            };
            await onSubmit(payload, selectedFile);
        } else {
            const payload: UpdateUserRequest = {
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
                status: data.status,
                role: data.role,
                newPassword: data.password ? data.password : undefined,
                imageUrl: previewUrl || undefined
            };
            await onSubmit(payload, selectedFile);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-[#1a1a1a] rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {mode === 'CREATE' ? 'Thêm mới người dùng' : 'Cập nhật hồ sơ'}
                        </h2>
                        <p className="text-sm text-white/50 mt-1">
                            {mode === 'CREATE' ? 'Điền thông tin để tạo tài khoản mới.' : 'Chỉnh sửa thông tin và phân quyền.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 custom-scrollbar" autoComplete="off">
                    <input type="text" style={{ display: 'none' }} />
                    <input type="password" style={{ display: 'none' }} />

                    {/* --- UPLOAD ẢNH --- */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group">
                            <div
                                className={`w-32 h-32 rounded-full border-4 flex items-center justify-center overflow-hidden transition-all duration-300
                                ${previewUrl ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-white/10 bg-white/5'}`}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={40} className="text-white/20" />
                                )}
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium"
                            >
                                <Upload size={20} className="mb-1" />
                                <span>Tải ảnh</span>
                            </div>

                            {previewUrl && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute bottom-0 right-0 p-2 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 transition-colors"
                                    title="Xóa ảnh"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60 uppercase">Tên đăng nhập</label>
                            <input
                                {...register('username', { required: mode === 'CREATE' })}
                                disabled={mode === 'EDIT'}
                                placeholder="VD: nguyenvan_a"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 disabled:opacity-50 transition-all"
                                autoComplete="new-password"
                            />
                            {errors.username && <span className="text-xs text-red-400">Bắt buộc nhập</span>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60 uppercase">
                                {mode === 'CREATE' ? 'Mật khẩu' : 'Mật khẩu mới'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register('password', { required: mode === 'CREATE' })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                                    placeholder={mode === 'CREATE' ? "Nhập mật khẩu..." : "Bỏ trống nếu không đổi"}
                                    autoComplete="new-password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <span className="text-xs text-red-400">Bắt buộc nhập</span>}
                        </div>

                        {/* Info Fields */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-medium text-white/60 uppercase">Họ và tên</label>
                            <input {...register('fullName', { required: true })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all" placeholder="VD: Nguyễn Văn A" />
                            {errors.fullName && <span className="text-xs text-red-400">Vui lòng nhập họ tên</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60 uppercase">Email</label>
                            <input type="email" {...register('email', { required: true })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all" placeholder="example@email.com" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60 uppercase">Số điện thoại</label>
                            <input {...register('phoneNumber')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all" placeholder="09xxxxxxx" />
                        </div>

                        {/* --- SINGLE ROLE SELECTION --- */}
                        <div className="md:col-span-2 space-y-3 pt-4 border-t border-white/10 mt-2">
                            <label className="text-xs font-medium text-white/60 uppercase flex items-center gap-2">
                                Vai trò (Chọn duy nhất 1)
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {roleList.map((role) => {
                                    const isSelected = currentRole === role.roleCode;
                                    return (
                                        <label
                                            key={role.roleCode}
                                            className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none
                                            ${isSelected
                                                ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                value={role.roleCode}
                                                {...register('role', { required: true })}
                                                className="hidden"
                                            />

                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors
                                                ${isSelected ? 'border-purple-400 bg-purple-500 text-white' : 'border-white/30 bg-transparent'}`}>
                                                {isSelected && <CheckCircle2 size={12} />}
                                            </div>

                                            <div className="flex flex-col">
                                                <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                                                    {role.roleName}
                                                </span>
                                                <span className="text-[10px] opacity-60">{role.roleCode}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.role && <p className="text-xs text-red-400 mt-1">Vui lòng chọn 1 vai trò cho người dùng</p>}
                        </div>

                        {/* Status - Chỉ hiện khi Edit */}
                        {mode === 'EDIT' && (
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-white/60 uppercase">Trạng thái tài khoản</label>
                                <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                                    {[UserStatus.ACTIVE, UserStatus.LOCKED].map((status) => (
                                        <label key={status} className="cursor-pointer">
                                            <input type="radio" value={status} {...register('status')} className="hidden peer" />
                                            <div className="px-4 py-2 rounded-lg text-sm text-white/60 peer-checked:bg-white/10 peer-checked:text-white peer-checked:font-medium transition-all">
                                                {status === UserStatus.ACTIVE ? 'Hoạt động' : 'Khóa'}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-[#1a1a1a] shrink-0 rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors">
                        Hủy bỏ
                    </button>
                    <button type="submit" onClick={handleSubmit(handleFormSubmit)} disabled={isLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        <span>{mode === 'CREATE' ? 'Tạo mới' : 'Lưu thay đổi'}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};