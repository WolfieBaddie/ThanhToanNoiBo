import type { FC } from 'react';
import { useEffect, useRef } from 'react';

const RevenueChart: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenue = [30, 45, 60, 75, 90, 105, 120, 135, 112, 140, 125, 150]; // Updated values
    const padding = { top: 50, right: 40, bottom: 40, left: 60 };
    const width = rect.width - padding.left - padding.right;
    const height = rect.height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical grid
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, rect.height - padding.bottom);
      ctx.stroke();
    }

    // Horizontal grid
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(rect.width - padding.right, y);
      ctx.stroke();
    }

    // Draw area
    const maxRevenue = Math.max(...revenue);
    const gradient = ctx.createLinearGradient(0, padding.top, 0, rect.height - padding.bottom);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.05)');

    ctx.beginPath();
    revenue.forEach((value, index) => {
      const x = padding.left + (width / (revenue.length - 1)) * index;
      const y = rect.height - padding.bottom - (value / maxRevenue) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(rect.width - padding.right, rect.height - padding.bottom);
    ctx.lineTo(padding.left, rect.height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#667eea';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    revenue.forEach((value, index) => {
      const x = padding.left + (width / (revenue.length - 1)) * index;
      const y = rect.height - padding.bottom - (value / maxRevenue) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points with glow
    revenue.forEach((value, index) => {
      const x = padding.left + (width / (revenue.length - 1)) * index;
      const y = rect.height - padding.bottom - (value / maxRevenue) * height;

      // Glow effect
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
      glowGradient.addColorStop(0, 'rgba(102, 126, 234, 0.6)');
      glowGradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
      
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Point
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      
      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#667eea';
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Month labels
    revenue.forEach((_, index) => {
      const x = padding.left + (width / (revenue.length - 1)) * index;
      ctx.fillText(months[index], x, rect.height - padding.bottom + 20);
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxRevenue / 5) * i);
      const y = rect.height - padding.bottom - (height / 5) * i;
      ctx.fillText(`$${value}`, padding.left - 10, y);
    }

    // Add highlighted values from image
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    
    // $140 label
    const highlightIndex = months.indexOf('Oct');
    if (highlightIndex !== -1) {
      const x = padding.left + (width / (revenue.length - 1)) * highlightIndex;
      const y = rect.height - padding.bottom - (revenue[highlightIndex] / maxRevenue) * height;
      ctx.fillText('$140', x + 15, y - 15);
    }
    
    // $112 label
    const highlightIndex2 = months.indexOf('Sep');
    if (highlightIndex2 !== -1) {
      const x = padding.left + (width / (revenue.length - 1)) * highlightIndex2;
      const y = rect.height - padding.bottom - (revenue[highlightIndex2] / maxRevenue) * height;
      ctx.fillText('$112', x + 15, y - 15);
    }

  }, []);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 animate-slideUp">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white">Revenue Overview</h3>
          <p className="text-white/60 text-sm mt-1">Monthly revenue analytics</p>
        </div>
        <div className="flex gap-3">
          <button className="text-white cursor-pointer px-5 py-2.5 rounded-2xl bg-linear-to-r from-purple-500/20 to-blue-500/20 border border-white/10 text-sm font-medium hover:scale-105 transition-transform active:scale-95">
            This Month
          </button>
          <button className="text-white cursor-pointer px-5 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-sm font-medium hover:scale-105 transition-transform active:scale-95">
            Custom Range
          </button>
        </div>
      </div>
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          className="w-full h-72 lg:h-80"
        />
        {/* Animated sparkles */}
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
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-linear-to-r from-purple-500 to-blue-500"></div>
          <span className="text-white/70 text-sm">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-white/40"></div>
          <span className="text-white/70 text-sm">Target</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;