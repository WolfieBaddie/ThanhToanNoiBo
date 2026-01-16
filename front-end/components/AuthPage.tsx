import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle2, Phone, ArrowLeft, ShieldCheck, GraduationCap, Utensils, Check } from 'lucide-react';
import { Logo } from './ui/Logo';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Notification, NotificationType } from './ui/Notification';
import { Modal } from './ui/Modal';
import { AuthMode } from '../types';

interface AuthPageProps {
  onLoginSuccess?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    studentId: '',
    confirmPassword: ''
  });

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Notification State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    message: React.ReactNode;
  }>({
    isOpen: false,
    type: 'success',
    message: ''
  });

  const showNotification = (type: NotificationType, message: React.ReactNode) => {
    setNotification({ isOpen: true, type, message });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // Reset form and errors when mode changes
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      studentId: '',
      confirmPassword: ''
    });
    setErrors({});
    
    setNotification(prev => {
      if (prev.isOpen && prev.type === 'success') {
        return prev;
      }
      return { ...prev, isOpen: false };
    });
  }, [mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Password validation (Not needed for Forgot Password)
    if (mode !== AuthMode.FORGOT_PASSWORD) {
      if (!formData.password) {
        newErrors.password = 'Vui lòng nhập mật khẩu';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }

    // Register specific validations
    if (mode === AuthMode.REGISTER) {
      if (!formData.fullName) newErrors.fullName = 'Vui lòng nhập họ tên';
      if (!formData.studentId) newErrors.studentId = 'Vui lòng nhập MSSV';
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = 'Vui lòng nhập SĐT';
      } else if (!/^\d{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
      }

      // Confirm Password Validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Run validation before submitting
    if (!validateForm()) {
      showNotification('error', 'Vui lòng kiểm tra lại thông tin nhập liệu');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      let message: React.ReactNode = '';
      let type: NotificationType = 'success';

      if (mode === AuthMode.LOGIN) {
        // Simulate wrong password for a specific demo email (optional) or just success
        message = rememberMe 
          ? 'Đăng nhập thành công! Hệ thống sẽ ghi nhớ phiên làm việc.' 
          : 'Đăng nhập thành công! Đang tải thực đơn...';
        
        showNotification(type, message);
        // Delay slightly to show notification before switching
        setTimeout(() => {
            if (onLoginSuccess) onLoginSuccess();
        }, 1000);

      } else if (mode === AuthMode.REGISTER) {
        message = (
          <div className="flex flex-col gap-1">
            <span>Chào mừng <span className="font-bold text-slate-800">{formData.fullName}</span>!</span>
            <span>Tài khoản đã liên kết với học sinh <span className="font-bold text-indigo-600 font-mono">{formData.studentId}</span>.</span>
            <span className="text-xs text-slate-400 mt-1">Vui lòng đăng nhập để bắt đầu.</span>
          </div>
        );
        setMode(AuthMode.LOGIN);
        showNotification(type, message);
      } else {
        message = 'Đã gửi hướng dẫn khôi phục mật khẩu vào email.';
        type = 'info';
        showNotification(type, message);
      }
      
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const renderTitle = () => {
    switch (mode) {
      case AuthMode.LOGIN:
        return 'Chào Phụ huynh! 👋';
      case AuthMode.REGISTER:
        return 'Đăng ký Phụ huynh';
      case AuthMode.FORGOT_PASSWORD:
        return 'Quên mật khẩu? 🔒';
      default:
        return '';
    }
  };

  const renderSubtitle = () => {
    switch (mode) {
      case AuthMode.LOGIN:
        return 'Cổng thanh toán căng tin & quản lý suất ăn.';
      case AuthMode.REGISTER:
        return 'Liên kết với hồ sơ học sinh để bắt đầu.';
      case AuthMode.FORGOT_PASSWORD:
        return 'Nhập email đã đăng ký để đặt lại mật khẩu.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] relative flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans">
      <Notification 
        isOpen={notification.isOpen}
        type={notification.type}
        message={notification.message}
        onClose={closeNotification}
      />

      {/* Background Blobs (Adjusted for mobile to be less intrusive) */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-indigo-600/30 rounded-full blur-[80px] sm:blur-[120px] animate-blob mix-blend-screen pointer-events-none opacity-50 sm:opacity-100"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-purple-600/20 rounded-full blur-[80px] sm:blur-[120px] animate-blob animation-delay-2000 mix-blend-screen pointer-events-none opacity-50 sm:opacity-100"></div>
      
      {/* Terms & Privacy Modal */}
      <Modal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        title="Quy định Sử dụng Ví"
      >
        <div className="space-y-6 text-slate-600">
          <div className="p-4 bg-indigo-50 rounded-2xl flex gap-4 items-start border border-indigo-100">
            <ShieldCheck className="text-indigo-600 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-bold text-indigo-900 text-lg">Cam kết An toàn thực phẩm</h4>
              <p className="text-sm text-indigo-700/80 mt-1">Hệ thống chỉ hợp tác với các nhà cung cấp suất ăn đạt chuẩn vệ sinh an toàn thực phẩm của Bộ Y Tế.</p>
            </div>
          </div>

          <section>
            <h4 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">1</span>
              Quy định nạp tiền & Thanh toán
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
              <li>Ví Swallet chỉ được sử dụng trong phạm vi căng tin và các dịch vụ nội bộ của nhà trường.</li>
              <li>Phụ huynh có thể đặt hạn mức chi tiêu hàng ngày cho học sinh.</li>
              <li>Việc hoàn tiền số dư sẽ được thực hiện khi học sinh ra trường hoặc chuyển trường.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">2</span>
              Quyền riêng tư & Dữ liệu
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
              <li>Thông tin về khẩu phần ăn và lịch sử giao dịch được bảo mật và chỉ chia sẻ giữa Phụ huynh và Nhà trường.</li>
              <li>Chúng tôi sử dụng dữ liệu để gợi ý thực đơn dinh dưỡng phù hợp cho sự phát triển của học sinh.</li>
            </ul>
          </section>
          
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 italic">
            Áp dụng cho niên khóa 2024-2025.
          </div>
        </div>
      </Modal>

      <div className="w-full max-w-7xl flex items-center justify-between relative z-10 lg:px-8">
        
        {/* LEFT SIDE: Visual Content - Hidden on Mobile/Tablet, Visible on Large Screens */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-16 text-white">
            <div className="mb-8 flex gap-2">
              <div className="w-24 h-1.5 bg-indigo-400 rounded-full"></div>
              <div className="w-16 h-1.5 bg-purple-400 rounded-full"></div>
            </div>
            
            <h2 className="text-4xl xl:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              Căng tin số hóa <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                cho trường học
              </span>
            </h2>
            
            <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-lg">
              Giúp Phụ huynh an tâm về bữa ăn của con. Nạp tiền online, đặt món trước và kiểm soát dinh dưỡng dễ dàng ngay trên điện thoại.
            </p>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/100/100?random=${i + 10}`} 
                    alt="Parent" 
                    className="w-12 h-12 rounded-full border-4 border-[#0f172a] object-cover"
                  />
                ))}
              </div>
              <div>
                <p className="text-white font-bold text-lg">2,000+</p>
                <p className="text-slate-400 text-sm">Phụ huynh tin dùng</p>
              </div>
            </div>

            {/* Decorative Floating Widget */}
            <div className="absolute top-1/2 right-[10%] bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl animate-float hidden xl:block">
              <div className="flex items-center gap-4">
                <div className="bg-orange-400 text-orange-900 p-3 rounded-xl">
                  <Utensils size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-medium">Vừa thanh toán</p>
                  <p className="text-base font-bold text-white">🥗 Combo Cơm trưa</p>
                  <p className="text-xs text-emerald-300 font-medium mt-0.5">-35.000đ</p>
                </div>
              </div>
            </div>
        </div>

        {/* RIGHT SIDE: The Form Card - Optimized for Mobile */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
          <div className="bg-white w-full max-w-[480px] rounded-[32px] sm:rounded-[40px] shadow-2xl sm:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-6 sm:p-12 relative overflow-hidden">
             
             {/* Header inside card */}
             <div className="mb-6 sm:mb-8">
                <Logo className="mb-6 sm:mb-8" />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  {renderTitle()}
                </h1>
                <p className="text-slate-500 text-sm sm:text-base">
                  {renderSubtitle()}
                </p>
             </div>

             {/* The Form */}
             <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* REGISTER FIELDS */}
                {mode === AuthMode.REGISTER && (
                  <>
                    <Input 
                      label="Họ tên Phụ huynh"
                      name="fullName"
                      placeholder="Nguyễn Văn A"
                      icon={<User size={20} />}
                      value={formData.fullName}
                      onChange={handleInputChange}
                      error={errors.fullName}
                    />
                    <Input 
                      label="Mã số học sinh (MSSV)"
                      name="studentId"
                      placeholder="Ví dụ: HS2024001"
                      icon={<GraduationCap size={20} />}
                      value={formData.studentId}
                      onChange={handleInputChange}
                      error={errors.studentId}
                    />
                    <Input 
                      label="Số điện thoại liên hệ"
                      name="phoneNumber"
                      type="tel"
                      placeholder="0912 345 678"
                      icon={<Phone size={20} />}
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      error={errors.phoneNumber}
                    />
                  </>
                )}

                {/* COMMON FIELDS */}
                <Input 
                  label="Email / Tài khoản"
                  name="email"
                  type="email"
                  placeholder="phuhuynh@example.com"
                  icon={<Mail size={20} />}
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                />

                {/* PASSWORD FIELDS */}
                {mode !== AuthMode.FORGOT_PASSWORD && (
                  <Input 
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    icon={<Lock size={20} />}
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    showStrength={mode === AuthMode.REGISTER}
                  />
                )}

                {/* CONFIRM PASSWORD */}
                {mode === AuthMode.REGISTER && (
                  <Input 
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  icon={<CheckCircle2 size={20} />}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={errors.confirmPassword}
                />
                )}

                {/* REMEMBER ME & FORGOT PASSWORD */}
                {mode === AuthMode.LOGIN && (
                  <div className="flex items-center justify-between -mt-2 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}>
                         {rememberMe && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Ghi nhớ đăng nhập</span>
                    </label>

                    <button 
                      type="button" 
                      onClick={() => setMode(AuthMode.FORGOT_PASSWORD)}
                      className="text-sm font-bold text-indigo-600 hover:text-purple-600 transition-colors hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  isLoading={isLoading} 
                  fullWidth
                  className="mt-4 py-3.5 text-lg shadow-xl shadow-indigo-200"
                >
                  {mode === AuthMode.LOGIN ? 'Đăng nhập' : mode === AuthMode.REGISTER ? 'Đăng ký Tài khoản' : 'Gửi liên kết'}
                  {!isLoading && <ArrowRight size={18} />}
                </Button>

                {/* BACK BUTTON */}
                {mode === AuthMode.FORGOT_PASSWORD && (
                  <Button 
                    type="button"
                    variant="ghost"
                    fullWidth
                    className="mt-2"
                    onClick={() => setMode(AuthMode.LOGIN)}
                  >
                    <ArrowLeft size={18} /> Quay lại đăng nhập
                  </Button>
                )}
             </form>

             {/* Toggle Section */}
             {mode !== AuthMode.FORGOT_PASSWORD && (
                <div className="mt-8 text-center text-sm font-medium text-slate-500">
                  {mode === AuthMode.LOGIN ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                  <button 
                    onClick={() => setMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN)}
                    className="text-indigo-600 font-bold ml-1.5 hover:text-purple-600 hover:underline transition-all"
                  >
                    {mode === AuthMode.LOGIN ? 'Đăng ký ngay' : 'Đăng nhập'}
                  </button>
                </div>
              )}

             <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                 &copy; 2024 Swallet School. 
                 <button 
                   onClick={() => setShowTerms(true)}
                   className="ml-1 hover:text-indigo-600 hover:underline transition-colors block sm:inline mt-1 sm:mt-0"
                 >
                   Điều khoản & An toàn thực phẩm
                 </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;