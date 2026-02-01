import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
// [MỚI] Import React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

// [MỚI] Tạo instance client (Tạo bên ngoài component render)
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Tắt tự động fetch lại khi focus tab (tùy chọn)
            retry: 1, // Thử lại 1 lần nếu lỗi
        },
    },
});

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        {/* [MỚI] Bọc QueryClientProvider ở đây */}
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>

            {/* [MỚI] Công cụ debug (chỉ hiện icon nhỏ góc màn hình ở dev mode) */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </React.StrictMode>
);