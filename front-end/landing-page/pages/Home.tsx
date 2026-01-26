
import React from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  QrCode, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Plus,
  ChevronDown,
  ArrowRight,
  Monitor
} from 'lucide-react';
import {useLanguage} from "@/translation/LanguageContext";

const Home: React.FC = () => {
  // Destructure language along with t from the useLanguage hook to resolve the error on line 167
  const { t, language } = useLanguage();

  return (
    <div className="overflow-hidden font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-52 mesh-gradient">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 grid lg:grid-cols-2 gap-20 items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center space-x-3 bg-brand-primary/10 px-6 py-2.5 rounded-full text-brand-primary text-sm font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              <span>{t.hero.badge}</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] text-brand-dark">
              {t.hero.title1}<br />
              <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent italic">{t.hero.title2}</span>
            </h1>
            
            <p className="text-l text-slate-500 font-medium leading-relaxed max-w-xl">
              {t.hero.desc}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-brand-primary text-white px-10 py-5 rounded-3xl font-bold text-lg shadow-2xl flex items-center justify-center space-x-3"
              >
                <span>{t.nav.cta}</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center space-x-4 px-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="user" />
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-brand-dark">{t.hero.stats.split(' ')[0]} {t.hero.stats.split(' ')[1]}</p>
                  <p className="text-slate-500 font-medium">{t.hero.stats.split(' ').slice(2).join(' ')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:flex justify-center hidden"
          >
            <div className="relative w-[340px] h-[700px] bg-brand-dark rounded-[60px] border-[12px] border-slate-800 shadow-premium overflow-hidden">
              <img 
                src="https://placehold.co/400x800/2563EB/FFF?text=Smart+Wallet\nSecure+QR" 
                className="w-full h-full object-cover"
                alt="Digital Interface"
              />
            </div>
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-20 -right-12 backdrop-blur-xl bg-white/40 border border-white/20 p-6 rounded-3xl shadow-premium w-56"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-brand-primary/20 p-2 rounded-xl"><Zap className="w-5 h-5 text-brand-primary" /></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.hero.floating.instant}</span>
              </div>
              <p className="text-2xl font-bold text-brand-dark">+$50.000</p>
              <p className="text-xs font-medium text-slate-500">{t.hero.floating.topup}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Bento Grid (Simplified logic for brevity, keeping existing UI structure) */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-brand-primary font-black uppercase tracking-[0.2em] text-sm italic underline decoration-2 underline-offset-8">{t.home.features.badge}</h2>
            <h3 className="text-4xl lg:text-6xl font-extrabold text-brand-dark tracking-tight">{t.home.features.title}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              className="md:col-span-2 bg-slate-50 rounded-[40px] p-12 flex flex-col justify-between overflow-hidden relative group"
            >
              <div className="relative z-10 max-w-md">
                <div className="bg-brand-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-glow">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-3xl font-extrabold text-brand-dark mb-6 tracking-tight">{t.home.features.card1.title}</h4>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                  {t.home.features.card1.desc}
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-brand-primary rounded-[40px] p-12 text-white flex flex-col justify-between"
            >
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-extrabold mb-4">{t.home.features.card2.title}</h4>
                <p className="text-white/70 font-medium">{t.home.features.card2.desc}</p>
              </div>
            </motion.div>

            {/* Bổ sung các card khác nếu muốn hiển thị đủ danh sách trong translation */}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-7xl mx-auto bg-brand-primary rounded-[60px] p-16 md:p-32 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400/20 to-transparent"></div>
          
          <div className="relative z-10 space-y-12">
            <h2 className="text-5xl md:text-7xl font-black text-white font-heading tracking-tight italic">{t.home.features.ctaTitle}</h2>
            <p className="text-blue-100 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              {t.home.features.ctaDesc}
            </p>
            <div className="flex justify-center">
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-brand-primary px-12 py-6 rounded-[30px] font-black text-2xl shadow-premium flex items-center space-x-4 group"
              >
                <span>{t.nav.client}</span>
                <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </div>
            <p className="text-blue-200 text-sm font-bold uppercase tracking-[0.2em]">Mã hóa & Bảo mật • {t.home.features.ctaNote}</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
