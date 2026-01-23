
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, Mail, Phone, MapPin, ArrowRight, Globe, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {useLanguage} from "@/translation/LanguageContext";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { label: t.nav.home, href: '/' },
    { label: t.nav.about, href: '/about' },
    { label: t.nav.policy, href: '/policy' },
    { label: t.nav.contact, href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out px-6 lg:px-12 ${
          scrolled 
            ? 'py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm' 
            : 'py-8 bg-transparent'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          
          <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
            <div className="bg-brand-primary p-2 rounded-2xl shadow-glow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-brand-dark">
              SmartSchool
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-12 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`text-sm font-bold tracking-tight transition-colors duration-300 ${
                  isActive(item.href) ? 'text-brand-primary underline underline-offset-8 decoration-2' : 'text-slate-600 hover:text-brand-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 transition-colors px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-brand-primary" />
              <span>{language === 'vi' ? 'VN' : 'EN'}</span>
            </button>

            <div className="hidden sm:block">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-brand-primary text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-lg shadow-blue-200 flex items-center space-x-2"
              >
                <span>{t.nav.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-3 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <Menu className="w-6 h-6 text-brand-dark" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-[120] w-[75%] max-w-[300px] bg-white/95 backdrop-blur-xl shadow-2xl rounded-r-3xl flex flex-col border-r border-white/20"
            >
              <div className="p-8 flex flex-col h-full">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center space-x-2">
                    <div className="bg-brand-primary p-1.5 rounded-xl">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-extrabold text-brand-dark">SmartSchool</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl bg-slate-50 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex flex-col space-y-6">
                  {navItems.map((item) => (
                    <Link key={item.label} to={item.href} className="group">
                      <p className={`text-xl font-bold transition-all ${isActive(item.href) ? 'text-brand-primary translate-x-2' : 'text-slate-500'}`}>
                        {item.label}
                      </p>
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto space-y-8">
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-center">
                    <button onClick={toggleLanguage} className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-100 uppercase tracking-widest">
                      <Globe className="w-4 h-4 text-brand-primary" />
                      <span>{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                    </button>
                  </div>
                  <button className="w-full bg-brand-primary text-white py-5 rounded-2xl text-base font-bold flex items-center justify-center space-x-3 shadow-lg shadow-blue-100">
                    <span>{t.nav.client}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8 border-t border-slate-800 relative z-10 mt-32">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        {/* Top Section: Split Layout */}
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-16 mb-16">
          
          {/* Left Side: Brand Area (~40%) */}
          <div className="md:w-2/5 space-y-6 text-center md:text-left">
            <Link to="/" className="flex items-center justify-center md:justify-start space-x-3 group">
              <div className="bg-brand-primary p-2 rounded-2xl shadow-glow">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight italic">SmartSchool</span>
            </Link>
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
              {t.footer.desc}
            </p>
          </div>

          {/* Right Side: Links Area (~60%) */}
          <div className="md:w-3/5 flex flex-col sm:flex-row gap-12 md:gap-24">
            
            {/* Column 1: Navigation */}
            <div className="flex-1 space-y-6 text-center sm:text-left">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                {t.footer.navTitle}
              </h4>
              <ul className="space-y-4">
                <li><Link to="/" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">{t.nav.home}</Link></li>
                <li><Link to="/about" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">{t.nav.about}</Link></li>
                <li><Link to="/policy" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">{t.nav.policy}</Link></li>
                <li><Link to="/contact" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">{t.nav.contact}</Link></li>
              </ul>
            </div>

            {/* Column 2: Contact Info */}
            <div className="flex-1 space-y-6 text-center sm:text-left">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                {t.footer.contactTitle}
              </h4>
              <ul className="space-y-4">
                <li className="flex items-center justify-center sm:justify-start space-x-3 group">
                  <Phone className="w-4 h-4 text-brand-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">1900 1234</span>
                </li>
                <li className="flex items-center justify-center sm:justify-start space-x-3 group">
                  <Mail className="w-4 h-4 text-brand-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">support@smartschool.vn</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
            © 2026 Smart School Technology Corp.
          </p>
          
          <div className="flex items-center gap-8">
            <Link to="/policy" className="text-[10px] font-bold text-slate-500 hover:text-brand-primary uppercase tracking-[0.15em] transition-colors">
              {t.nav.policy}
            </Link>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Security Audited</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
