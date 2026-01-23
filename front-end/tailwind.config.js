/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./admin/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
        "./landing-page/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                // Cập nhật: Màu nền (App Background) - Xám xanh nhẹ
                'app-bg': '#E9EEF5',

                // Cập nhật: Màu đen thương hiệu (Brand Black) - Slate 900
                // Dùng cho văn bản chính hoặc các nút tối màu để tạo tương phản cao
                'brand-black': '#0F172A',

                // Cập nhật: Màu chủ đạo (Primary) - Lime rực rỡ
                primary: {
                    DEFAULT: '#B6F026',
                    // Cập nhật glow theo hệ màu Lime (RGB: 182, 240, 38)
                    glow: 'rgba(182, 240, 38, 0.5)'
                },

                // Giữ nguyên cấu hình Dark Mode (Slate palette)
                // Lưu ý: dark.base hiện tại trùng mã với brand-black, rất tốt cho tính nhất quán
                dark: {
                    base: '#0f172a',    // Nền tổng thể (Slate 950)
                    card: '#1e293b',    // Nền Card (Slate 800)
                    lighter: '#334155', // Hover state
                    border: '#334155',  // Viền (Slate 700)
                },

                // Các màu nhấn phụ trợ (Giữ nguyên)
                accent: {
                    green: '#10b981', // Emerald 500
                    purple: '#8b5cf6', // Violet 500
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
};