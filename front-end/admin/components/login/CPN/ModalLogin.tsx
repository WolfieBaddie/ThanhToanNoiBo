import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const ModalLogin = () => {
    // const navigate = useNavigate(); // -> XÓA dòng này
    const { login } = useAuth();

    // State
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // --- HANDLE SUBMIT ---
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Gọi API Login
            // Hàm login trong useAuth sẽ cập nhật state 'user'.
            // Khi state 'user' thay đổi, LoginPage sẽ tự động bắt được và chuyển trang.
            await login({ username, password });

            // 2. Hiệu ứng thành công (Giữ lại để UI đẹp)
            const modal = document.querySelector('.modal-container');
            modal?.classList.add('animate-success');

            // --- ĐOẠN CODE DƯỚI ĐÂY ĐÃ ĐƯỢC XÓA BỎ ---
            // Logic cũ dùng setTimeout và check role ở đây không cần thiết nữa
            // vì LoginPage đã lo việc này thông qua useEffect.

        } catch (err: any) {
            console.error("Login Error:", err);
            const message = err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
            setError(message);

            // Hiệu ứng lắc khi lỗi
            const modal = document.querySelector('.modal-container');
            modal?.classList.add('animate-shake');
            setTimeout(() => {
                modal?.classList.remove('animate-shake');
            }, 500);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = (): void => {
        alert('Vui lòng liên hệ IT Support để reset mật khẩu!');
    };

    const handleGoogleSignIn = (): void => {
        alert('Tính năng đăng nhập Google đang phát triển!');
    };

    return (
        <div className="modal-container glass-effect animate-fadeInUp">
            {/* ... Phần UI giữ nguyên không đổi ... */}
            <div className="success-overlay">
                <div className="success-icon">✓</div>
                <div className="success-text">Đăng nhập thành công!</div>
            </div>

            <div className="modal-header">
                <h2 className="modal-title">Đăng nhập</h2>
                <p className="modal-subtitle">Hệ thống thanh toán nội bộ GalaxyPay</p>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username" className="form-label">Tài khoản</label>
                    <input
                        type="text"
                        id="username"
                        className="form-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nhập MSSV hoặc Tên đăng nhập"
                        required
                        autoComplete="username"
                    />
                </div>

                <div className="form-group">
                    <div className="password-header">
                        <label htmlFor="password" className="form-label">Mật khẩu</label>
                        <button
                            type="button"
                            className="show-password-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                    </div>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu của bạn"
                        required
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={handleForgotPassword}
                    tabIndex={-1}
                >
                    Quên mật khẩu?
                </button>

                {error && (
                    <div className="error-message animate-fadeIn">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="signin-btn"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            <span className="animate-spin mr-2">⟳</span>
                            Đang xử lý...
                        </span>
                    ) : (
                        <>Đăng Nhập</>
                    )}
                </button>
            </form>

            <div className="divider">
                <span className="divider-text">hoặc</span>
            </div>

            <button className="apple-signin-btn" onClick={handleGoogleSignIn} tabIndex={-1}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                Đăng nhập với Google
            </button>
        </div>
    );
};

export default ModalLogin;