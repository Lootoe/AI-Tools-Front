import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { Asset } from '@/types/asset';

interface LinkAssetImageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    assets: Asset[];
    onSelect: (imageUrl: string) => void;
}

export const LinkAssetImageDialog: React.FC<LinkAssetImageDialogProps> = ({
    isOpen,
    onClose,
    assets,
    onSelect,
}) => {
    if (!isOpen) return null;

    // 筛选已完成且有设计稿图片的资产
    const availableAssets = assets.filter(
        (asset) => asset.status === 'completed' && asset.designImageUrl
    );

    const handleSelect = (imageUrl: string) => {
        onSelect(imageUrl);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
                style={{
                    backgroundColor: '#12121a',
                    border: '1px solid rgba(0,245,255,0.3)',
                    boxShadow: '0 0 30px rgba(0,245,255,0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 标题栏 */}
                <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(0,245,255,0.2)' }}
                >
                    <div className="flex items-center gap-2">
                        <Palette size={16} style={{ color: '#bf00ff' }} />
                        <span className="text-sm font-medium text-white">
                            关联资产设计稿
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                        <X size={18} style={{ color: '#9ca3af' }} />
                    </button>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto p-4">
                    {availableAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div
                                className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(191,0,255,0.1), rgba(0,245,255,0.1))',
                                    border: '1px solid rgba(191,0,255,0.2)',
                                }}
                            >
                                <Palette size={28} style={{ color: 'rgba(191,0,255,0.4)' }} />
                            </div>
                            <p className="text-sm text-center" style={{ color: '#6b7280' }}>
                                暂无可关联的资产设计稿
                            </p>
                            <p className="text-xs text-center mt-1" style={{ color: '#4b5563' }}>
                                请先在资产工作区生成资产设计稿
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {availableAssets.map((asset) => (
                                <button
                                    key={asset.id}
                                    onClick={() => handleSelect(asset.designImageUrl!)}
                                    className="group relative aspect-square rounded-lg overflow-hidden transition-all hover:scale-105"
                                    style={{
                                        border: '2px solid transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.border = '2px solid rgba(191,0,255,0.6)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(191,0,255,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.border = '2px solid transparent';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <img
                                        src={asset.designImageUrl}
                                        alt={asset.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* 资产名称标签 */}
                                    <div
                                        className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] truncate"
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: '#d1d5db',
                                        }}
                                    >
                                        {asset.name}
                                    </div>
                                    {/* 悬浮遮罩 */}
                                    <div
                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{
                                                background: 'linear-gradient(135deg, #bf00ff, #9900cc)',
                                                boxShadow: '0 0 15px rgba(191,0,255,0.5)',
                                            }}
                                        >
                                            <Check size={20} className="text-white" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 底部提示 */}
                <div
                    className="px-4 py-3 text-center"
                    style={{ borderTop: '1px solid rgba(0,245,255,0.2)' }}
                >
                    <p className="text-[10px]" style={{ color: '#6b7280' }}>
                        选择一张资产设计稿作为分镜图生成的参考图
                    </p>
                </div>
            </div>
        </div>
    );
};
