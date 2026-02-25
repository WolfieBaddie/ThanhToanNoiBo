import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Phone, Mail, Send, Facebook, Twitter, Linkedin, MessageCircle, CheckCircle } from 'lucide-react';
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
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setStatus("success");
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
    <div className="pt-20 min-h-screen mesh-gradient pb-24 font-sans relative text-slate-900">

      <AnimatePresence>
        {status === 'success' && <SuccessModal onClose={handleCloseModal} />}
      </AnimatePresence>
      
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] overflow-hidden shadow-xl flex flex-col lg:flex-row border border-gray-100"
        >
          {/* Left Side: Info */}
          <div className="lg:w-2/5 bg-brand-dark p-10 lg:p-14 text-white relative flex flex-col">
            {/* Title - Bỏ italic và extrabold */}
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 tracking-tight">
              {t.contact.heroTitle} <br /> School Wallet.
            </h2>
            <p className="text-slate-400 font-normal mb-12 text-lg leading-relaxed">
              {t.contact.heroDesc}
            </p>
            
            <div className="space-y-8">
              <div className="flex items-center space-x-5">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  {/* Label - Bỏ black */}
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{t.contact.info.phone}</p>
                  <p className="text-lg font-medium">1900 1234</p>
                </div>
              </div>
              <div className="flex items-center space-x-5">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{t.contact.info.email}</p>
                  <p className="text-lg font-medium">hello@schoolwallet.vn</p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-12 flex space-x-4 border-t border-white/10">
              {[Facebook, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-brand-primary transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="lg:w-3/5 p-10 lg:p-14 bg-white">
            <h3 className="text-sm font-bold text-brand-primary mb-10 uppercase tracking-[0.1em]">
              {t.contact.formTitle}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid md:grid-cols-2 gap-7">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{t.contact.labels.name}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder={t.contact.placeholders.name} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-normal outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{t.contact.labels.email}</label>
                  <input 
                    type="email" 
                    required 
                    placeholder={t.contact.placeholders.email} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-normal outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{t.contact.labels.topic}</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-normal appearance-none outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all" 
                    value={formData.topic} 
                    onChange={e => setFormData({...formData, topic: e.target.value})}
                  >
                    {t.contact.topics.map((topic: string, i: number) => (
                      <option key={i} value={topic}>{topic}</option>
                    ))}
                  </select>
                  <MessageCircle className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{t.contact.labels.message}</label>
                <textarea 
                  required 
                  rows={4} 
                  placeholder={t.contact.placeholders.message} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-normal resize-none outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all" 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <motion.button 
                whileHover={{ y: -2 }} 
                whileTap={{ scale: 0.98 }} 
                disabled={status === 'submitting'}
                className={`w-full text-white py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center space-x-2 transition-colors ${status === 'submitting' ? 'bg-slate-400' : 'bg-brand-primary hover:bg-brand-primary/90'}`}
              >
                <span>
                  {status === 'submitting' ? t.contact.labels.sending : 
                   status === 'success' ? "Đã gửi thành công!" : 
                   t.contact.labels.submit}
                </span>
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const SuccessModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Gửi thành công!</h3>
        <p className="text-slate-500 font-normal mb-8 text-sm">
          Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi lại qua email trong thời gian sớm nhất.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-brand-primary text-white rounded-xl font-bold text-md transition-transform active:scale-95"
        >
          Đồng ý
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Contact;