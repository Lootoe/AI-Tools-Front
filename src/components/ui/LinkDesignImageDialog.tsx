import React from 'react';
import { X, Image as ImageIcon, Check } from 'lucide-react';
import { ImageVariant, StoryboardImage } from '@/types/video';

interface LinkDesignImageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    storyboardImages: StoryboardImage[];
    sceneNumber: number;
    onSelect: (imageUrl: string) => void;
}

export const LinkDesignImageDialog: React.FC<LinkDesignImageDialogProps> = ({
    isOpen,
    onClose,
    storyboardImages,
    sceneNumber,
    onSelect,
}) => {
    if (!isOpen) return null;

    // 筛选同一 sceneNumber 的分镜图
    const matchingImages = storyboardImages.filter(
        (img) => img.sceneNumber === sceneNumber
    );

    // 提取所有已完成的 ImageVariant
    const availableVariants: (ImageVariant & { parentDescription: string })[] = [];
    matchingImages.forEach((img) => {
        (img.imageVariants || []).forEach((variant) => {
            if (variant.status === 'completed' && variant.imageUrl) {
                availableVariants.push({
                    ...variant,
                    parentDescription: img.description || `分镜图 ${img.sceneNumber}`,
                });
            }
        });
    });

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
                        <ImageIcon size={16} style={{ color: '#00f5ff' }} />
                        <span className="text-sm font-medium text-white">
                            关联设计稿 - 分镜 #{sceneNumber}
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
                    {availableVariants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div
                                className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
                                    border: '1px solid rgba(0,245,255,0.2)',
                                }}
                            >
                                <ImageIcon size={28} style={{ color: 'rgba(0,245,255,0.4)' }} />
                            </div>
                            <p className="text-sm text-center" style={{ color: '#6b7280' }}>
                                暂无可关联的设计稿
                            </p>
                            <p className="text-xs text-center mt-1" style={{ color: '#4b5563' }}>
                                请先在分镜图工作区生成对应分镜的图片
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {availableVariants.map((variant) => (
                                <button
                                    key={variant.id}
                                    onClick={() => handleSelect(variant.imageUrl!)}
                                    className="group relative aspect-square rounded-lg overflow-hidden transition-all hover:scale-105"
                                    style={{
                                        border: '2px solid transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.border = '2px solid rgba(0,245,255,0.6)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(0,245,255,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.border = '2px solid transparent';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <img
                                        src={variant.imageUrl}
                                        alt={variant.parentDescription}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* 悬浮遮罩 */}
                                    <div
                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{
                                                background: 'linear-gradient(135deg, #00f5ff, #00d4ff)',
                                                boxShadow: '0 0 15px rgba(0,245,255,0.5)',
                                            }}
                                        >
                                            <Check size={20} className="text-black" />
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
                        选择一张设计稿作为视频生成的参考图
                    </p>
                </div>
            </div>
        </div>
    );
};
