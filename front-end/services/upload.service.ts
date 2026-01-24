import axios from 'axios';

// [SỬA TẠI ĐÂY] Thay bằng thông tin thật của bạn
const CLOUD_NAME = "dygdbpwuf";      // Ví dụ: "dh5qp..."
const UPLOAD_PRESET = "swallet_proofs";  // Ví dụ: "ml_default" (phải là Unsigned)

export const uploadService = {
    uploadToCloudinary: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            // Log để kiểm tra xem URL đã đúng chưa
            console.log(`Uploading to: https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            if (response.data && response.data.secure_url) {
                return response.data.secure_url;
            } else {
                throw new Error("Phản hồi từ Cloudinary không hợp lệ");
            }
        } catch (error: any) {
            // In chi tiết lỗi từ Cloudinary để dễ debug
            console.error("Cloudinary Upload Detail:", error.response?.data || error.message);
            throw new Error("Không thể tải ảnh lên. Vui lòng kiểm tra cấu hình Cloudinary.");
        }
    }
};