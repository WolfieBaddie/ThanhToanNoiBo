
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Cpu, GraduationCap } from 'lucide-react';
import {useLanguage} from "@/translation/LanguageContext";

const About: React.FC = () => {
  const { t } = useLanguage();

  const iconMap = [
    <Shield className="w-8 h-8 text-brand-primary" />,
    <Target className="w-8 h-8 text-brand-secondary" />,
    <Cpu className="w-8 h-8 text-brand-accent" />
  ];

  const colorMap = [
    'bg-blue-50',
    'bg-indigo-50',
    'bg-rose-50'
  ];

  return (
    <div className="pt-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 mesh-gradient">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-brand-primary/10 px-4 py-2 rounded-full text-brand-primary text-xs font-bold uppercase tracking-wider mb-6">
              <GraduationCap className="w-4 h-4" />
              <span>{t.about.badge}</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-brand-dark leading-tight tracking-tight font-jakarta mb-8 italic">
              {t.about.heroTitle1} <br />
              <span className="text-brand-primary">{t.about.heroTitle2}</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
              {t.about.heroDesc}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="relative z-10 animate-float">
              <img 
                src="https://images.unsplash.com/photo-1523240715639-6f0bc4a29ff0?auto=format&fit=crop&q=80&w=800" 
                alt="Students" 
                className="rounded-[40px] shadow-premium border-8 border-white object-cover aspect-[4/3]"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-brand-primary font-black uppercase tracking-[0.2em] text-sm italic underline decoration-2 underline-offset-8">
              {t.about.missionBadge}
            </h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight">
              {t.about.missionTitle}
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {t.about.cards.map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -12 }}
                className="p-12 rounded-[40px] bg-white border border-slate-50 shadow-premium hover:shadow-2xl transition-all duration-500"
              >
                <div className={`w-16 h-16 rounded-2xl ${colorMap[i]} flex items-center justify-center mb-8`}>
                  {iconMap[i]}
                </div>
                <h4 className="text-2xl font-bold text-brand-dark mb-4 tracking-tight">{card.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-brand-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          {t.about.stats.map((stat, i) => (
            <div key={i}>
              <div className="text-4xl lg:text-6xl font-black text-brand-primary mb-3 tracking-tighter italic">{stat.value}</div>
              <div className="text-white font-bold text-sm mb-1 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
