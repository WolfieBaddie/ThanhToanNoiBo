/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./components/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                // Màu nền chuẩn mẫu Zenith
                dark: {
                    base: '#0f172a',    // Nền tổng thể (Slate 950)
                    card: '#1e293b',    // Nền Card (Slate 800)
                    lighter: '#334155', // Hover state
                    border: '#334155',  // Viền (Slate 700)
                },
                primary: {
                    DEFAULT: '#3b82f6', // Blue 500
                    glow: 'rgba(59, 130, 246, 0.5)'
                },
                accent: {
                    green: '#10b981', // Emerald 500
                    purple: '#8b5cf6', // Violet 500
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Font mẫu dùng Inter
            }
        },
    },
  plugins: [],
};

