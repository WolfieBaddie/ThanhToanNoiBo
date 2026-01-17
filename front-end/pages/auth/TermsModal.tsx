import React from 'react';
import { ShieldCheck } from 'lucide-react';
import {Modal} from "@/components/ui/Modal.tsx";

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Quy định Sử dụng Ví"
        >
            <div className="space-y-6 text-slate-600">
                <div className="p-4 bg-indigo-50 rounded-2xl flex gap-4 items-start border border-indigo-100">
                    <ShieldCheck className="text-indigo-600 shrink-0 mt-1" size={24} />
                    <div>
                        <h4 className="font-bold text-indigo-900 text-lg">Cam kết An toàn thực phẩm</h4>
                        <p className="text-sm text-indigo-700/80 mt-1">Hệ thống chỉ hợp tác với các nhà cung cấp suất ăn đạt chuẩn vệ sinh an toàn thực phẩm của Bộ Y Tế.</p>
                    </div>
                </div>

                <section>
                    <h4 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">1</span>
                        Quy định nạp tiền & Thanh toán
                    </h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                        <li>Ví Swallet chỉ được sử dụng trong phạm vi căng tin và các dịch vụ nội bộ của nhà trường.</li>
                        <li>Phụ huynh có thể đặt hạn mức chi tiêu hàng ngày cho học sinh.</li>
                        <li>Việc hoàn tiền số dư sẽ được thực hiện khi học sinh ra trường hoặc chuyển trường.</li>
                    </ul>
                </section>

                <section>
                    <h4 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">2</span>
                        Quyền riêng tư & Dữ liệu
                    </h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                        <li>Thông tin về khẩu phần ăn và lịch sử giao dịch được bảo mật và chỉ chia sẻ giữa Phụ huynh và Nhà trường.</li>
                        <li>Chúng tôi sử dụng dữ liệu để gợi ý thực đơn dinh dưỡng phù hợp cho sự phát triển của học sinh.</li>
                    </ul>
                </section>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 italic">
                    Áp dụng cho niên khóa 2024-2025.
                </div>
            </div>
        </Modal>
    );
};