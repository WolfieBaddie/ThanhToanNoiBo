import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, TrendingUp, Globe } from 'lucide-react';
import { useLanguage } from "@/translation/LanguageContext";

// Dữ liệu mẫu cho team
const teamMembers = [
  { id: 1, name: "Nguyễn Đỗ Ngọc Quý", role: "Leader", image: "/images/quy-nguyen.jpg" },
  { id: 2, name: "Nguyễn Trọng Tấn", role: "Developer", image: "/images/tan-nguyen.jpg" },
  { id: 3, name: "Nguyễn Ngọc Văn", role: "Developer", image: "/images/van-nguyen.jpg" },
  { id: 4, name: "Phạm Trung Hiếu", role: "Developer", image: "/images/hieu-pham.jpg" },
  { id: 5, name: "Mai Duy Quân", role: "Developer", image: "/images/quan-mai.jpg" },
];

const About: React.FC = () => {
  const { t } = useLanguage();
  const stats = [
    { icon: Users, value: "50K+", label: "Active Users", color: "bg-blue-500" },
    { icon: Award, value: "#1", label: "EdTech Award 2023", color: "bg-yellow-500" },
    { icon: TrendingUp, value: "$2M+", label: "Processed Monthly", color: "bg-green-500" },
    { icon: Globe, value: "100+", label: "Partner Schools", color: "bg-purple-500" },
  ];

  return (
    <div className="overflow-hidden font-sans text-slate-900">
      
      {/* Hero Section with Mission */}
      <section className="relative pt-36 pb-24 lg:pt-52 lg:pb-40 bg-brand-dark overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/20 via-transparent to-transparent opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-8 lg:px-12 grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Title - Bỏ font-black, dùng font-bold */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
              {t.about.heroTitle1} <span className="text-brand-primary">{t.about.heroTitle2}</span>
            </h1>
            <p className="text-xl text-slate-300 font-normal leading-relaxed max-w-xl">
              {t.about.heroDesc}
            </p>
            <div className="flex items-center space-x-6 pt-4">
                <div className="h-px flex-1 bg-slate-700"></div>
                {/* Thành lập - Bỏ in nghiêng, dùng font-semibold */}
                <span className="text-slate-500 font-semibold uppercase tracking-widest text-xs">Thành lập 2026</span>
                 <div className="h-px flex-1 bg-slate-700"></div>
            </div>
          </motion.div>
          
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:flex justify-center hidden"
          >
            <div className="relative z-10 w-[450px] h-[550px] bg-gradient-to-tr from-brand-primary/80 via-brand-secondary/80 to-brand-primary/80 rounded-[48px] shadow-2xl overflow-hidden border border-white/10">
                 <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1470&q=80" className="w-full h-full object-cover mix-blend-overlay opacity-90 hover:scale-105 transition-transform duration-1000" alt="Team working" />
                 <div className="absolute inset-0 bg-brand-dark/20"></div>
            </div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-primary rounded-full blur-3xl opacity-30 -z-10"></div>
          </motion.div>
        </div>
      </section>

       {/* Stats Section */}
      <section className="py-24 bg-white relative z-20 -mt-16">
         <div className="max-w-7xl mx-auto px-8 lg:px-12">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-slate-50 rounded-[32px] p-8 text-center hover:shadow-lg transition-all group border border-slate-100"
                    >
                        <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-7 h-7 text-white" />
                        </div>
                        {/* Value - Dùng font-bold thay cho black */}
                        <h3 className="text-3xl font-bold text-brand-dark mb-1">{stat.value}</h3>
                        <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{stat.label}</p>
                    </motion.div>
                ))}
             </div>
         </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 mb-16 text-center">
          {/* Badge - Bỏ in nghiêng, bỏ underline phức tạp */}
          <h2 className="text-brand-primary font-bold uppercase tracking-[0.15em] text-xs mb-3">
            {t.about.team.badge}
          </h2>
          <h3 className="text-3xl lg:text-5xl font-bold text-brand-dark tracking-tight">
            {t.about.team.title}
          </h3>
        </div>
        
        <div className="relative w-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
          
          <div 
            className="flex whitespace-nowrap"
            style={{ animation: 'ticker 30s linear infinite' }}
          >
            {[...teamMembers, ...teamMembers].map((member, index) => (
              <div key={index} className="inline-block px-4">
                <div className="w-64 bg-white rounded-[24px] shadow-sm p-6 flex flex-col items-center text-center border border-slate-100">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-50 mb-5 shadow-sm"
                  />
                  <h4 className="text-lg font-bold text-brand-dark mb-1">{member.name}</h4>
                  <p className="text-brand-primary font-semibold text-[11px] uppercase tracking-wider">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* Story Section */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-8 text-center space-y-8">
             <h2 className="text-3xl font-bold text-brand-dark tracking-tight">{t.about.journey.title}</h2>
             <p className="text-slate-500 text-lg leading-relaxed font-normal">
                 {t.about.journey.desc}
             </p>
             <div className="relative pt-8">
                <img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1374&q=80" className="rounded-[32px] shadow-xl border border-slate-100" alt="Our journey" />
             </div>
        </div>
      </section>

    </div>
  );
};

export default About;