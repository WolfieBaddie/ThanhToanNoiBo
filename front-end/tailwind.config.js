/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./front-end/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./admin/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
        "./landing-page/**/*.{js,ts,jsx,tsx}"
    ],
    safelist: [
        'bg-app-bg',
        'dark:bg-slate-950',
        'text-slate-900',
        'dark:text-white'
    ],
    theme: {
        extend: {
            colors: {
                // --- MÀU NỀN ---
                'app-bg': '#E9EEF5', // Giữ nguyên nền xám xanh nhẹ

                // --- BỘ MÀU THƯƠNG HIỆU (BRANDING) ---
                // [UPDATED] Đổi về Xanh Dương (Blue-600)
                'brand-primary': '#2563EB',
                'brand-secondary': '#1D4ED8', // Blue-700 (Đậm hơn chút cho gradient/hover)
                'brand-dark': '#0F172A',      // Slate-900 (Màu chữ tối)

                'brand-black': '#0F172A',

                // Map lại vào primary
                primary: {
                    DEFAULT: '#2563EB', // [UPDATED] Blue-600
                    // Cập nhật RGB cho hiệu ứng glow (37, 99, 235) - Màu xanh dương
                    glow: 'rgba(37, 99, 235, 0.5)'
                },

                // Dark Mode Palette
                dark: {
                    base: '#0f172a',
                    card: '#1e293b',
                    lighter: '#334155',
                    border: '#334155',
                },

                // Accent Colors
                accent: {
                    green: '#10b981',
                    purple: '#8b5cf6',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
};