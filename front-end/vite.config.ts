import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        plugins: [react()],
        server: {
            port: 3000,
            host: true, // Cho phép truy cập bằng IP
            proxy: {
                '/api': {
                    target: 'http://192.168.1.5:8080', // IP máy ảo Backend (Check lại xem đúng 1.5 chưa nhé)
                    changeOrigin: true,
                    secure: false,
                }
            }
        },
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});