const USER_KEY = 'app_user_profile';

export const storage = {
    // Chỉ lưu thông tin user (tên, role) để hiển thị UI
    getUser: () => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },
    setUser: (user: any) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clearUser: () => {
        localStorage.removeItem(USER_KEY);
    }
};