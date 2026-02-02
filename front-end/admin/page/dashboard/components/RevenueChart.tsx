import type { FC } from 'react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useAdminTransactions } from '@/hooks/admin/useAdminTransaction';

type TimeRange = 'WEEK' | 'MONTH' | 'YEAR';

const RevenueChart: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('YEAR');

    // 1. Helper tính toán ngày bắt đầu/kết thúc dựa trên TimeRange [ĐÃ FIX LOGIC DATE]
    const getDateRange = (range: TimeRange) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // [QUAN TRỌNG] Clone biến now ra để tính toán không bị xung đột
        let fromDate = new Date(now);
        let toDate = new Date(now);

        if (range === 'YEAR') {
            // Từ 1/1 đến 31/12 năm nay
            fromDate = new Date(currentYear, 0, 1);
            toDate = new Date(currentYear, 11, 31);
        } else if (range === 'MONTH') {
            // Từ ngày 1 đến ngày cuối tháng này (VD: 1/2 -> 28/2)
            fromDate = new Date(currentYear, currentMonth, 1);
            toDate = new Date(currentYear, currentMonth + 1, 0); // Ngày 0 của tháng sau = ngày cuối tháng này
        } else if (range === 'WEEK') {
            // Từ Thứ 2 đến Chủ Nhật tuần này
            const day = now.getDay(); // 0 (CN) -> 6 (T7)
            const diffToMonday = day === 0 ? 6 : day - 1;

            // Set Start Date (Thứ 2)
            fromDate = new Date(now);
            fromDate.setDate(now.getDate() - diffToMonday);
            fromDate.setHours(0, 0, 0, 0);

            // Set End Date (Chủ Nhật) = Thứ 2 + 6 ngày
            toDate = new Date(fromDate);
            toDate.setDate(fromDate.getDate() + 6);
            toDate.setHours(23, 59, 59, 999);
        }

        // Format YYYY-MM-DD cho API
        const format = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dd}`;
        };

        return { from: format(fromDate), to: format(toDate) };
    };

    const dateRange = useMemo(() => getDateRange(timeRange), [timeRange]);

    // 2. Fetch dữ liệu transaction (Chỉ lấy REDEMPTION)
    const { data: transactions, loading } = useAdminTransactions({
        page: 0,
        size: 10000, // Lấy số lượng lớn để gom nhóm
        type: 'REDEMPTION',
        fromDate: dateRange.from,
        toDate: dateRange.to
    });

    // 3. Xử lý dữ liệu: Gom nhóm theo Thời gian
    const chartData = useMemo(() => {
        let labels: string[] = [];
        let values: number[] = [];

        if (timeRange === 'YEAR') {
            // 12 Tháng
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            values = new Array(12).fill(0);
            transactions.forEach((t: any) => {
                if (t.transactionType === 'REDEMPTION') {
                    const month = new Date(t.createdAt).getMonth();
                    values[month] += (t.amount || 0);
                }
            });

        } else if (timeRange === 'MONTH') {
            // Các ngày trong tháng
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            // Labels: 1 -> 30/31
            labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
            values = new Array(daysInMonth).fill(0);

            transactions.forEach((t: any) => {
                if (t.transactionType === 'REDEMPTION') {
                    const d = new Date(t.createdAt).getDate();
                    if (d <= daysInMonth) values[d - 1] += (t.amount || 0);
                }
            });

        } else if (timeRange === 'WEEK') {
            // 7 Ngày (Thứ 2 -> CN)
            labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            values = new Array(7).fill(0);

            transactions.forEach((t: any) => {
                if (t.transactionType === 'REDEMPTION') {
                    let dayIndex = new Date(t.createdAt).getDay(); // 0=CN, 1=T2...
                    // Convert: 1(T2)->0, ..., 0(CN)->6
                    dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                    if (dayIndex >= 0 && dayIndex < 7) {
                        values[dayIndex] += (t.amount || 0);
                    }
                }
            });
        }

        return { labels, values };
    }, [transactions, timeRange]);

    // 4. Helper Format Tiền (150.000 VND)
    const formatCustomCurrency = (value: number) => {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
    };

    // 5. Vẽ Chart
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Reset kích thước canvas để tránh bị nhòe khi resize
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const { labels, values } = chartData;

        // Tìm Max Value để scale biểu đồ
        let maxVal = Math.max(...values);
        if (maxVal === 0) maxVal = 500000; // Giá trị mặc định nếu chưa có data
        const chartCeiling = maxVal * 1.2; // Thêm khoảng trống đỉnh

        const padding = { top: 50, right: 30, bottom: 40, left: 80 };
        const width = rect.width - padding.left - padding.right;
        const height = rect.height - padding.top - padding.bottom;
        const dataCount = labels.length;
        // Khoảng cách giữa các điểm trên trục X
        const stepX = width / (dataCount - 1 > 0 ? dataCount - 1 : 1);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- DRAW GRID ---
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // Grid Ngang (Tiền) - 5 dòng
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(rect.width - padding.right, y);
            ctx.stroke();
        }

        // Grid Dọc (Thời gian) - Vẽ tại mỗi điểm dữ liệu
        // Nếu quá dày (như xem Tháng), chỉ vẽ cách quãng
        const skipStep = dataCount > 15 ? 5 : 1;
        for (let i = 0; i < dataCount; i += skipStep) {
            const x = padding.left + stepX * i;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, rect.height - padding.bottom);
            ctx.stroke();
        }

        // --- DRAW AREA (Vùng màu) ---
        const gradient = ctx.createLinearGradient(0, padding.top, 0, rect.height - padding.bottom);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.5)'); // Màu tím xanh
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.0)');

        ctx.beginPath();
        values.forEach((val, i) => {
            const x = padding.left + stepX * i;
            const y = rect.height - padding.bottom - (val / chartCeiling) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        // Đóng vùng
        ctx.lineTo(padding.left + width, rect.height - padding.bottom);
        ctx.lineTo(padding.left, rect.height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // --- DRAW LINE (Đường kẻ chính) ---
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#667eea'; // Màu tím nhạt
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        values.forEach((val, i) => {
            const x = padding.left + stepX * i;
            const y = rect.height - padding.bottom - (val / chartCeiling) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // --- DRAW POINTS (Các điểm tròn) ---
        values.forEach((val, i) => {
            // Nếu xem tháng, chỉ vẽ điểm cách quãng hoặc điểm có giá trị > 0
            if (timeRange === 'MONTH' && i % 2 !== 0 && val === 0) return;

            const x = padding.left + stepX * i;
            const y = rect.height - padding.bottom - (val / chartCeiling) * height;

            // Glow
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
            glowGradient.addColorStop(0, 'rgba(102, 126, 234, 0.6)');
            glowGradient.addColorStop(1, 'rgba(102, 126, 234, 0)');

            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        });

        // --- DRAW LABELS ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // X-Axis Labels (Thời gian)
        labels.forEach((label, i) => {
            if (timeRange === 'MONTH' && i % 5 !== 0) return;

            const x = padding.left + stepX * i;
            ctx.fillText(label, x, rect.height - padding.bottom + 20);
        });

        // Y-Axis Labels (Tiền)
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const val = chartCeiling - (chartCeiling / 5) * i;
            const y = padding.top + (height / 5) * i;
            ctx.fillText(formatCustomCurrency(Math.round(val)), padding.left - 10, y);
        }

    }, [chartData, timeRange]);

    // Tổng doanh thu của khoảng thời gian đang chọn
    const totalRevenue = chartData.values.reduce((a, b) => a + b, 0);

    return (
        <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 animate-slideUp">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Tổng quan Doanh thu</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Doanh thu (Redemption) thực tế
                    </p>
                </div>

                {/* BUTTONS SWITCH TIME RANGE */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right mr-2 hidden sm:block">
                        <span className="block text-xs text-white/50 uppercase tracking-wider">Tổng thu</span>
                        <span className="text-xl font-bold text-emerald-400">
                            {formatCustomCurrency(totalRevenue)}
                        </span>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setTimeRange('WEEK')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                timeRange === 'WEEK'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            Tuần này
                        </button>
                        <button
                            onClick={() => setTimeRange('MONTH')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                timeRange === 'MONTH'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            Tháng này
                        </button>
                        <button
                            onClick={() => setTimeRange('YEAR')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                timeRange === 'YEAR'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            Năm nay
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-72 lg:h-80"
                />
                {/* Hiệu ứng sao nền */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                            style={{
                                left: `${10 + (i * 15)}%`,
                                top: `${20 + (i * 10)}%`,
                                animationDelay: `${i * 0.5}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-linear-to-r from-purple-500 to-blue-500"></div>
                    <span className="text-white/70 text-sm">
                        Biểu đồ doanh thu ({timeRange === 'WEEK' ? 'Theo ngày' : timeRange === 'MONTH' ? 'Theo ngày' : 'Theo tháng'})
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RevenueChart;