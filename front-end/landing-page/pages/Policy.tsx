
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Zap, 
  BarChart3, 
  Smartphone, 
  Users, 
  ChevronRight, 
  GraduationCap, 
  Scale, 
  Clock, 
  HeartPulse,
  Database,
  ArrowUpRight
} from 'lucide-react';
import {useLanguage} from "@/translation/LanguageContext";

const Policy: React.FC = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('compliance');

  const navItems = [
    { id: 'compliance', label: t.policy.sections.compliance.label, icon: <Scale className="w-5 h-5" /> },
    { id: 'limits', label: t.policy.sections.limits.label, icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'scope', label: t.policy.sections.scope.label, icon: <Smartphone className="w-5 h-5" /> },
    { id: 'roadmap', label: t.policy.sections.roadmap.label, icon: <ArrowUpRight className="w-5 h-5" /> },
  ];

  const sections = {
    compliance: {
      title: t.policy.sections.compliance.title,
      content: (
        <div className="space-y-8 lg:space-y-12 font-sans">
          <div className="bg-blue-50/50 p-6 md:p-8 rounded-3xl border border-blue-100">
            <h4 className="text-lg md:text-xl font-bold text-brand-dark mb-4 flex items-center">
              <Shield className="w-6 h-6 text-brand-primary mr-3 shrink-0" />
              Closed-Loop Model
            </h4>
            <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-base">
              {t.policy.sections.compliance.desc}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
            <div className="p-6 md:p-8 rounded-3xl border border-slate-100 bg-white shadow-sm">
              <h5 className="font-black text-brand-dark mb-3 flex items-center uppercase text-[10px] md:text-xs tracking-widest">
                <Lock className="w-4 h-4 mr-2 text-brand-primary shrink-0" /> AML Compliance
              </h5>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {t.policy.sections.compliance.aml}
              </p>
            </div>
            <div className="p-6 md:p-8 rounded-3xl border border-slate-100 bg-white shadow-sm">
              <h5 className="font-black text-brand-dark mb-3 flex items-center uppercase text-[10px] md:text-xs tracking-widest">
                <Users className="w-4 h-4 mr-2 text-brand-primary shrink-0" /> KYC Identification
              </h5>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {t.policy.sections.compliance.kyc}
              </p>
            </div>
          </div>
        </div>
      )
    },
    limits: {
      title: t.policy.sections.limits.title,
      content: (
        <div className="space-y-8 md:space-y-10 font-sans">
          <p className="text-slate-500 font-medium text-base md:text-lg leading-relaxed">
            {t.policy.sections.limits.desc}
          </p>
          
          <div className="space-y-4 md:space-y-6 font-sans">
            <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-4 xs:space-y-0 xs:space-x-6 p-5 md:p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <Zap className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-bold text-brand-dark mb-1 text-sm md:text-base">Transaction Scale</h4>
                <p className="text-slate-500 font-medium text-xs md:text-sm">{t.policy.sections.limits.avg}</p>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-4 xs:space-y-0 xs:space-x-6 p-5 md:p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <Lock className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-bold text-brand-dark mb-1 text-sm md:text-base">Limits & Balances</h4>
                <p className="text-slate-500 font-medium text-xs md:text-sm">{t.policy.sections.limits.storage}</p>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-4 xs:space-y-0 xs:space-x-6 p-5 md:p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <Shield className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-bold text-brand-dark mb-1 text-sm md:text-base">Safety Controls</h4>
                <p className="text-slate-500 font-medium text-xs md:text-sm">{t.policy.sections.limits.control}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    scope: {
      title: t.policy.sections.scope.title,
      content: (
        <div className="space-y-8 md:space-y-12 font-sans">
          <div className="grid gap-4 md:gap-6">
            <div className="p-6 md:p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-brand-primary/10 rounded-2xl">
                  <Smartphone className="w-6 h-6 text-brand-primary" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-brand-dark">{t.policy.sections.scope.parent}</h4>
              </div>
              <ul className="space-y-3 text-slate-500 font-medium text-xs md:text-sm">
                {t.policy.sections.scope.parentItems.map((item, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 md:p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-brand-secondary/10 rounded-2xl">
                  <GraduationCap className="w-6 h-6 text-brand-secondary" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-brand-dark">{t.policy.sections.scope.student}</h4>
              </div>
              <ul className="space-y-3 text-slate-500 font-medium text-xs md:text-sm">
                {t.policy.sections.scope.studentItems.map((item, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    },
    roadmap: {
      title: t.policy.sections.roadmap.title,
      content: (
        <div className="space-y-8 md:space-y-12 font-sans">
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            <div className="p-8 md:p-10 rounded-[32px] md:rounded-[40px] bg-brand-dark text-white shadow-2xl">
              <h4 className="text-xl md:text-2xl font-bold mb-6 flex items-center">
                <Zap className="w-6 h-6 text-brand-primary mr-3" />
                Performance
              </h4>
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-slate-400 font-medium text-sm md:text-base">Scan Time</span>
                  <span className="font-bold text-brand-primary">{t.policy.sections.roadmap.statTime.split(': ')[1]}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-slate-400 font-medium text-sm md:text-base">Cash Loss</span>
                  <span className="font-bold text-brand-primary">0%</span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed italic">
                  "{t.policy.sections.roadmap.quote}"
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg md:text-xl font-bold text-brand-dark">Roadmap</h4>
              <div className="space-y-4">
                {t.policy.sections.roadmap.items.map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="mt-1 text-brand-primary shrink-0"><ArrowUpRight className="w-4 h-4" /></div>
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{item.title}</h5>
                      <p className="text-[11px] md:text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-white font-sans">
      {/* Page Header */}
      <section className="bg-slate-50 py-16 md:py-24 border-b border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-brand-primary/5 blur-[80px] md:blur-[100px] -z-0"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-black text-brand-dark mb-4 md:mb-6 tracking-tight font-jakarta leading-tight italic">
            {t.policy.header.title}<br /> <span className="text-brand-primary">{t.policy.header.accent}</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg md:text-xl max-w-2xl leading-relaxed">
            {t.policy.header.desc}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-0 lg:px-12 py-10 md:py-20 lg:py-32">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12 lg:gap-20">
          {/* Responsive Navigation */}
          <aside className="lg:w-1/4 px-6 lg:px-0">
            {/* Desktop: Sticky Sidebar | Mobile: Horizontal Scrollable Tabs */}
            <div className="lg:sticky lg:top-32">
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar pb-4 lg:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0 space-x-3 lg:space-x-0 lg:space-y-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center justify-between px-5 md:px-6 py-4 md:py-5 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 shrink-0 lg:shrink min-w-[140px] lg:min-w-0 ${
                      activeSection === item.id
                        ? 'bg-brand-primary text-white shadow-xl shadow-blue-100'
                        : 'bg-slate-50 lg:bg-transparent text-slate-500 hover:bg-slate-100 hover:text-brand-primary'
                    }`}
                  >
                    <div className="flex items-center space-x-3 md:space-x-4">
                      {item.icon}
                      <span className="whitespace-nowrap">{item.label}</span>
                    </div>
                    <ChevronRight className={`hidden lg:block w-4 h-4 transition-transform ${activeSection === item.id ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                  </button>
                ))}
              </div>
            </div>


          </aside>

          {/* Main Content Area */}
          <main className="lg:w-3/4 px-6 lg:px-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="max-w-3xl"
              >
                <div className="hidden lg:flex items-center space-x-2 text-brand-primary font-bold text-[10px] uppercase tracking-widest mb-4">
                  <span>Transparency & Operations</span>
                  <div className="w-12 h-px bg-brand-primary/30" />
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-brand-dark mb-8 md:mb-12 tracking-tight font-jakarta italic">
                  {sections[activeSection as keyof typeof sections].title}
                </h2>
                <div className="font-sans">
                  {sections[activeSection as keyof typeof sections].content}
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Policy;
