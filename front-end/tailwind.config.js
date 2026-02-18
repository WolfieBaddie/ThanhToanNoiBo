/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Có thể xóa dòng này nếu muốn diệt tận gốc Dark Mode như đã bàn
    content: [
        "./index.html",
        "./front-end/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./admin/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
        "./landing-page/**/*.{js,ts,jsx,tsx}"
    ],

    theme: {
        extend: {
            // --- 1. MANG TỪ HTML VÀO: FONT CHỮ ---
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'], // Font mặc định
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],      // Font riêng nếu cần
            },

            // --- 2. MANG TỪ HTML VÀO: BO GÓC & BÓNG ---
            borderRadius: {
                '3xl': '24px',
                '4xl': '32px',
                '5xl': '40px',
            },
            boxShadow: {
                'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.08)',
                'glow': '0 0 20px rgba(37, 99, 235, 0.2)',
            },

            // --- 3. MÀU SẮC (Đã gộp chuẩn) ---
            colors: {
                'app-bg': '#E9EEF5',

                // Bộ màu Brand (Hợp nhất giữa cái cũ và cái trong HTML)
                brand: {
                    primary: '#2563EB',   // Electric Blue (Giống HTML)
                    secondary: '#6366F1', // Indigo (Giống HTML)
                    accent: '#F43F5E',    // Coral/Rose (Giống HTML)
                    dark: '#0F172A',      // Slate 900
                },

                // Giữ lại mấy cái định nghĩa cũ của mày để đỡ lỗi code cũ
                'brand-primary': '#2563EB',
                'brand-secondary': '#1D4ED8',
                'brand-dark': '#0F172A',

                primary: {
                    DEFAULT: '#2563EB',
                    glow: 'rgba(37, 99, 235, 0.5)'
                },

                // Dark Mode Palette
                dark: {
                    base: '#0f172a',
                    card: '#1e293b',
                    lighter: '#334155',
                    border: '#334155',
                },
            },
        },
    },
    plugins: [],
};