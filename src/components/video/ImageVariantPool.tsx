import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, Image, Layers, AlertCircle } from 'lucide-react';
import { StoryboardImage, ImageVariant } from '@/types/video';
import { ImageModel, getModelCost } from './ImageLeftPanel';
import CoinIcon from '@/img/coin.webp';

interface ImageVariantPoolProps {
    storyboardImage: StoryboardImage | null;
    onSelectVariant: (variantId: string) => void;
    onDeleteVariant: (variantId: string) => void;
    onGenerate: () => void;
    selectedModel: ImageModel;
}

export const ImageVariantPool: React.FC<ImageVariantPoolProps> = ({
    storyboardImage,
    onSelectVariant,
    onDeleteVariant,
    onGenerate,
    selectedModel,
}) => {
    const [isGenerateCooldown, setIsGenerateCooldown] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    useEffect(() => {
        if (!isGenerateCooldown) return;
        const timer = setInterval(() => {
            setCooldownSeconds((prev) => {
                if (prev <= 1) { setIsGenerateCooldown(false); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isGenerateCooldown]);

    const handleGenerate = useCallback(() => {
        if (isGenerateCooldown) return;
        onGenerate();
        setIsGenerateCooldown(true);
        setCooldownSeconds(2);
    }, [isGenerateCooldown, onGenerate]);

    const tokenCost = getModelCost(selectedModel);

    if (!storyboardImage) {
        return (
            <div className="w-72 flex-shrink-0 rounded-xl flex flex-col items-center justify-center p-6"
                style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}>
                    <Layers size={24} style={{ color: 'rgba(0,245,255,0.4)' }} />
                </div>
                <p className="text-xs text-center" style={{ color: '#6b7280' }}>选择分镜图查看参考图素材</p>
            </div>
        );
    }

    const variants = storyboardImage.imageVariants || [];
    const activeVariantId = storyboardImage.activeImageVariantId;
    const hasDescription = !!storyboardImage.description?.trim();

    return (
        <div className="w-72 flex-shrink-0 rounded-xl flex flex-col overflow-hidden"
            style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #1e1e2e' }}>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
                        <Layers size={12} style={{ color: '#8b5cf6' }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>分镜图池</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>{variants.length}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 cyber-scrollbar">
                {variants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Layers size={32} style={{ color: '#4b5563' }} className="mb-3" />
                        <p className="text-xs" style={{ color: '#6b7280' }}>暂无分镜图素材</p>
                        <p className="text-[10px] mt-1" style={{ color: '#4b5563' }}>点击下方按钮生成</p>
                    </div>
                ) : (
                    variants.map((variant, index) => (
                        <ImageVariantCard key={variant.id} variant={variant} index={index} isActive={variant.id === activeVariantId}
                            onSelect={() => onSelectVariant(variant.id)} onDelete={() => onDeleteVariant(variant.id)} />
                    ))
                )}
            </div>
            <div className="p-3" style={{ borderTop: '1px solid #1e1e2e' }}>
                <button onClick={handleGenerate} disabled={!hasDescription || isGenerateCooldown}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${hasDescription && !isGenerateCooldown ? 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]' : ''}`}
                    style={{ background: hasDescription && !isGenerateCooldown ? 'linear-gradient(135deg, #00f5ff, #00d4ff)' : 'rgba(0,245,255,0.1)', color: hasDescription && !isGenerateCooldown ? '#0a0a0f' : '#6b7280', boxShadow: hasDescription && !isGenerateCooldown ? '0 4px 15px rgba(0,245,255,0.3)' : 'none' }}>
                    <Plus size={14} />
                    {isGenerateCooldown ? `请等待 ${cooldownSeconds}s` : <>生成分镜（<img src={CoinIcon} alt="代币" className="w-4 h-4 inline" />消耗：{tokenCost}）</>}
                </button>
                {!hasDescription && <p className="text-[10px] text-center mt-2" style={{ color: '#ef4444' }}>请先填写分镜图脚本</p>}
            </div>
        </div>
    );
};

interface ImageVariantCardProps {
    variant: ImageVariant;
    index: number;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

// 格式化时间显示
const formatTime = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const ImageVariantCard: React.FC<ImageVariantCardProps> = ({ variant, index, isActive, onSelect, onDelete }) => {
    const isGenerating = variant.status === 'generating' || variant.status === 'queued';
    const isCompleted = variant.status === 'completed';
    const isFailed = variant.status === 'failed';

    return (
        <div className="relative rounded-lg overflow-hidden cursor-pointer transition-all group"
            style={{ backgroundColor: isActive ? 'rgba(139,92,246,0.15)' : '#12121a', border: isActive ? '1px solid rgba(139,92,246,0.5)' : '1px solid #1e1e2e' }}
            onClick={onSelect}>
            <div className="flex items-center gap-2 p-2">
                <div className="w-16 h-10 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e1e2e' }}>
                    {variant.imageUrl || variant.thumbnailUrl ? (
                        <img src={variant.thumbnailUrl || variant.imageUrl} alt={`素材 ${index + 1}`} className="w-full h-full object-cover" />
                    ) : isGenerating ? (
                        <Loader2 size={14} className="animate-spin" style={{ color: '#8b5cf6' }} />
                    ) : isFailed ? (
                        <AlertCircle size={14} style={{ color: '#ef4444' }} />
                    ) : (
                        <Image size={14} style={{ color: '#4b5563' }} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>素材 {index + 1}</span>
                        {isActive && <span className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,245,255,0.15)', color: '#00f5ff' }}>当前</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        {isGenerating && <span className="text-[10px]" style={{ color: '#8b5cf6' }}>生成中...</span>}
                        {isCompleted && <span className="text-[10px]" style={{ color: '#10b981' }}>已完成</span>}
                        {isFailed && <span className="text-[10px]" style={{ color: '#ef4444' }}>生成失败</span>}
                        {variant.status === 'pending' && <span className="text-[10px]" style={{ color: '#6b7280' }}>待生成</span>}
                    </div>
                    {/* 失败原因 */}
                    {isFailed && variant.failReason && (
                        <div className="text-[9px] mt-0.5 truncate max-w-[140px]" style={{ color: '#ef4444' }} title={variant.failReason}>
                            原因: {variant.failReason}
                        </div>
                    )}
                    {/* 时间信息 */}
                    {variant.startedAt && (
                        <div className="text-[9px] mt-0.5" style={{ color: '#6b7280' }}>
                            开始: {formatTime(variant.startedAt)}
                        </div>
                    )}
                    {variant.finishedAt && (
                        <div className="text-[9px]" style={{ color: isCompleted ? '#10b981' : '#ef4444' }}>
                            {isCompleted ? '完成' : '失败'}: {formatTime(variant.finishedAt)}
                        </div>
                    )}
                    {variant.taskId && <div className="text-[9px] mt-0.5 truncate max-w-[140px]" style={{ color: '#4b5563' }} title={variant.taskId}>ID: {variant.taskId}</div>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-red-500/20" style={{ color: '#6b7280' }}><Trash2 size={12} /></button>
                </div>
            </div>
            {isGenerating && <div className="h-0.5" style={{ backgroundColor: 'rgba(139,92,246,0.3)' }}><div className="h-full animate-pulse" style={{ width: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} /></div>}
        </div>
    );
};
