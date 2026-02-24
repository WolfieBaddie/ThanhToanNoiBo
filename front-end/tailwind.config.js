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

    theme: {
        extend: {
            // --- 1. FONT CHỮ ---
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
            },

            // --- 2. BO GÓC & BÓNG ---
            borderRadius: {
                '3xl': '24px',
                '4xl': '32px',
                '5xl': '40px',
            },
            boxShadow: {
                'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.08)',
                'glow': '0 0 20px rgba(37, 99, 235, 0.2)',
            },

            // --- 3. MÀU SẮC ---
            colors: {
                'app-bg': '#E9EEF5', // Giữ nguyên nền light mode của bạn

                brand: {
                    primary: '#2563EB',
                    secondary: '#6366F1',
                    accent: '#F43F5E',
                    dark: '#0F172A',
                },

                // LƯU Ý: Đã gỡ bỏ brand-primary, brand-secondary bị lặp ở ngoài để code sạch hơn.
                // Khi code bạn nên dùng 'bg-brand-primary' thay vì khai báo lặp.

                primary: {
                    DEFAULT: '#2563EB',
                    glow: 'rgba(37, 99, 235, 0.5)'
                },

                // --- BỘ MÀU DARK MODE ĐÃ ĐƯỢC CHUẨN HÓA ---
                dark: {
                    base: '#0B0F19',     // Nền web: Xanh đen cực sâu
                    card: '#131C31',     // Nền thẻ: Xanh đen sáng hơn
                    lighter: '#1E2B4D',  // Hover
                    border: '#222F43',   // Viền
                    text: '#F8FAFC',     // Chữ chính
                    muted: '#94A3B8',    // Chữ phụ
                },
            },
        },
    },
    plugins: [],
};