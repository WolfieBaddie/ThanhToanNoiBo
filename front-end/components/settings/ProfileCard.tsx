import React, { useRef } from 'react';
import { Camera, Save, X, Loader2 } from 'lucide-react'; // Import Loader2
import { Button } from '@/components/ui/Button';

interface ProfileCardProps {
    name: string;
    role: string;
    avatar: string;
    isEditing: boolean;
    isLoading?: boolean; // [MỚI] Thêm prop này
    onNameChange: (value: string) => void;
    onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onStartEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
                                                            name,
                                                            role,
                                                            avatar,
                                                            isEditing,
                                                            isLoading = false, // Default false
                                                            onNameChange,
                                                            onAvatarChange,
                                                            onStartEdit,
                                                            onSave,
                                                            onCancel,
                                                        }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 p-8 text-center shadow-sm sticky top-24 transition-colors">
            <div
                className={`relative inline-block mb-6 group ${isEditing ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
            >
                <div className={`p-1 rounded-full border-2 border-dashed ${isEditing ? 'border-slate-400 animate-pulse' : 'border-slate-200 dark:border-slate-700'} transition-colors`}>
                    <img
                        src={avatar}
                        alt="Avatar"
                        className="w-32 h-32 rounded-full object-cover"
                    />
                </div>
                {isEditing && (
                    <div className="absolute bottom-2 right-2 bg-slate-900 text-white p-2 rounded-full hover:bg-black border-4 border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-110">
                        <Camera size={16} />
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onAvatarChange} />
            </div>

            {isEditing ? (
                <div className="mb-6">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="text-center w-full text-xl font-bold text-slate-900 dark:text-white border-b-2 border-slate-200 focus:border-slate-500 outline-none pb-1 bg-transparent"
                        autoFocus
                    />
                </div>
            ) : (
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{name}</h3>
            )}

            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-8">{role}</p>

            {isEditing ? (
                <div className="flex gap-2">
                    <Button onClick={onCancel} disabled={isLoading} variant="secondary" className="flex-1 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200">
                        <X size={16} /> Hủy
                    </Button>
                    <Button onClick={onSave} disabled={isLoading} className="flex-1 py-2 text-sm">
                        {isLoading ? <Loader2 className="animate-spin" size={16}/> : <><Save size={16} /> Lưu</>}
                    </Button>
                </div>
            ) : (
                <button
                    onClick={onStartEdit}
                    className="w-full py-3 px-6 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    Chỉnh sửa hồ sơ
                </button>
            )}
        </div>
    );
};