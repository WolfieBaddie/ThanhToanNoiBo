import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from "@/translation/LanguageContext";

const Home: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="overflow-hidden font-sans text-slate-900">

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-52 mesh-gradient">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 grid lg:grid-cols-2 gap-20 items-center">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center space-x-3 bg-brand-primary/10 px-6 py-2.5 rounded-full text-brand-primary text-sm font-heading font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              <span>{t.hero.badge}</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-heading tracking-tight leading-[1.1] text-brand-dark">
              {t.hero.title1}<br />
              <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {t.hero.title2}
              </span>
            </h1>

            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
              {t.hero.desc}
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-brand-primary text-white px-10 py-5 rounded-3xl font-heading font-bold text-lg shadow-2xl flex items-center justify-center space-x-3"
                >
                  <span>{t.nav.cta}</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>

              <div className="flex items-center space-x-4 px-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="user" />
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-heading font-bold text-brand-dark">{t.hero.stats.split(' ')[0]} {t.hero.stats.split(' ')[1]}</p>
                  <p className="text-slate-500 font-sans font-medium">{t.hero.stats.split(' ').slice(2).join(' ')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative lg:flex justify-center hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative w-[340px] h-[700px] bg-brand-dark rounded-[60px] border-[12px] border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white bg-blue-600">
                <p className="font-heading text-3xl mb-2">School Wallet</p>
                <QrCode className="w-32 h-32 opacity-80" />
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-20 -right-12 backdrop-blur-xl bg-white/80 border border-white/20 p-6 rounded-3xl shadow-xl w-60"
            >
              <span className="text-[10px] font-heading text-slate-400 uppercase tracking-widest">{t.hero.floating.instant}</span>
              <p className="text-2xl font-heading font-bold text-brand-dark">+$50.000</p>
              <p className="text-xs font-sans font-semibold text-slate-500">{t.hero.floating.topup}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="text-center mb-24">
            <h2 className="text-brand-primary font-heading font-bold uppercase tracking-[0.15em] text-sm mb-4">{t.home.features.badge}</h2>
            <h3 className="text-4xl lg:text-6xl font-heading text-brand-dark tracking-tight">{t.home.features.title}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-slate-50 rounded-[40px] p-12 relative group overflow-hidden">
              <div className="relative z-10">
                <div className="bg-brand-primary w-14 h-14 rounded-2xl flex items-center justify-center mb-8">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-2xl font-heading font-bold mb-4">{t.home.features.card1.title}</h4>
                <p className="text-slate-500 font-sans text-lg leading-relaxed max-w-sm">
                  {t.home.features.card1.desc}
                </p>
              </div>
            </div>

            <div className="bg-brand-primary rounded-[40px] p-12 text-white shadow-lg shadow-blue-200">
              <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-8">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-2xl font-heading font-bold mb-4">{t.home.features.card2.title}</h4>
              <p className="text-blue-50 font-sans opacity-90">{t.home.features.card2.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-7xl mx-auto bg-brand-primary rounded-[60px] p-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-10">
            <h2 className="text-4xl md:text-6xl font-heading text-white tracking-tight uppercase">{t.home.features.ctaTitle}</h2>
            <p className="text-blue-100 text-lg font-sans font-medium max-w-xl mx-auto opacity-90">
              {t.home.features.ctaDesc}
            </p>
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-white text-brand-primary px-12 py-5 rounded-3xl font-heading text-xl shadow-xl flex items-center space-x-3"
              >
                <span>{t.nav.client}</span>
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </div>
            <p className="text-blue-200 text-xs font-heading font-bold uppercase tracking-[0.2em]">{t.home.features.ctaNote}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;