import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, Mail, Phone, ArrowRight, Globe, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from "@/translation/LanguageContext";

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
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
  }, [isOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out px-6 lg:px-12 font-sans ${scrolled
          ? 'py-4 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm'
          : 'py-8 bg-transparent'
          }`}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">

          <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
            {/* <div className="bg-brand-primary p-2 rounded-xl shadow-md">
              <GraduationCap className="w-6 h-6 text-white" />
            </div> */}
            <div className="overflow-hidden rounded-xl"> {/* Bọc logo để bo góc nếu cần */}
              <img
                src="/images/logo.png"
                alt="SchoolWallet Logo"
                className="w-10 h-10 object-cover" // Tăng/giảm size tùy ý
              />
            </div>
            {/* Logo - Bỏ italic và black */}
            <span className="text-xl font-bold tracking-tight text-brand-dark">
              SchoolWallet
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-10 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${isActive(item.href) ? 'text-brand-primary' : 'text-slate-600 hover:text-brand-primary'
                  }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <motion.div layoutId="underline" className="h-0.5 bg-brand-primary mt-1 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 transition-colors px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-slate-200"
            >
              <Globe className="w-3.5 h-3.5 text-brand-primary" />
              <span>{language === 'vi' ? 'VN' : 'EN'}</span>
            </button>

            <div className="hidden sm:block">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-brand-primary text-white px-7 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 flex items-center space-x-2"
              >
                <span>{t.nav.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm"
            >
              <Menu className="w-6 h-6 text-brand-dark" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 z-[120] w-[80%] max-w-[320px] bg-white shadow-2xl flex flex-col font-sans"
            >
              <div className="p-8 flex flex-col h-full">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-6 h-6 text-brand-primary" />
                    <span className="text-xl font-bold text-brand-dark">SchoolWallet</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg bg-slate-50">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <nav className="flex flex-col space-y-5">
                  {navItems.map((item) => (
                    <Link key={item.label} to={item.href} className="py-2">
                      <p className={`text-lg font-semibold transition-all ${isActive(item.href) ? 'text-brand-primary' : 'text-slate-600'}`}>
                        {item.label}
                      </p>
                    </Link>
                  ))}
                </nav>
                <Link to="/login" className="mt-auto space-y-6">
                  <button onClick={toggleLanguage} className="flex items-center space-x-2 bg-slate-50 w-full justify-center py-3 rounded-xl text-xs font-bold text-slate-500 border border-slate-100 uppercase tracking-wide">
                    <Globe className="w-4 h-4 text-brand-primary" />
                    <span>{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                  </button>
                  <button className="w-full bg-brand-primary text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-lg">
                    <span>{t.nav.client}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
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
    <footer className="bg-slate-950 text-white pt-20 pb-10 border-t border-slate-900 relative z-10 mt-32 font-sans">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between gap-16 mb-20">

          <div className="md:w-1/3 space-y-6">
            <Link to="/" className="flex items-center space-x-3">
              {/* <div className="bg-brand-primary p-2 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div> */}
              <div className="bg-white overflow-hidden rounded-xl"> {/* Bọc logo để bo góc nếu cần */}
                <img
                  src="/images/logo.png"
                  alt="SchoolWallet Logo"
                  className="w-10 h-10 object-cover" // Tăng/giảm size tùy ý
                />
              </div>
              {/* Logo Footer - Bỏ italic và black */}
              <span className="text-2xl font-bold tracking-tight">SchoolWallet</span>
            </Link>
            <p className="text-slate-400 text-sm font-normal leading-relaxed">
              {t.footer.desc}
            </p>
          </div>

          <div className="md:w-1/2 flex flex-col sm:flex-row gap-12 sm:gap-24">
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {t.footer.navTitle}
              </h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-sm font-normal text-slate-300 hover:text-white transition-colors">{t.nav.home}</Link></li>
                <li><Link to="/about" className="text-sm font-normal text-slate-300 hover:text-white transition-colors">{t.nav.about}</Link></li>
                <li><Link to="/policy" className="text-sm font-normal text-slate-300 hover:text-white transition-colors">{t.nav.policy}</Link></li>
                <li><Link to="/contact" className="text-sm font-normal text-slate-300 hover:text-white transition-colors">{t.nav.contact}</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {t.footer.contactTitle}
              </h4>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-brand-primary" />
                  <span className="text-sm font-normal text-slate-300">1900 1234</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-brand-primary" />
                  <span className="text-sm font-normal text-slate-300">support@schoolwallet.vn</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">
            © 2026 SchoolWallet Technology Corp.
          </p>

          <div className="flex items-center gap-8">
            <Link to="/policy" className="text-[11px] font-bold text-slate-600 hover:text-brand-primary uppercase tracking-wider transition-colors">
              {t.nav.policy}
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure System</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="font-sans">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;