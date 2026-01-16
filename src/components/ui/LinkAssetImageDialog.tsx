import React, { useState, useEffect } from 'react';
import { X, Check, Palette, Folder } from 'lucide-react';
import { Asset } from '@/types/asset';
import { SavedAsset, AssetCategory } from '@/types/canvas';
import * as repositoryApi from '@/services/repositoryApi';

interface LinkAssetImageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    assets?: Asset[] | SavedAsset[];
    categories?: AssetCategory[];
    scriptId?: string;
    onSelect: (imageUrl: string) => void;
}

export const LinkAssetImageDialog: React.FC<LinkAssetImageDialogProps> = ({
    isOpen,
    onClose,
    assets,
    categories,
    scriptId,
    onSelect,
}) => {
    const [allAssets, setAllAssets] = useState<SavedAsset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // 如果传入了 categories 和 scriptId，则从所有分类加载资产
    useEffect(() => {
        if (isOpen && categories && scriptId && categories.length > 0) {
            loadAllAssets();
        }
    }, [isOpen, categories, scriptId]);

    const loadAllAssets = async () => {
        if (!categories || !scriptId) return;

        setIsLoading(true);
        try {
            const assetsPromises = categories.map(category =>
                repositoryApi.fetchAssets(scriptId, category.id)
            );
            const assetsArrays = await Promise.all(assetsPromises);
            const flatAssets = assetsArrays.flat();
            setAllAssets(flatAssets);
            // 默认选中第一个分类
            if (categories.length > 0) {
                setSelectedCategoryId(categories[0].id);
            }
        } catch (error) {
            console.error('加载资产失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // 判断是使用传入的 assets 还是加载的 allAssets
    const useRepositoryAssets = categories && scriptId;
    const displayAssets = useRepositoryAssets ? allAssets : (assets || []);

    // 判断是 Asset 还是 SavedAsset
    const isAssetArray = !useRepositoryAssets && displayAssets.length > 0 && 'designImageUrl' in displayAssets[0];

    // 筛选已完成且有图片的资产
    const availableAssets = isAssetArray
        ? (displayAssets as Asset[]).filter((asset) => asset.status === 'completed' && asset.designImageUrl)
        : (displayAssets as SavedAsset[]).filter((asset) => asset.imageUrl);

    // 如果使用资产仓库，按分类过滤
    const filteredAssets = useRepositoryAssets && selectedCategoryId
        ? availableAssets.filter((asset) => (asset as SavedAsset).categoryId === selectedCategoryId)
        : availableAssets;

    const getImageUrl = (asset: Asset | SavedAsset): string | undefined => {
        if ('designImageUrl' in asset) {
            return asset.designImageUrl;
        }
        return (asset as SavedAsset).imageUrl;
    };

    const getName = (asset: Asset | SavedAsset) => {
        return asset.name || '未命名';
    };

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
                className="relative w-full max-w-3xl max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
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

                {/* 分类选择（仅资产仓库模式） */}
                {useRepositoryAssets && categories && categories.length > 0 && (
                    <div
                        className="flex items-center gap-2 px-4 py-2 overflow-x-auto"
                        style={{ borderBottom: '1px solid rgba(0,245,255,0.1)' }}
                    >
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategoryId(category.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                                style={{
                                    backgroundColor: selectedCategoryId === category.id
                                        ? 'rgba(191,0,255,0.2)'
                                        : 'rgba(30,30,46,0.5)',
                                    color: selectedCategoryId === category.id ? '#bf00ff' : '#9ca3af',
                                    border: selectedCategoryId === category.id
                                        ? '1px solid rgba(191,0,255,0.4)'
                                        : '1px solid transparent',
                                }}
                            >
                                <Folder size={12} />
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div
                                    className="w-8 h-8 rounded-full animate-spin mx-auto mb-2"
                                    style={{ border: '2px solid #bf00ff', borderTopColor: 'transparent' }}
                                />
                                <p className="text-xs" style={{ color: '#6b7280' }}>
                                    加载中...
                                </p>
                            </div>
                        </div>
                    ) : filteredAssets.length === 0 ? (
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
                                {useRepositoryAssets ? '该分类下暂无资产' : '暂无可关联的资产设计稿'}
                            </p>
                            <p className="text-xs text-center mt-1" style={{ color: '#4b5563' }}>
                                {useRepositoryAssets ? '请在资产画布中生成并保存资产' : '请先在资产工作区生成资产设计稿'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            {filteredAssets.map((asset) => {
                                const imageUrl = getImageUrl(asset);
                                const name = getName(asset);
                                return (
                                    <button
                                        key={asset.id}
                                        onClick={() => handleSelect(imageUrl!)}
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
                                            src={imageUrl}
                                            alt={name}
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
                                            {name}
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
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 底部提示 */}
                <div
                    className="px-4 py-3 text-center"
                    style={{ borderTop: '1px solid rgba(0,245,255,0.2)' }}
                >
                    <p className="text-[10px]" style={{ color: '#6b7280' }}>
                        选择一张资产设计稿作为视频生成的参考图
                    </p>
                </div>
            </div>
        </div>
    );
};
