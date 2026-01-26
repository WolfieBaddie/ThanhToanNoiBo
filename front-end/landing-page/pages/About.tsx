import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, TrendingUp, Globe } from 'lucide-react';
import { useLanguage } from "@/translation/LanguageContext";

// Dữ liệu mẫu cho team (Bạn có thể thay đổi sau)
const teamMembers = [
  { id: 1, name: "Nguyễn Đỗ Ngọc Quý", role: "Leader - FullStack", image: "/images/quy-nguyen.jpg" },
  { id: 2, name: "Nguyễn Trọng Tấn", role: "FullStack", image: "https://i.pravatar.cc/150?img=22" },
  { id: 3, name: "Nguyễn Ngọc Văn", role: "FullStack", image: "/images/van-nguyen.jpg" },
  { id: 4, name: "Phạm Trung Hiếu", role: "Frontend", image: "/images/hieu-pham.jpg" },
  { id: 5, name: "Mai Duy Quân", role: "Tester - Frontend", image: "https://i.pravatar.cc/150?img=55" },
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
    <div className="overflow-hidden font-sans">
      
      {/* Hero Section with Mission */}
      <section className="relative pt-36 pb-24 lg:pt-52 lg:pb-40 bg-brand-dark overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/30 via-transparent to-transparent opacity-70"></div>
        
        <div className="max-w-7xl mx-auto px-8 lg:px-12 grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white">
              {t.about.heroTitle1} <span className="text-brand-primary">{t.about.heroTitle2}</span>
            </h1>
            <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-xl">
              {t.about.heroDesc}
            </p>
            <div className="flex items-center space-x-6 pt-4">
                <div className="h-px flex-1 bg-slate-700"></div>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Thành lập 2020</span>
                 <div className="h-px flex-1 bg-slate-700"></div>
            </div>
          </motion.div>
          
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:flex justify-center hidden"
          >
            <div className="relative z-10 w-[450px] h-[550px] bg-gradient-to-tr from-brand-primary via-brand-secondary to-brand-primary rounded-[60px] shadow-2xl overflow-hidden border-8 border-white/10">
                 <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" className="w-full h-full object-cover mix-blend-overlay opacity-80 hover:scale-110 transition-transform duration-1000" alt="Team working" />
                 <div className="absolute inset-0 bg-brand-dark/30"></div>
            </div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-primary rounded-full blur-3xl opacity-40 -z-10 animate-pulse-slow"></div>
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
                        className="bg-slate-50 rounded-[30px] p-8 text-center hover:shadow-xl transition-all group"
                    >
                        <div className={`${stat.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-4xl font-black text-brand-dark mb-2">{stat.value}</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">{stat.label}</p>
                    </motion.div>
                ))}
             </div>
         </div>
      </section>

      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 mb-16 text-center">
          <h2 className="text-brand-primary font-black uppercase tracking-[0.2em] text-sm italic underline decoration-2 underline-offset-8 mb-4">
            {t.about.team.badge}
          </h2>
          <h3 className="text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight">
            {t.about.team.title}
          </h3>
        </div>
        
        <div className="relative w-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
          
          <div 
            className="flex whitespace-nowrap"
            style={{ animation: 'ticker 25s linear infinite' }}
          >
            {[...teamMembers, ...teamMembers].map((member, index) => (
              <div key={index} className="inline-block px-6">
                <div className="w-64 h-80 bg-white rounded-[30px] shadow-lg p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-brand-primary/20 mb-6"
                  />
                  <h4 className="text-xl font-bold text-brand-dark mb-2">{member.name}</h4>
                  <p className="text-brand-primary font-medium text-sm uppercase tracking-wider">{member.role}</p>
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

      {/* Story/Timeline Section - Rút gọn cho demo */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-8 text-center space-y-8">
             <h2 className="text-3xl font-bold text-brand-dark">{t.about.journey.title}</h2>
             <p className="text-slate-500 text-lg leading-relaxed">
                 {t.about.journey.desc}
             </p>
             <img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80" className="rounded-[40px] shadow-2xl mt-12" alt="Our journey" />
        </div>
      </section>

    </div>
  );
};

export default About;