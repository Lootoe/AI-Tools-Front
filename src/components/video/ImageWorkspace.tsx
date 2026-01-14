import React, { useState, useEffect } from 'react';
import { Image, Sparkles } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { useAuthStore } from '@/stores/authStore';
import { useAssetStore } from '@/stores/assetStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { EpisodePanel } from './EpisodePanel';
import { ImageStoryboardGrid } from './ImageStoryboardGrid';
import { CyberImageViewer } from './CyberImageViewer';
import { ImageLeftPanel, ImageModel, getModelCost } from './ImageLeftPanel';
import { ImageVariantPool } from './ImageVariantPool';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { generateStoryboardImage } from '@/services/assetApi';
import { StoryboardImage } from '@/types/video';

interface ImageWorkspaceProps {
    scriptId: string;
    episodeId?: string;
    storyboardImageId?: string;
    onEpisodeChange: (episodeId: string | null) => void;
    onStoryboardImageChange: (storyboardImageId: string | null) => void;
}

export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({
    scriptId,
    episodeId: urlEpisodeId,
    storyboardImageId: urlStoryboardImageId,
    onEpisodeChange,
    onStoryboardImageChange,
}) => {
    const {
        scripts,
        addStoryboardImage,
        updateStoryboardImage,
        deleteStoryboardImage,
        clearStoryboardImages,
        reorderStoryboardImages,
        addImageVariant,
        updateImageVariant,
        deleteImageVariant,
        setActiveImageVariant,
        refreshImageVariant,
    } = useVideoStore();

    const { updateBalance } = useAuthStore();
    const { assets, loadAssets } = useAssetStore();
    const { showToast, ToastContainer } = useToast();
    const imagePrefs = usePreferencesStore((s) => s.storyboardImage);

    // 使用 URL 参数作为选中状态
    const selectedEpisodeId = urlEpisodeId || null;
    const selectedStoryboardImageId = urlStoryboardImageId || null;

    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [deleteConfirmStoryboardImageId, setDeleteConfirmStoryboardImageId] = useState<string | null>(null);
    const [deleteConfirmVariantId, setDeleteConfirmVariantId] = useState<string | null>(null);
    const [isDownloading, _setIsDownloading] = useState(false);
    const [localDescription, setLocalDescription] = useState('');
    const [localAspectRatio, setLocalAspectRatio] = useState<'16:9' | '1:1' | '4:3'>(imagePrefs.aspectRatio);
    const [localReferenceImageUrls, setLocalReferenceImageUrls] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<ImageModel>(imagePrefs.model as ImageModel);
    const [localPromptTemplateId, setLocalPromptTemplateId] = useState<string>(imagePrefs.promptTemplateId);

    const script = scripts.find((s) => s.id === scriptId);

    // 加载资产数据
    useEffect(() => {
        if (scriptId) {
            loadAssets(scriptId);
        }
    }, [scriptId, loadAssets]);

    // 初始化：如果 URL 没有 episodeId，自动导航到第一个剧集
    useEffect(() => {
        if (script && script.episodes.length > 0 && !urlEpisodeId) {
            onEpisodeChange(script.episodes[0].id);
        }
    }, [script?.id, script?.episodes.length, urlEpisodeId, onEpisodeChange]);

    const selectedEpisode = script?.episodes.find((e) => e.id === selectedEpisodeId);

    // 初始化：如果 URL 没有 storyboardImageId，自动导航到第一个分镜图
    useEffect(() => {
        const storyboardImages = selectedEpisode?.storyboardImages || [];
        if (storyboardImages.length > 0 && !urlStoryboardImageId) {
            onStoryboardImageChange(storyboardImages[0].id);
        }
    }, [selectedEpisode?.id, selectedEpisode?.storyboardImages?.length, urlStoryboardImageId, onStoryboardImageChange]);

    const storyboardImages = selectedEpisode?.storyboardImages || [];
    const selectedStoryboardImage = storyboardImages.find((sb) => sb.id === selectedStoryboardImageId);

    useEffect(() => {
        setLocalDescription(selectedStoryboardImage?.description || '');
        setLocalAspectRatio('16:9'); // 始终使用 16:9 作为默认值
        setLocalReferenceImageUrls(selectedStoryboardImage?.referenceImageUrls || []);
    }, [selectedStoryboardImage?.id, selectedStoryboardImage?.description, selectedStoryboardImage?.referenceImageUrls]);

    const hasUnsavedChanges =
        localDescription !== (selectedStoryboardImage?.description || '') ||
        localAspectRatio !== (selectedStoryboardImage?.aspectRatio || '9:16') ||
        JSON.stringify(localReferenceImageUrls) !== JSON.stringify(selectedStoryboardImage?.referenceImageUrls || []);

    useEffect(() => {
        if (!selectedEpisode || !script) return;
        const pendingVariants: { storyboardImageId: string; variantId: string }[] = [];
        (selectedEpisode.storyboardImages || []).forEach((storyboardImage) => {
            (storyboardImage.imageVariants || []).forEach((variant) => {
                if (variant.status === 'generating' || variant.status === 'queued') {
                    pendingVariants.push({ storyboardImageId: storyboardImage.id, variantId: variant.id });
                }
            });
        });
        if (pendingVariants.length === 0) return;
        const refreshInterval = setInterval(() => {
            pendingVariants.forEach(({ storyboardImageId, variantId }) => {
                refreshImageVariant(script.id, selectedEpisode.id, storyboardImageId, variantId);
            });
        }, 5000);
        return () => clearInterval(refreshInterval);
    }, [selectedEpisode, script, refreshImageVariant]);

    const handleAddStoryboardImage = async () => {
        if (!script || !selectedEpisode) return;
        try {
            const sceneNumber = storyboardImages.length + 1;
            const newId = await addStoryboardImage(script.id, selectedEpisode.id, { sceneNumber, description: `分镜图 ${sceneNumber}` });
            onStoryboardImageChange(newId);
        } catch (error) {
            showToast(error instanceof Error ? error.message : '添加分镜图失败', 'error');
        }
    };

    const handleDeleteStoryboardImage = (storyboardImageId: string) => {
        setDeleteConfirmStoryboardImageId(storyboardImageId);
    };

    const confirmDeleteStoryboardImage = async () => {
        if (!script || !selectedEpisode || !deleteConfirmStoryboardImageId) return;
        try {
            await deleteStoryboardImage(script.id, selectedEpisode.id, deleteConfirmStoryboardImageId);
            if (selectedStoryboardImageId === deleteConfirmStoryboardImageId) {
                const remainingImages = storyboardImages.filter(sb => sb.id !== deleteConfirmStoryboardImageId);
                onStoryboardImageChange(remainingImages[0]?.id || null);
            }
            showToast('分镜图已删除', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '删除分镜图失败', 'error');
        }
        setDeleteConfirmStoryboardImageId(null);
    };

    const handleGenerateImage = async (storyboardImageId: string) => {
        if (!script || !selectedEpisode) return;

        const storyboardImage = storyboardImages.find((sb) => sb.id === storyboardImageId);
        if (!storyboardImage || !storyboardImage.description) {
            showToast('请先填写分镜图脚本', 'warning');
            return;
        }

        const tokenCost = getModelCost(selectedModel);
        updateBalance((prev) => prev - tokenCost);

        try {
            const variantId = await addImageVariant(script.id, selectedEpisode.id, storyboardImageId);
            await updateImageVariant(script.id, selectedEpisode.id, storyboardImageId, variantId, { status: 'generating', progress: '0' });

            const response = await generateStoryboardImage(
                variantId,
                scriptId,
                storyboardImage.description,
                localPromptTemplateId,
                selectedModel,
                storyboardImage.referenceImageUrls || [],
                localAspectRatio
            );

            if (response.success && response.images?.[0]?.url) {
                await updateImageVariant(script.id, selectedEpisode.id, storyboardImageId, variantId, {
                    status: 'completed',
                    progress: '100',
                    imageUrl: response.images[0].url,
                    thumbnailUrl: response.images[0].url,
                });
                if (response.balance !== undefined) updateBalance(response.balance);
                showToast('图片生成成功', 'success');
            } else {
                throw new Error('生成失败');
            }
        } catch (error) {
            updateBalance((prev) => prev + tokenCost);
            console.error('分镜图生成失败:', error);
            showToast(error instanceof Error ? error.message : '图片生成失败，请重试', 'error');
            const updatedStoryboardImage = storyboardImages.find((sb) => sb.id === storyboardImageId);
            const latestVariant = (updatedStoryboardImage?.imageVariants || []).slice(-1)[0];
            if (latestVariant) {
                await updateImageVariant(script.id, selectedEpisode.id, storyboardImageId, latestVariant.id, { status: 'failed', progress: undefined });
            }
        }
    };

    const handleSelectVariant = async (variantId: string) => {
        if (!script || !selectedEpisode || !selectedStoryboardImageId) return;
        await setActiveImageVariant(script.id, selectedEpisode.id, selectedStoryboardImageId, variantId);
    };

    const handleDeleteVariant = (variantId: string) => {
        setDeleteConfirmVariantId(variantId);
    };

    const confirmDeleteVariant = async () => {
        if (!script || !selectedEpisode || !selectedStoryboardImageId || !deleteConfirmVariantId) return;
        try {
            await deleteImageVariant(script.id, selectedEpisode.id, selectedStoryboardImageId, deleteConfirmVariantId);
            showToast('素材已删除', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '删除素材失败', 'error');
        }
        setDeleteConfirmVariantId(null);
    };

    const handleSaveConfig = async () => {
        if (!script || !selectedEpisode || !selectedStoryboardImageId || !selectedStoryboardImage) return;
        try {
            const updates: Partial<StoryboardImage> = {};
            if (localDescription !== selectedStoryboardImage.description) updates.description = localDescription;
            if (localAspectRatio !== (selectedStoryboardImage.aspectRatio || '9:16')) updates.aspectRatio = localAspectRatio;
            if (JSON.stringify(localReferenceImageUrls) !== JSON.stringify(selectedStoryboardImage.referenceImageUrls || [])) {
                updates.referenceImageUrls = localReferenceImageUrls.length > 0 ? localReferenceImageUrls : undefined;
            }
            if (Object.keys(updates).length > 0) {
                await updateStoryboardImage(script.id, selectedEpisode.id, selectedStoryboardImageId, updates);
                showToast('配置已保存', 'success');
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : '保存配置失败', 'error');
        }
    };

    const handleClearStoryboardImages = () => {
        if (!script || !selectedEpisode) return;
        clearStoryboardImages(script.id, selectedEpisode.id);
        onStoryboardImageChange(null);
        setShowClearConfirm(false);
    };

    const handleReorderStoryboardImages = (fromIndex: number, toIndex: number) => {
        if (!script || !selectedEpisode) return;
        reorderStoryboardImages(script.id, selectedEpisode.id, fromIndex, toIndex);
    };

    const currentStoryboardImageIndex = storyboardImages.findIndex((sb) => sb.id === selectedStoryboardImageId) ?? -1;

    const handlePreviousStoryboardImage = () => {
        if (currentStoryboardImageIndex <= 0) return;
        onStoryboardImageChange(storyboardImages[currentStoryboardImageIndex - 1].id);
    };

    const handleNextStoryboardImage = () => {
        if (currentStoryboardImageIndex >= storyboardImages.length - 1) return;
        onStoryboardImageChange(storyboardImages[currentStoryboardImageIndex + 1].id);
    };

    const deleteStoryboardImageIndex = deleteConfirmStoryboardImageId && selectedEpisode
        ? storyboardImages.findIndex((sb) => sb.id === deleteConfirmStoryboardImageId) : -1;

    const activeVariant = selectedStoryboardImage?.imageVariants?.find((v) => v.id === selectedStoryboardImage.activeImageVariantId);
    const currentImageUrl = activeVariant?.imageUrl || selectedStoryboardImage?.imageUrl;
    const currentThumbnailUrl = activeVariant?.thumbnailUrl || selectedStoryboardImage?.thumbnailUrl;

    if (!selectedEpisode) {
        return (
            <div className="flex-1 flex">
                <EpisodePanel scriptId={scriptId} selectedEpisodeId={selectedEpisodeId} onSelectEpisode={onEpisodeChange} />
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}>
                            <Image size={36} style={{ color: 'rgba(0,245,255,0.5)' }} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #ff00ff, #bf00ff)', boxShadow: '0 0 10px rgba(255,0,255,0.5)' }}>
                            <Sparkles size={12} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">选择一个剧集</h3>
                    <p className="text-sm max-w-md" style={{ color: '#6b7280' }}>在左侧面板点击剧集，即可在此处编辑分镜图、生成图片</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 flex gap-3 overflow-hidden">
                <EpisodePanel scriptId={scriptId} selectedEpisodeId={selectedEpisodeId} onSelectEpisode={onEpisodeChange} />
                <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                    <div className="flex-[3] flex gap-3 min-h-0 overflow-hidden">
                        <ImageLeftPanel
                            storyboardImage={selectedStoryboardImage || null}
                            storyboardIndex={currentStoryboardImageIndex}
                            localDescription={localDescription}
                            onLocalDescriptionChange={setLocalDescription}
                            onSave={handleSaveConfig}
                            hasUnsavedChanges={hasUnsavedChanges}
                            localReferenceImageUrls={localReferenceImageUrls}
                            onReferenceImageUrlsChange={setLocalReferenceImageUrls}
                            assets={assets}
                        />
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <CyberImageViewer
                                imageUrl={currentImageUrl}
                                thumbnailUrl={currentThumbnailUrl}
                                title={selectedStoryboardImage ? `分镜图 #${currentStoryboardImageIndex + 1}` : undefined}
                                onPrevious={handlePreviousStoryboardImage}
                                onNext={handleNextStoryboardImage}
                                hasPrevious={currentStoryboardImageIndex > 0}
                                hasNext={currentStoryboardImageIndex < storyboardImages.length - 1}
                                scriptName={script?.title}
                                episodeNumber={selectedEpisode?.episodeNumber}
                                storyboardNumber={currentStoryboardImageIndex + 1}
                                promptTemplateId={localPromptTemplateId}
                                onPromptTemplateChange={setLocalPromptTemplateId}
                                aspectRatio={localAspectRatio}
                                onAspectRatioChange={setLocalAspectRatio}
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                                isProcessing={selectedStoryboardImage?.imageVariants?.some(v => v.status === 'generating' || v.status === 'queued') ?? false}
                            />
                        </div>
                        <ImageVariantPool
                            storyboardImage={selectedStoryboardImage || null}
                            onSelectVariant={handleSelectVariant}
                            onDeleteVariant={handleDeleteVariant}
                            onGenerate={() => selectedStoryboardImageId && handleGenerateImage(selectedStoryboardImageId)}
                            selectedModel={selectedModel}
                        />
                    </div>
                    <div className="flex-[1] min-h-[120px] max-h-[160px]">
                        <ImageStoryboardGrid
                            storyboardImages={storyboardImages}
                            selectedId={selectedStoryboardImageId}
                            onSelect={onStoryboardImageChange}
                            onAdd={handleAddStoryboardImage}
                            onDelete={handleDeleteStoryboardImage}
                            onReorder={handleReorderStoryboardImages}
                            onClearAll={() => setShowClearConfirm(true)}
                            isDownloading={isDownloading}
                        />
                    </div>
                </div>
            </div>
            <ConfirmDialog isOpen={!!deleteConfirmStoryboardImageId} title="确认删除" message={`确定要删除分镜图 #${deleteStoryboardImageIndex + 1} 吗？此操作不可撤销。`} type="danger" confirmText="确认删除" onConfirm={confirmDeleteStoryboardImage} onCancel={() => setDeleteConfirmStoryboardImageId(null)} />
            <ConfirmDialog isOpen={!!deleteConfirmVariantId} title="确认删除" message="删除后无法恢复，确定要删除吗？" type="warning" confirmText="确认删除" onConfirm={confirmDeleteVariant} onCancel={() => setDeleteConfirmVariantId(null)} />
            <ConfirmDialog isOpen={showClearConfirm} title="确认清空" message="确定要清空当前剧集的所有分镜图吗？此操作不可撤销。" type="danger" confirmText="确认清空" onConfirm={handleClearStoryboardImages} onCancel={() => setShowClearConfirm(false)} />
            <ToastContainer />
        </>
    );
};
