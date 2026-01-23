import React from 'react';
import Asland from "@/admin/components/background/Asland";
import ModalLogin from "@/admin/CPN/ModalLogin";

const LoginPage = () => {
    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-900">

            {/* Layer 1: Background Animation */}
            <div className="absolute inset-0 z-0">
                <Asland />
            </div>

        </div>
    )
}

export default LoginPage;