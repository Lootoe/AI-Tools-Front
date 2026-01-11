import React, { useState } from 'react';
import { FileText, Save, Image } from 'lucide-react';
import { StoryboardImage } from '@/types/video';
import { ReferenceImageUploader } from '@/components/ui/ReferenceImageUploader';
import { useToast } from '@/components/ui/Toast';

// 图片生成模型配置
export const IMAGE_MODELS = [
    { value: 'nano-banana-2', label: 'Nano Banana 2', cost: 4 },
    { value: 'doubao-seedream-3-0-t2i-250415', label: '豆包', cost: 2 },
] as const;
export type ImageModel = typeof IMAGE_MODELS[number]['value'];

// 获取模型代币消耗
export function getModelCost(model: ImageModel): number {
    return IMAGE_MODELS.find(m => m.value === model)?.cost || 2;
}

interface ImageLeftPanelProps {
    storyboardImage: StoryboardImage | null;
    storyboardIndex: number;
    localDescription: string;
    onLocalDescriptionChange: (value: string) => void;
    onSave?: () => void;
    hasUnsavedChanges?: boolean;
    localReferenceImageUrls: string[];
    onReferenceImageUrlsChange: (urls: string[]) => void;
}

type TabType = 'script' | 'referenceImages';

export const ImageLeftPanel: React.FC<ImageLeftPanelProps> = ({
    storyboardImage,
    storyboardIndex,
    localDescription,
    onLocalDescriptionChange,
    onSave,
    hasUnsavedChanges,
    localReferenceImageUrls,
    onReferenceImageUrlsChange,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('script');
    const [isFocused, setIsFocused] = useState(false);
    const { showToast, ToastContainer } = useToast();

    if (!storyboardImage) {
        return (
            <div className="w-72 flex-shrink-0 rounded-xl flex flex-col items-center justify-center p-6"
                style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}>
                    <FileText size={24} style={{ color: 'rgba(0,245,255,0.4)' }} />
                </div>
                <p className="text-xs text-center" style={{ color: '#6b7280' }}>选择分镜图查看配置</p>
            </div>
        );
    }

    const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
        { key: 'script', label: '脚本', icon: <FileText size={12} /> },
        { key: 'referenceImages', label: '参考图', icon: <Image size={12} /> },
    ];

    return (
        <>
            <ToastContainer />
            <div className="w-72 flex-shrink-0 rounded-xl flex flex-col overflow-hidden"
                style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,0,255,0.15))', border: '1px solid rgba(0,245,255,0.3)' }}>
                            <span className="text-[10px] font-bold" style={{ color: '#00f5ff' }}>{storyboardIndex + 1}</span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>分镜图配置</span>
                    </div>
                </div>
                <div className="flex items-center" style={{ borderBottom: '1px solid #1e1e2e' }}>
                    {tabs.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-all"
                            style={{ color: activeTab === tab.key ? '#00f5ff' : '#6b7280', backgroundColor: activeTab === tab.key ? 'rgba(0,245,255,0.1)' : 'transparent', borderBottom: activeTab === tab.key ? '2px solid #00f5ff' : '2px solid transparent' }}>
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'script' && (
                        <div className="h-full flex flex-col p-3">
                            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                                <FileText size={12} style={{ color: '#00f5ff' }} />
                                <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>提示词脚本</span>
                            </div>
                            <textarea value={localDescription} onChange={(e) => onLocalDescriptionChange(e.target.value)}
                                onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                                placeholder="输入分镜图提示词..."
                                className="flex-1 w-full rounded-lg p-2.5 text-xs leading-relaxed resize-none focus:outline-none transition-all scrollbar-hide"
                                style={{ backgroundColor: '#0a0a0f', border: isFocused ? '1px solid rgba(0,245,255,0.5)' : '1px solid #1e1e2e', color: '#d1d5db', boxShadow: isFocused ? '0 0 15px rgba(0,245,255,0.1)' : 'none' }} />
                        </div>
                    )}
                    {activeTab === 'referenceImages' && (
                        <div className="h-full flex flex-col p-3 overflow-y-auto">
                            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                                <Image size={12} style={{ color: '#00f5ff' }} />
                                <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>参考图（最多5张）</span>
                            </div>
                            <p className="text-[10px] mb-3" style={{ color: '#6b7280' }}>上传参考图，生成的图片将参考这些图片的风格</p>
                            <ReferenceImageUploader
                                images={localReferenceImageUrls}
                                onChange={onReferenceImageUrlsChange}
                                maxCount={5}
                                maxSizeMB={2}
                                imageSize="lg"
                                gridClassName="grid grid-cols-2 gap-2"
                                hint="单张不超过2MB"
                                onError={(msg) => showToast(msg, 'error')}
                            />
                        </div>
                    )}
                </div>
                {onSave && (
                    <div className="p-3" style={{ borderTop: '1px solid #1e1e2e' }}>
                        <button onClick={onSave} disabled={!hasUnsavedChanges}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${hasUnsavedChanges ? 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]' : ''}`}
                            style={{ background: hasUnsavedChanges ? 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,212,255,0.2))' : 'rgba(0,245,255,0.05)', color: hasUnsavedChanges ? '#00f5ff' : '#6b7280', border: hasUnsavedChanges ? '1px solid rgba(0,245,255,0.4)' : '1px solid rgba(0,245,255,0.1)', boxShadow: hasUnsavedChanges ? '0 4px 15px rgba(0,245,255,0.15)' : 'none' }}>
                            <Save size={14} />保存配置
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
