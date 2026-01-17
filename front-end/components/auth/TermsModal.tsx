
import React from 'react';
import { Modal } from '../ui/Modal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quy định Sử dụng">
      <div className="text-slate-600 space-y-4">
        <p><strong>1. Quy định chung</strong></p>
        <p>Hệ thống ví điện tử Swallet được thiết kế dành riêng cho học sinh, phụ huynh và cán bộ nhân viên nhà trường nhằm mục đích thanh toán không dùng tiền mặt tại căng tin và các dịch vụ trong trường.</p>
        
        <p><strong>2. Bảo mật tài khoản</strong></p>
        <p>Người dùng có trách nhiệm bảo mật thông tin tài khoản và mật khẩu. Không chia sẻ mã OTP hoặc mật khẩu cho bất kỳ ai.</p>
        
        <p><strong>3. Giao dịch và Hoàn tiền</strong></p>
        <p>Các giao dịch đã thực hiện thành công sẽ không được hoàn lại trừ trường hợp do lỗi hệ thống. Vui lòng kiểm tra kỹ số tiền trước khi xác nhận thanh toán.</p>
        
        <p><strong>4. Giới hạn sử dụng</strong></p>
        <p>Tài khoản học sinh có thể được thiết lập hạn mức chi tiêu theo ngày bởi phụ huynh.</p>
      </div>
    </Modal>
  );
};
