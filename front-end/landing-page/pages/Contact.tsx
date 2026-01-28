import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Phone, Mail, Send, Facebook, Twitter, Linkedin, MessageCircle, MapPin, CheckCircle, X } from 'lucide-react';
import { useLanguage } from "@/translation/LanguageContext";

const Contact: React.FC = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: t.contact.topics[0],
    message: '',
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwDFhGkzaXXYHckMTK7oD7UNGwld0Au3pJUsezqauY535Woj-5xiCWZQ7_rgd0VZ_fp/exec";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      // Sử dụng fetch với mode 'no-cors' để tránh lỗi chặn từ trình duyệt
      // Lưu ý: no-cors sẽ không trả về JSON response để đọc, nhưng vẫn gửi dữ liệu đi thành công.
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Vì no-cors không báo lỗi mạng, ta giả định thành công và reset form
      setStatus("success");
      
      // Reset form
      setFormData({ 
        name: '', 
        email: '', 
        topic: t.contact.topics[0], 
        message: '' 
      });

    } catch (error) {
      console.error("Error submitting form", error);
      setStatus("error");
      alert("Có lỗi kết nối, vui lòng thử lại sau.");
    } 
  };

  const handleCloseModal = () => {
    setStatus("idle");
  };

  return (
    <div className="pt-20 min-h-screen mesh-gradient pb-24 font-sans relative">

      <AnimatePresence>
        {status === 'success' && <SuccessModal onClose={handleCloseModal} />}
      </AnimatePresence>
      
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] overflow-hidden shadow-premium flex flex-col lg:flex-row border border-gray-100"
        >
          <div className="lg:w-2/5 bg-brand-dark p-12 lg:p-16 text-white relative flex flex-col">
            <h2 className="text-4xl font-extrabold mb-6 tracking-tight italic">
              {t.contact.heroTitle} <br /> SmartSchool.
            </h2>
            <p className="text-slate-400 font-medium mb-12 text-lg leading-relaxed">
              {t.contact.heroDesc}
            </p>
            
            <div className="space-y-10">
              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.contact.info.phone}</p>
                  <p className="text-lg font-bold">1900 1234</p>
                </div>
              </div>
              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.contact.info.email}</p>
                  <p className="text-lg font-bold">hello@smartschool.vn</p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-16 flex space-x-6 border-t border-white/5">
              {[Facebook, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-brand-primary transition-all">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="lg:w-3/5 p-12 lg:p-16 bg-white">
            <h3 className="text-3xl font-extrabold text-brand-dark mb-10 tracking-tight uppercase tracking-widest text-sm">
              {t.contact.formTitle}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.contact.labels.name}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder={t.contact.placeholders.name} 
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-medium outline-none focus:ring-2 focus:ring-brand-primary/20" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.contact.labels.email}</label>
                  <input 
                    type="email" 
                    required 
                    placeholder={t.contact.placeholders.email} 
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-medium outline-none focus:ring-2 focus:ring-brand-primary/20" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.contact.labels.topic}</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-medium appearance-none outline-none focus:ring-2 focus:ring-brand-primary/20" 
                    value={formData.topic} 
                    onChange={e => setFormData({...formData, topic: e.target.value})}
                  >
                    {t.contact.topics.map((topic: string, i: number) => (
                      <option key={i} value={topic}>{topic}</option>
                    ))}
                  </select>
                  <MessageCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.contact.labels.message}</label>
                <textarea 
                  required 
                  rows={4} 
                  placeholder={t.contact.placeholders.message} 
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-medium resize-none outline-none focus:ring-2 focus:ring-brand-primary/20" 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                disabled={status === 'submitting'}
                className={`w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center space-x-3 ${status === 'submitting' ? 'bg-slate-400' : 'bg-brand-primary'}`}
              >
                <span>
                  {status === 'submitting' ? t.contact.labels.sending : 
                   status === 'success' ? "Đã gửi!" : 
                   t.contact.labels.submit}
                </span>
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
// Component thông báo thành công 
const SuccessModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-100 rounded-full blur-2xl" />

        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h3 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">Gửi thành công!</h3>
        
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Chúng tôi đã nhận được thông tin của bạn và sẽ liên hệ lại trong thời gian sớm nhất.
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
        >
          Tuyệt vời
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Contact;