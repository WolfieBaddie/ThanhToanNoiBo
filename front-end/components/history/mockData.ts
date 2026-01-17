
import { Transaction } from './types';

export const generateMockData = (): Transaction[] => {
  const data: Transaction[] = [];
  const titlesOut = ['Cơm trưa (Combo 1)', 'Sữa tươi Vinamilk', 'Bánh mì sandwich', 'Mua dụng cụ học tập', 'Nước cam ép', 'Phở bò', 'Snack khoai tây', 'Trà đào cam sả'];
  const titlesIn = ['Nạp tiền vào ví', 'Nạp tiền tự động', 'Hoàn tiền', 'Thưởng học tập'];
  const now = new Date();

  for (let i = 0; i < 45; i++) {
    const isIncome = Math.random() > 0.7;
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 100)); 
    date.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 60));

    data.push({
      id: i + 1,
      title: isIncome 
        ? titlesIn[Math.floor(Math.random() * titlesIn.length)] 
        : titlesOut[Math.floor(Math.random() * titlesOut.length)],
      date: date.toISOString(),
      displayDate: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      amount: isIncome ? (Math.floor(Math.random() * 5) + 1) * 100000 : (Math.floor(Math.random() * 10) + 1) * 5000 * -1,
      type: isIncome ? 'in' : 'out',
      status: 'Thành công',
      ref: isIncome ? `Momo-${10000 + i}` : `POS-${20000 + i}`
    });
  }
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
