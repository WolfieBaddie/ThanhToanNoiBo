//
// import React from 'react';
// import { ArrowRight } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { Voucher } from '../types';
//
// interface VoucherCardProps {
//   voucher: Voucher;
// }
//
// const VoucherCard: React.FC<VoucherCardProps> = ({ voucher }) => {
//   return (
//     <motion.div
//       whileHover={{ y: -8 }}
//       className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-premium hover:shadow-2xl transition-all duration-500 group flex flex-col h-full"
//     >
//       <div className="relative h-52 overflow-hidden">
//         <img
//           src={voucher.image}
//           alt={voucher.title}
//           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
//         />
//         <div className="absolute top-5 left-5">
//           <span className="bg-white/90 backdrop-blur-md text-brand-primary px-4 py-2 rounded-2xl text-[10px] font-black shadow-sm border border-white uppercase tracking-[0.1em]">
//             {voucher.category}
//           </span>
//         </div>
//       </div>
//       <div className="p-8 flex flex-col flex-grow">
//         <h3 className="text-xl font-extrabold text-slate-900 mb-2 group-hover:text-brand-primary transition-colors font-jakarta leading-tight">
//           {voucher.title}
//         </h3>
//         <p className="text-slate-500 text-sm mb-8 line-clamp-2 font-medium leading-relaxed">
//           {voucher.description}
//         </p>
//         <div className="mt-auto flex items-center justify-between">
//           <div className="flex flex-col">
//             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
//             <div className="flex items-baseline space-x-1">
//               <span className="text-2xl font-black text-slate-900 tracking-tight">{voucher.price.toLocaleString()}</span>
//               <span className="text-xs font-bold text-brand-primary uppercase">{voucher.currency}</span>
//             </div>
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.1 }}
//             className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm"
//           >
//             <ArrowRight className="w-5 h-5" />
//           </motion.button>
//         </div>
//       </div>
//     </motion.div>
//   );
// };
//
// export default VoucherCard;
