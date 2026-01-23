import React from 'react';
import Galaxy from "./Galaxy";
// Đảm bảo đường dẫn import đúng tới ModalLogin của bạn
import ModalLogin from "@/admin/components/login/CPN/ModalLogin.tsx";

const Asland = () => {
    return (
        // Container chính: Full màn hình (h-screen), ẩn thanh cuộn thừa (overflow-hidden)
        <div className="relative w-full h-screen overflow-hidden bg-slate-900">

            {/* Layer 1: Background Galaxy (Tuyệt đối, full khung) */}
            <div className="absolute inset-0 z-0">
                <Galaxy
                    starSpeed={0.5}
                    density={3}
                    hueShift={105}
                    speed={1}
                    glowIntensity={0.2}
                    saturation={0}
                    mouseRepulsion
                    repulsionStrength={0.5}
                    twinkleIntensity={0.15}
                    rotationSpeed={0.1}
                    transparent
                />
            </div>

            {/* Layer 2: Content (Nằm đè lên trên, dùng Flexbox để căn giữa Form) */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                <ModalLogin />
            </div>

        </div>
    );
};

export default Asland;