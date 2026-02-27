import type { FC } from 'react';
import { Package, Lock, Check, Edit } from 'lucide-react'; // Import icon Edit
import { CatalogStatus } from '@/types/admin.catalog.type';
import { MerchantItemInfo } from '@/types/admin.merchant.type';

interface MerchantAssetsListProps {
    items: MerchantItemInfo[];
    type: 'SERVICES' | 'PACKAGES';
    loading: boolean;
    onToggleStatus: (id: string, currentStatus: CatalogStatus) => void;
    onEdit: (item: MerchantItemInfo) => void; // [MỚI] Callback khi bấm sửa
}

export const MerchantAssetsList: FC<MerchantAssetsListProps> = ({
                                                                    items, type, loading, onToggleStatus, onEdit
                                                                }) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="text-xs text-white/40 uppercase bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                    <th className="p-3 rounded-tl-lg">Tên {type === 'SERVICES' ? 'Sản phẩm' : 'Gói'}</th>
                    <th className="p-3">Giá niêm yết</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right rounded-tr-lg">Thao tác</th>
                </tr>
                </thead>
                <tbody className="text-sm">
                {items.map((item) => (
                    <tr key={item.itemId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-white/10 shrink-0 overflow-hidden">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                            <Package size={16}/>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{item.itemName}</div>
                                    <div className="text-xs text-white/40">{item.itemCode}</div>
                                </div>
                            </div>
                        </td>
                        <td className="p-3 text-white/80 tabular-nums">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                        </td>
                        <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-xs border 
                                    ${item.status === CatalogStatus.ACTIVE ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    item.status === CatalogStatus.INACTIVE ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                    {item.status}
                                </span>
                        </td>
                        <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                                {/* Nút Sửa */}
                                <button
                                    onClick={() => onEdit(item)}
                                    className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                                    title="Chỉnh sửa thông tin"
                                    disabled={loading}
                                >
                                    <Edit size={16} />
                                </button>

                                {/* Nút Khóa/Mở */}
                                <button
                                    onClick={() => onToggleStatus(item.itemId, item.status)}
                                    disabled={loading}
                                    className={`p-2 rounded-lg transition-colors ${item.status === CatalogStatus.ACTIVE ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                                    title={item.status === CatalogStatus.ACTIVE ? "Khóa" : "Mở khóa"}
                                >
                                    {item.status === CatalogStatus.ACTIVE ? <Lock size={16} /> : <Check size={16} />}
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {items.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center py-10 text-white/30 italic">Không có dữ liệu</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
};