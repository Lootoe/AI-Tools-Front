import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, ZoomIn, Image, X, ChevronDown, Sparkles } from 'lucide-react';
import { ImageModel, IMAGE_MODELS } from './ImageLeftPanel';
import { getPromptTemplates, PromptTemplateConfig } from '@/services/api';

interface CyberImageViewerProps {
    imageUrl?: string;
    thumbnailUrl?: string;
    title?: string;
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
    scriptName?: string;
    episodeNumber?: number;
    storyboardNumber?: number;
    aspectRatio: '16:9' | '1:1' | '4:3';
    onAspectRatioChange: (ratio: '16:9' | '1:1' | '4:3') => void;
    selectedModel: ImageModel;
    onModelChange: (model: ImageModel) => void;
    // 提示词模板
    promptTemplateId?: string;
    onPromptTemplateChange?: (templateId: string) => void;
    isProcessing?: boolean;
}

export const CyberImageViewer: React.FC<CyberImageViewerProps> = ({
    imageUrl,
    thumbnailUrl,
    title,
    onPrevious,
    onNext,
    hasPrevious,
    hasNext,
    scriptName,
    episodeNumber,
    storyboardNumber,
    aspectRatio,
    onAspectRatioChange,
    selectedModel,
    onModelChange,
    promptTemplateId = 'image-9grid',
    onPromptTemplateChange,
    isProcessing = false,
}) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [promptTemplates, setPromptTemplates] = useState<PromptTemplateConfig[]>([]);
    const displayUrl = imageUrl || thumbnailUrl;

    // 加载提示词模板列表
    useEffect(() => {
        getPromptTemplates('storyboardImage')
            .then((res) => { if (res.success) setPromptTemplates(res.data); })
            .catch(() => { });
    }, []);

    const handleDownload = () => {
        if (!displayUrl) return;
        const link = document.createElement('a');
        link.href = displayUrl;
        const filename = scriptName && episodeNumber && storyboardNumber
            ? `${scriptName}_E${episodeNumber}_S${storyboardNumber}.png`
            : 'storyboard_image.png';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const ratioOptions = [
        { value: '16:9', label: '16:9 横版' },
        { value: '1:1', label: '1:1 方形' },
        { value: '4:3', label: '4:3 标准' },
    ] as const;

    return (
        <>
            {/* 提示词模板选择弹框 */}
            {isTemplateDropdownOpen && onPromptTemplateChange && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsTemplateDropdownOpen(false)}>
                    <div className="w-[600px] rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 40px rgba(139,92,246,0.2)' }} onClick={(e) => e.stopPropagation()}>
                        {/* 弹框头部 */}
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
                                    <Sparkles size={14} style={{ color: '#8b5cf6' }} />
                                </div>
                                <span className="text-sm font-medium text-white">选择提示词模板</span>
                            </div>
                            <button onClick={() => setIsTemplateDropdownOpen(false)} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                                <X size={16} style={{ color: '#6b7280' }} />
                            </button>
                        </div>
                        {/* 模板列表 */}
                        <div className="p-3 max-h-[500px] overflow-y-auto">
                            <div className="grid gap-2">
                                {promptTemplates.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => { onPromptTemplateChange(t.id); setIsTemplateDropdownOpen(false); }}
                                        className="w-full px-3 py-2.5 rounded-lg text-left transition-all hover:brightness-110"
                                        style={{
                                            backgroundColor: promptTemplateId === t.id ? 'rgba(139,92,246,0.1)' : 'rgba(0,0,0,0.2)',
                                            border: promptTemplateId === t.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(30,30,46,0.6)',
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: promptTemplateId === t.id ? '#8b5cf6' : '#4b5563' }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium" style={{ color: promptTemplateId === t.id ? '#8b5cf6' : '#e5e7eb' }}>{t.label}</div>
                                                {t.description && <div className="text-[10px] mt-0.5 truncate" style={{ color: '#6b7280' }}>{t.description}</div>}
                                            </div>
                                            {promptTemplateId === t.id && (
                                                <div className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#8b5cf6' }}>当前</div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative flex flex-col h-full rounded-xl overflow-hidden"
                style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e1e2e', boxShadow: '0 0 30px rgba(0,245,255,0.1), inset 0 0 60px rgba(0,0,0,0.5)' }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}>

                {/* 顶部工具栏 */}
                <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
                    style={{ borderBottom: '1px solid #1e1e2e', background: 'linear-gradient(90deg, rgba(0,245,255,0.05), transparent, rgba(191,0,255,0.05))' }}>
                    <span className="text-xs font-medium" style={{ color: '#00f5ff' }}>{title || '分镜图预览'}</span>

                    <div className="flex items-center gap-2">
                        {/* 提示词模板选择按钮 */}
                        {onPromptTemplateChange && (
                            <button onClick={() => !isProcessing && setIsTemplateDropdownOpen(true)}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                                style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6', opacity: isProcessing ? 0.5 : 1 }}>
                                <span className="max-w-[80px] truncate">{promptTemplates.find(t => t.id === promptTemplateId)?.label || '选择模板'}</span>
                                <ChevronDown size={12} />
                            </button>
                        )}

                        {/* 比例选择 */}
                        <div className="relative">
                            <button onClick={() => !isProcessing && setIsRatioDropdownOpen(!isRatioDropdownOpen)}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                                style={{ backgroundColor: 'rgba(191,0,255,0.1)', border: '1px solid rgba(191,0,255,0.2)', color: '#bf00ff', opacity: isProcessing ? 0.5 : 1 }}>
                                <span>{aspectRatio}</span>
                                <ChevronDown size={12} />
                            </button>
                            {isRatioDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsRatioDropdownOpen(false)} />
                                    <div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden min-w-[100px]"
                                        style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(191,0,255,0.2)' }}>
                                        {ratioOptions.map((r) => (
                                            <button key={r.value} onClick={() => { onAspectRatioChange(r.value); setIsRatioDropdownOpen(false); }}
                                                className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap"
                                                style={{ color: aspectRatio === r.value ? '#bf00ff' : '#d1d5db', backgroundColor: aspectRatio === r.value ? 'rgba(191,0,255,0.1)' : 'transparent' }}>
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 模型选择 */}
                        <div className="relative">
                            <button onClick={() => !isProcessing && setIsModelDropdownOpen(!isModelDropdownOpen)}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                                style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff', opacity: isProcessing ? 0.5 : 1 }}>
                                <span>{IMAGE_MODELS.find(m => m.value === selectedModel)?.label}</span>
                                <ChevronDown size={12} />
                            </button>
                            {isModelDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                                    <div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden"
                                        style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(0,245,255,0.2)' }}>
                                        {IMAGE_MODELS.map((m) => (
                                            <button key={m.value} onClick={() => { onModelChange(m.value); setIsModelDropdownOpen(false); }}
                                                className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap"
                                                style={{ color: selectedModel === m.value ? '#00f5ff' : '#d1d5db', backgroundColor: selectedModel === m.value ? 'rgba(0,245,255,0.1)' : 'transparent' }}>
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>


                    </div>
                </div>

                {/* 图片显示区域 */}
                <div className="relative flex-1 bg-black flex items-center justify-center p-4 min-h-0 overflow-hidden">
                    {displayUrl ? (
                        <img src={displayUrl} alt={title || '分镜图'}
                            className="max-w-full max-h-full object-contain rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                            onClick={() => setShowFullscreen(true)} />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                                style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.3)' }}>
                                <Image size={32} style={{ color: 'rgba(0,245,255,0.5)' }} />
                            </div>
                            <p className="text-sm" style={{ color: '#6b7280' }}>选择分镜预览图片</p>
                        </div>
                    )}

                    {/* 左右切换按钮 */}
                    {(hasPrevious || hasNext) && isHovering && (
                        <>
                            {hasPrevious && (
                                <button onClick={onPrevious}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all"
                                    style={{ backgroundColor: 'rgba(10,10,15,0.8)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }}>
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            {hasNext && (
                                <button onClick={onNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all"
                                    style={{ backgroundColor: 'rgba(10,10,15,0.8)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }}>
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* 底部控制栏 */}
                {displayUrl && (
                    <div className="flex items-center justify-end px-3 py-2"
                        style={{ backgroundColor: 'rgba(10,10,15,0.9)' }}>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowFullscreen(true)}
                                className="p-1.5 rounded transition-colors"
                                style={{ color: '#6b7280' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#00f5ff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                title="放大查看">
                                <ZoomIn size={14} />
                            </button>
                            <button onClick={handleDownload}
                                className="p-1.5 rounded transition-colors"
                                style={{ color: '#6b7280' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#00f5ff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                title="下载图片">
                                <Download size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 底部霓虹边框 */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px]"
                    style={{ background: 'linear-gradient(90deg, transparent, #bf00ff, #00f5ff, #bf00ff, transparent)', opacity: 0.5 }} />
            </div>

            {/* 全屏预览 */}
            {showFullscreen && displayUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
                    onClick={() => setShowFullscreen(false)}>
                    <button onClick={() => setShowFullscreen(false)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                        style={{ color: '#fff' }}>
                        <X size={24} />
                    </button>
                    <img src={displayUrl} alt={title || '分镜图'}
                        className={`max-w-[90vw] max-h-[90vh] object-contain transition-transform ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                        onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }} />
                </div>
            )}
        </>
    );
};
