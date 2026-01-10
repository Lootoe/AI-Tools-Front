import React, { useState, useEffect, useRef } from 'react';
import {
    Package,
    Sparkles,
    Plus,
    Trash2,
    Wand2,
    Image as ImageIcon,
    Download,
    Upload,
    Save,
    ChevronDown,
    Users,
    Mountain,
    Box,
    X,
    ImagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Loading, InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { generateAssetDesign } from '@/services/assetApi';
import { uploadImage } from '@/services/api';
import { Asset, AssetType, ASSET_TYPE_CONFIGS } from '@/types/asset';
import CoinIcon from '@/img/coin.png';

interface AssetWorkspaceProps {
    scriptId: string;
}

const IMAGE_MODELS = [
    { value: 'nano-banana-2', label: 'Nano Banana 2' },
    { value: 'doubao-seedream-3-0-t2i-250415', label: '豆包' },
] as const;

type ImageModel = typeof IMAGE_MODELS[number]['value'];

// 资产类型选项
const ASSET_TYPES: { value: AssetType; label: string; icon: React.ReactNode }[] = [
    { value: 'character', label: '角色', icon: <Users size={12} /> },
    { value: 'scene', label: '场景', icon: <Mountain size={12} /> },
    { value: 'prop', label: '物品', icon: <Box size={12} /> },
];

// 获取资产类型图标
const getAssetIcon = (type: AssetType, size: number = 24) => {
    switch (type) {
        case 'character': return <Users size={size} style={{ color: 'rgba(107,114,128,0.4)' }} />;
        case 'scene': return <Mountain size={size} style={{ color: 'rgba(107,114,128,0.4)' }} />;
        case 'prop': return <Box size={size} style={{ color: 'rgba(107,114,128,0.4)' }} />;
    }
};

// 单个资产卡片组件
interface AssetCardProps {
    asset: Asset;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, isSelected, onSelect, onDelete }) => {
    const isGenerating = asset.status === 'generating';

    return (
        <div
            onClick={onSelect}
            className="group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
            style={{
                backgroundColor: 'rgba(18,18,26,0.9)',
                border: '1px solid',
                borderColor: isSelected ? 'rgba(0,245,255,0.6)' : 'rgba(30,30,46,0.8)',
                boxShadow: isSelected
                    ? '0 0 12px rgba(0,245,255,0.25), inset 0 0 20px rgba(0,245,255,0.05)'
                    : '0 2px 8px rgba(0,0,0,0.3)',
            }}
        >
            <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {isGenerating ? <InlineLoading size={20} color="#bf00ff" /> : getAssetIcon(asset.type)}
                    </div>
                )}
                {isGenerating && asset.thumbnailUrl && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <InlineLoading size={20} color="#bf00ff" />
                    </div>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    style={{ backgroundColor: 'rgba(239,68,68,0.9)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    title="删除"
                >
                    <Trash2 size={10} className="text-white" />
                </button>
                {isSelected && (
                    <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#00f5ff', boxShadow: '0 0 6px rgba(0,245,255,0.8)' }} />
                )}
            </div>
            <div className="px-1.5 py-1.5 text-center h-7 flex items-center justify-center">
                <span className="text-[10px] font-medium truncate" style={{ color: isSelected ? '#00f5ff' : '#d1d5db' }}>
                    {asset.name || '未命名'}
                </span>
            </div>
        </div>
    );
};

// 新建资产卡片
const NewAssetCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div
        onClick={onClick}
        className="rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
        style={{ backgroundColor: 'rgba(18,18,26,0.5)', border: '1px dashed rgba(0,245,255,0.2)' }}
    >
        <div className="aspect-square flex flex-col items-center justify-center">
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}
            >
                <Plus size={16} style={{ color: '#00f5ff' }} />
            </div>
        </div>
        <div className="px-1.5 py-1.5 text-center h-7 flex items-center justify-center">
            <span className="text-[10px]" style={{ color: '#6b7280' }}>新建</span>
        </div>
    </div>
);

export const AssetWorkspace: React.FC<AssetWorkspaceProps> = ({ scriptId }) => {
    const { assets, isLoading, loadAssets, addAsset, updateAsset, deleteAsset } = useAssetStore();
    const { updateBalance } = useAuthStore();
    const { showToast, ToastContainer } = useToast();

    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAssetType, setSelectedAssetType] = useState<AssetType>('character');
    const [isAssetTypeDropdownOpen, setIsAssetTypeDropdownOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const refImageInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingRef, setIsUploadingRef] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ImageModel>('nano-banana-2');
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; assetId: string | null; assetName: string }>({
        isOpen: false, assetId: null, assetName: '',
    });

    useEffect(() => {
        if (scriptId) loadAssets(scriptId);
    }, [scriptId, loadAssets]);

    useEffect(() => {
        const selected = assets.find((a) => a.id === selectedAssetId);
        if (selected) {
            setEditDescription(selected.description || '');
            setEditName(selected.name || '');
            setSelectedAssetType(selected.type);
        } else {
            setEditDescription('');
            setEditName('');
        }
    }, [selectedAssetId, assets]);

    const selectedAsset = assets.find((a) => a.id === selectedAssetId);
    const isProcessing = selectedAsset?.status === 'generating' || isUploading;
    const hasDesignImage = !!selectedAsset?.designImageUrl;
    const config = ASSET_TYPE_CONFIGS[selectedAssetType];

    const handleCreateAsset = async () => {
        try {
            const assetId = await addAsset(scriptId, '新资产', '', selectedAssetType);
            setSelectedAssetId(assetId);
        } catch { /* 错误由 API 层统一处理 */ }
    };

    const handleGenerateDesign = async () => {
        if (!selectedAsset || !editDescription.trim() || isProcessing) return;
        const tokenCost = selectedModel === 'nano-banana-2' ? 4 : 2;
        updateBalance((prev) => prev - tokenCost);

        // 本地先设置为 generating 状态
        await updateAsset(scriptId, selectedAsset.id, { status: 'generating' });

        try {
            const response = await generateAssetDesign(
                selectedAsset.id,
                scriptId,
                editDescription.trim(),
                selectedAssetType,
                selectedModel,
                selectedAsset.referenceImageUrls || []
            );

            // 后端已更新数据库，重新加载资产列表
            await loadAssets(scriptId);

            if (response.balance !== undefined) updateBalance(response.balance);
            if (response.success) {
                showToast('设计稿生成成功', 'success');
            } else {
                showToast('生成失败，代币已返还', 'error');
            }
        } catch (error) {
            console.error('生成设计稿错误:', error);
            // 重新加载以获取最新状态
            await loadAssets(scriptId);
            showToast('生成失败，请重试', 'error');
        }
    };

    const handleSave = async () => {
        if (!selectedAsset || isSaving) return;
        setIsSaving(true);
        try {
            await updateAsset(scriptId, selectedAsset.id, {
                name: editName.trim() || '未命名资产',
                description: editDescription.trim(),
                type: selectedAssetType,
            });
            showToast('保存成功', 'success');
        } catch { /* 错误由 API 层统一处理 */ }
        finally { setIsSaving(false); }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedAsset || isProcessing) return;
        setIsUploading(true);
        try {
            const response = await uploadImage(file);
            if (response.success && response.url) {
                await updateAsset(scriptId, selectedAsset.id, {
                    designImageUrl: response.url, thumbnailUrl: response.url, status: 'completed',
                });
                showToast('图片上传成功', 'success');
            }
        } catch { /* 错误由 API 层统一处理 */ }
        finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteClick = (asset: Asset) => {
        setDeleteConfirm({ isOpen: true, assetId: asset.id, assetName: asset.name || '未命名资产' });
    };

    // 上传参考图
    const handleUploadRefImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !selectedAsset) return;
        setIsUploadingRef(true);
        try {
            const currentRefs = selectedAsset.referenceImageUrls || [];
            const newUrls: string[] = [];
            for (const file of Array.from(files)) {
                const response = await uploadImage(file);
                if (response.success && response.url) {
                    newUrls.push(response.url);
                }
            }
            if (newUrls.length > 0) {
                await updateAsset(scriptId, selectedAsset.id, {
                    referenceImageUrls: [...currentRefs, ...newUrls],
                });
                showToast(`成功上传 ${newUrls.length} 张参考图`, 'success');
            }
        } catch { /* 错误由 API 层统一处理 */ }
        finally {
            setIsUploadingRef(false);
            if (refImageInputRef.current) refImageInputRef.current.value = '';
        }
    };

    // 删除参考图
    const handleDeleteRefImage = async (index: number) => {
        if (!selectedAsset) return;
        const currentRefs = selectedAsset.referenceImageUrls || [];
        const newRefs = currentRefs.filter((_, i) => i !== index);
        await updateAsset(scriptId, selectedAsset.id, { referenceImageUrls: newRefs });
        showToast('参考图已删除', 'success');
    };

    const handleConfirmDelete = async () => {
        if (deleteConfirm.assetId) {
            try {
                await deleteAsset(scriptId, deleteConfirm.assetId);
                if (selectedAssetId === deleteConfirm.assetId) setSelectedAssetId(null);
            } catch { /* 错误由 API 层统一处理 */ }
        }
        setDeleteConfirm({ isOpen: false, assetId: null, assetName: '' });
    };

    const handleCancelDelete = () => {
        setDeleteConfirm({ isOpen: false, assetId: null, assetName: '' });
    };

    return (
        <>
            <ToastContainer />
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title={config.deleteTitle}
                message={config.deleteMessage(deleteConfirm.assetName)}
                type="danger"
                confirmText="删除"
                cancelText="取消"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
            <div className="flex-1 flex gap-3 overflow-hidden">
                {/* 左侧：资产池 */}
                <div className="w-[280px] flex-shrink-0 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                    <div className="px-3 py-2.5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #1e1e2e' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,0,255,0.15))', border: '1px solid rgba(0,245,255,0.3)' }}>
                                <Package size={12} style={{ color: '#00f5ff' }} />
                            </div>
                            <span className="text-xs font-medium text-white">{config.poolTitle}</span>
                        </div>
                        <span className="text-[10px]" style={{ color: '#6b7280' }}>{assets.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8"><InlineLoading size={18} color="#00f5ff" /></div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                <NewAssetCard onClick={handleCreateAsset} />
                                {assets.map((asset) => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        isSelected={selectedAssetId === asset.id}
                                        onSelect={() => setSelectedAssetId(asset.id)}
                                        onDelete={() => handleDeleteClick(asset)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 右侧：资产编辑器 */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {selectedAsset ? (
                        <>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.15), rgba(255,0,255,0.15))', border: '1px solid rgba(191,0,255,0.3)' }}>
                                    <Wand2 size={14} style={{ color: '#bf00ff' }} />
                                </div>
                                <span className="text-sm font-medium text-white">{config.editorTitle}</span>
                            </div>
                            <div className="flex-1 flex gap-4 overflow-hidden">
                                {/* 左侧：资产设定输入 */}
                                <div className="w-[340px] flex-shrink-0 flex flex-col gap-3 rounded-xl p-4" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>资产名称</label>
                                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={config.namePlaceholder} className="h-9 text-sm" />
                                    </div>
                                    {/* 资产类型下拉选择框 */}
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>资产类型</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsAssetTypeDropdownOpen(!isAssetTypeDropdownOpen)}
                                                className="w-full h-9 px-3 rounded-lg flex items-center justify-between text-sm transition-all"
                                                style={{ backgroundColor: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {ASSET_TYPES.find(t => t.value === selectedAssetType)?.icon}
                                                    <span>{ASSET_TYPES.find(t => t.value === selectedAssetType)?.label}</span>
                                                </div>
                                                <ChevronDown size={14} />
                                            </button>
                                            {isAssetTypeDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsAssetTypeDropdownOpen(false)} />
                                                    <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(0,245,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                                                        {ASSET_TYPES.map((type) => (
                                                            <button
                                                                key={type.value}
                                                                onClick={() => { setSelectedAssetType(type.value); setIsAssetTypeDropdownOpen(false); }}
                                                                className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors"
                                                                style={{ color: selectedAssetType === type.value ? '#00f5ff' : '#d1d5db', backgroundColor: selectedAssetType === type.value ? 'rgba(0,245,255,0.1)' : 'transparent' }}
                                                            >
                                                                {type.icon}
                                                                <span>{type.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>资产设定</label>
                                        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder={config.descriptionPlaceholder} className="flex-1 min-h-0 resize-none text-sm" />
                                    </div>
                                    {/* 参考图上传区域 */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-medium" style={{ color: '#9ca3af' }}>参考图</label>
                                            <button
                                                onClick={() => !isUploadingRef && refImageInputRef.current?.click()}
                                                disabled={isUploadingRef}
                                                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all"
                                                style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff', opacity: isUploadingRef ? 0.5 : 1, cursor: isUploadingRef ? 'not-allowed' : 'pointer' }}
                                            >
                                                <ImagePlus size={14} />
                                                {isUploadingRef ? '上传中...' : '添加参考图'}
                                            </button>
                                            <input ref={refImageInputRef} type="file" accept="image/*" multiple onChange={handleUploadRefImage} className="hidden" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg min-h-[60px]" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(30,30,46,0.8)' }}>
                                            {(selectedAsset.referenceImageUrls || []).length === 0 ? (
                                                <div className="w-full flex items-center justify-center text-xs" style={{ color: '#4b5563' }}>
                                                    点击上方按钮上传参考图
                                                </div>
                                            ) : (
                                                (selectedAsset.referenceImageUrls || []).map((url, index) => (
                                                    <div key={index} className="relative group w-12 h-12 rounded overflow-hidden" style={{ border: '1px solid rgba(30,30,46,0.8)' }}>
                                                        <img src={url} alt={`参考图 ${index + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => handleDeleteRefImage(index)}
                                                            className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                            style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}
                                                        >
                                                            <X size={8} className="text-white" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={handleSave} disabled={isSaving} className="w-full h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:shadow-[0_0_12px_rgba(0,245,255,0.2)]" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,212,170,0.1))', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                                        {isSaving ? (<><InlineLoading size={16} color="#00f5ff" /><span className="ml-2">保存中...</span></>) : (<><Save size={16} className="mr-2" />{config.saveButtonText}</>)}
                                    </button>
                                </div>

                                {/* 右侧：设计稿展示区域 */}
                                <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                                    <div className="px-4 py-2.5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #1e1e2e' }}>
                                        <div className="flex items-center gap-2">
                                            <ImageIcon size={14} style={{ color: '#00f5ff' }} />
                                            <span className="text-sm font-medium text-white">{config.designTitle}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* 模型选择下拉框 */}
                                            <div className="relative">
                                                <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all" style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff', opacity: isProcessing ? 0.5 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                                                    <span>{IMAGE_MODELS.find(m => m.value === selectedModel)?.label}</span>
                                                    <ChevronDown size={12} />
                                                </button>
                                                {isModelDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                                                        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(0,245,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                                                            {IMAGE_MODELS.map((model) => (
                                                                <button key={model.value} onClick={() => { setSelectedModel(model.value); setIsModelDropdownOpen(false); }} className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap transition-colors" style={{ color: selectedModel === model.value ? '#00f5ff' : '#d1d5db', backgroundColor: selectedModel === model.value ? 'rgba(0,245,255,0.1)' : 'transparent' }}>
                                                                    {model.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            {/* 生成按钮 */}
                                            <button onClick={handleGenerateDesign} disabled={isProcessing || !editDescription.trim()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all" style={{ background: isProcessing || !editDescription.trim() ? 'rgba(191,0,255,0.1)' : 'linear-gradient(135deg, rgba(191,0,255,0.2), rgba(255,0,255,0.2))', border: '1px solid rgba(191,0,255,0.3)', color: '#bf00ff', opacity: isProcessing || !editDescription.trim() ? 0.5 : 1, cursor: isProcessing || !editDescription.trim() ? 'not-allowed' : 'pointer' }}>
                                                <Sparkles size={12} />
                                                生成（<img src={CoinIcon} alt="代币" className="w-4 h-4 inline" />消耗：{selectedModel === 'nano-banana-2' ? 4 : 2}）
                                            </button>
                                            {/* 上传按钮 */}
                                            <button onClick={() => !isProcessing && fileInputRef.current?.click()} disabled={isProcessing} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all" style={{ backgroundColor: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.3)', color: '#9ca3af', opacity: isProcessing ? 0.5 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                                                <Upload size={12} />上传
                                            </button>
                                            {/* 下载按钮 */}
                                            {hasDesignImage && !isProcessing ? (
                                                <a href={selectedAsset.designImageUrl} download={`asset-${selectedAsset.name}-${Date.now()}.png`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors" style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }}>
                                                    <Download size={12} />下载
                                                </a>
                                            ) : (
                                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', color: '#6b7280', opacity: 0.5 }}>
                                                    <Download size={12} />下载
                                                </span>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                                    </div>

                                    {/* 设计稿展示 */}
                                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
                                        {isProcessing && <Loading overlay size={28} color="#bf00ff" text={isUploading ? '正在上传...' : '正在生成设计稿...'} />}
                                        {selectedAsset.designImageUrl ? (
                                            <img src={selectedAsset.designImageUrl} alt="资产设计稿" className="max-w-full max-h-full object-contain rounded-lg" style={{ boxShadow: '0 0 30px rgba(0,245,255,0.1)' }} />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-center">
                                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(191,0,255,0.05))', border: '1px solid rgba(0,245,255,0.1)' }}>
                                                    <ImageIcon size={32} style={{ color: 'rgba(0,245,255,0.3)' }} />
                                                </div>
                                                <div>
                                                    <p className="text-sm" style={{ color: '#6b7280' }}>点击"生成"或"上传"添加资产设计稿</p>
                                                    <p className="text-xs mt-1" style={{ color: '#4b5563' }}>{config.generateHint}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-6">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}>
                                    <Package size={36} style={{ color: 'rgba(0,245,255,0.5)' }} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff00ff, #bf00ff)', boxShadow: '0 0 10px rgba(255,0,255,0.5)' }}>
                                    <Sparkles size={12} className="text-white" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{config.emptyTitle}</h3>
                            <p className="text-sm max-w-md mb-4" style={{ color: '#6b7280' }}>{config.emptyDescription}</p>
                            <Button onClick={handleCreateAsset} className="h-10 px-6" style={{ background: 'linear-gradient(135deg, #00f5ff, #00d4aa)' }}>
                                <Plus size={16} className="mr-2" />{config.newButtonText}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
