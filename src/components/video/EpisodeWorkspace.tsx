import React, { useState, useEffect } from 'react';
import { Film, Sparkles } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { EpisodePanel } from './EpisodePanel';
import { StoryboardGrid } from './StoryboardGrid';
import { CyberVideoPlayer } from './CyberVideoPlayer';
import { StoryboardLeftPanel } from './StoryboardLeftPanel';
import { StoryboardVariantPool } from './StoryboardVariantPool';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { generateStoryboardVideo, remixVideo } from '@/services/api';
import { downloadEpisodeVideos } from '@/utils/downloadVideos';
import { Storyboard } from '@/types/video';

interface EpisodeWorkspaceProps {
  scriptId: string;
  episodeId?: string;
  storyboardId?: string;
  onEpisodeChange: (episodeId: string | null) => void;
  onStoryboardChange: (storyboardId: string | null) => void;
}

export const EpisodeWorkspace: React.FC<EpisodeWorkspaceProps> = ({
  scriptId,
  episodeId: urlEpisodeId,
  storyboardId: urlStoryboardId,
  onEpisodeChange,
  onStoryboardChange,
}) => {
  const {
    scripts,
    addStoryboard,
    updateStoryboard,
    deleteStoryboard,
    clearStoryboards,
    reorderStoryboards,
    addVariant,
    updateVariant,
    deleteVariant,
    setActiveVariant,
    refreshVariant,
  } = useVideoStore();

  const { updateBalance } = useAuthStore();
  const { showToast, ToastContainer } = useToast();
  const videoPrefs = usePreferencesStore((s) => s.video);

  // 使用 URL 参数作为选中状态
  const selectedEpisodeId = urlEpisodeId || null;
  const selectedStoryboardId = urlStoryboardId || null;

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmStoryboardId, setDeleteConfirmStoryboardId] = useState<string | null>(null);
  const [deleteConfirmVariantId, setDeleteConfirmVariantId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localDescription, setLocalDescription] = useState('');
  // API设置（使用偏好设置作为默认值）
  const [localAspectRatio, setLocalAspectRatio] = useState<'9:16' | '16:9'>(videoPrefs.aspectRatio);
  const [localDuration, setLocalDuration] = useState<'10' | '15'>(videoPrefs.duration);
  // 参考图状态
  const [localReferenceImageUrl, setLocalReferenceImageUrl] = useState<string>('');

  const script = scripts.find((s) => s.id === scriptId);

  // 初始化：如果 URL 没有 episodeId，自动导航到第一个剧集
  useEffect(() => {
    if (script && script.episodes.length > 0 && !urlEpisodeId) {
      const firstEpisode = script.episodes[0];
      onEpisodeChange(firstEpisode.id);
    }
  }, [script?.id, script?.episodes.length, urlEpisodeId, onEpisodeChange]);

  const selectedEpisode = script?.episodes.find((e) => e.id === selectedEpisodeId);

  // 初始化：如果 URL 没有 storyboardId，自动导航到第一个分镜
  useEffect(() => {
    if (selectedEpisode && selectedEpisode.storyboards.length > 0 && !urlStoryboardId) {
      onStoryboardChange(selectedEpisode.storyboards[0].id);
    }
  }, [selectedEpisode?.id, selectedEpisode?.storyboards.length, urlStoryboardId, onStoryboardChange]);

  const selectedStoryboard = selectedEpisode?.storyboards.find(
    (sb) => sb.id === selectedStoryboardId
  );

  // 当选中的分镜变化时，同步本地状态（不包括API设置）
  useEffect(() => {
    setLocalDescription(selectedStoryboard?.description || '');
    setLocalReferenceImageUrl(selectedStoryboard?.referenceImageUrl || '');
  }, [selectedStoryboard?.id, selectedStoryboard?.description, selectedStoryboard?.referenceImageUrl]);

  // 计算是否有未保存的更改（不包括API设置）
  const hasUnsavedChanges =
    localDescription !== (selectedStoryboard?.description || '') ||
    localReferenceImageUrl !== (selectedStoryboard?.referenceImageUrl || '');

  // 定时刷新正在生成的 variant（后端独立轮询更新数据库，前端只需定时拉取最新数据）
  useEffect(() => {
    if (!selectedEpisode || !script) return;

    // 收集所有正在生成的 variant 信息
    const pendingVariants: { storyboardId: string; variantId: string }[] = [];
    selectedEpisode.storyboards.forEach((storyboard) => {
      (storyboard.variants || []).forEach((variant) => {
        if (variant.status === 'generating' || variant.status === 'queued') {
          pendingVariants.push({ storyboardId: storyboard.id, variantId: variant.id });
        }
      });
    });

    if (pendingVariants.length === 0) return;

    // 定时刷新每个正在生成的 variant
    const refreshInterval = setInterval(() => {
      pendingVariants.forEach(({ storyboardId, variantId }) => {
        refreshVariant(script.id, selectedEpisode.id, storyboardId, variantId);
      });
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [selectedEpisode, script, refreshVariant]);

  // 分镜操作
  const handleAddStoryboard = async () => {
    if (!script || !selectedEpisode) return;
    try {
      const sceneNumber = selectedEpisode.storyboards.length + 1;
      const newId = await addStoryboard(script.id, selectedEpisode.id, {
        sceneNumber,
        description: `分镜 ${sceneNumber}`,
      });
      onStoryboardChange(newId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '添加分镜失败', 'error');
    }
  };

  const handleDeleteStoryboard = (storyboardId: string) => {
    setDeleteConfirmStoryboardId(storyboardId);
  };

  const confirmDeleteStoryboard = async () => {
    if (!script || !selectedEpisode || !deleteConfirmStoryboardId) return;
    try {
      await deleteStoryboard(script.id, selectedEpisode.id, deleteConfirmStoryboardId);
      if (selectedStoryboardId === deleteConfirmStoryboardId) {
        // 删除当前选中的分镜后，选择第一个分镜
        const remainingStoryboards = selectedEpisode.storyboards.filter(sb => sb.id !== deleteConfirmStoryboardId);
        onStoryboardChange(remainingStoryboards[0]?.id || null);
      }
      showToast('分镜已删除', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除分镜失败', 'error');
    }
    setDeleteConfirmStoryboardId(null);
  };

  const handleGenerateVideo = async (storyboardId: string) => {
    if (!script || !selectedEpisode) return;
    const storyboard = selectedEpisode.storyboards.find((sb) => sb.id === storyboardId);
    if (!storyboard || !storyboard.description) {
      showToast('请先填写分镜脚本', 'warning');
      return;
    }

    // 乐观更新：立即扣除前端显示的代币
    const tokenCost = 3;
    updateBalance((prev) => prev - tokenCost);

    try {
      // 创建新的分镜素材
      const variantId = await addVariant(script.id, selectedEpisode.id, storyboardId);

      // 乐观更新：立即在前端显示生成中状态
      await updateVariant(script.id, selectedEpisode.id, storyboardId, variantId, {
        status: 'generating',
        progress: '0',
      });

      const finalPrompt = storyboard.description;

      // 调用后端 API 生成视频（使用本地的API设置）
      const response = await generateStoryboardVideo({
        prompt: finalPrompt,
        aspect_ratio: localAspectRatio,
        duration: localDuration,
        referenceImageUrls: storyboard.referenceImageUrls,
        referenceImageUrl: localReferenceImageUrl || undefined,
        variantId,
      });
      const taskId = response.data.task_id || (response.data as { id?: string }).id;
      if (response.success && taskId) {
        // 同步后端返回的真实余额
        if (response.balance !== undefined) {
          updateBalance(response.balance);
        }
        // 刷新 variant 获取最新状态（包括 taskId）
        await refreshVariant(script.id, selectedEpisode.id, storyboardId, variantId);
      } else {
        throw new Error('未获取到任务ID');
      }
    } catch (error) {
      // 失败时恢复余额
      updateBalance((prev) => prev + tokenCost);
      console.error('分镜视频生成失败:', error);
      showToast(error instanceof Error ? error.message : '视频生成失败，请重试', 'error');
      // 如果失败，需要找到刚创建的素材并更新状态
      const updatedStoryboard = selectedEpisode.storyboards.find((sb) => sb.id === storyboardId);
      const latestVariant = (updatedStoryboard?.variants || []).slice(-1)[0];
      if (latestVariant) {
        await updateVariant(script.id, selectedEpisode.id, storyboardId, latestVariant.id, {
          status: 'failed',
          progress: undefined,
        });
      }
    }
  };

  // 分镜素材操作
  const handleSelectVariant = async (variantId: string) => {
    if (!script || !selectedEpisode || !selectedStoryboardId) return;
    await setActiveVariant(script.id, selectedEpisode.id, selectedStoryboardId, variantId);
  };

  const handleDeleteVariant = (variantId: string) => {
    setDeleteConfirmVariantId(variantId);
  };

  const confirmDeleteVariant = async () => {
    if (!script || !selectedEpisode || !selectedStoryboardId || !deleteConfirmVariantId) return;
    try {
      await deleteVariant(script.id, selectedEpisode.id, selectedStoryboardId, deleteConfirmVariantId);
      showToast('素材已删除', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除素材失败', 'error');
    }
    setDeleteConfirmVariantId(null);
  };

  // 处理 Remix 编辑视频
  const handleRemixVariant = async (_sourceVariantId: string, taskId: string, prompt: string) => {
    if (!script || !selectedEpisode || !selectedStoryboardId) return;

    // 乐观更新：立即扣除前端显示的代币
    const tokenCost = 3;
    updateBalance((prev) => prev - tokenCost);

    try {
      // 创建新的分镜素材
      const newVariantId = await addVariant(script.id, selectedEpisode.id, selectedStoryboardId);

      // 乐观更新：立即在前端显示生成中状态
      await updateVariant(script.id, selectedEpisode.id, selectedStoryboardId, newVariantId, {
        status: 'generating',
        progress: '0',
      });

      // 调用后端 Remix API
      const response = await remixVideo(taskId, {
        prompt,
        variantId: newVariantId,
      });

      const newTaskId = response.data.task_id || (response.data as { id?: string }).id;
      if (response.success && newTaskId) {
        // 同步后端返回的真实余额
        if (response.balance !== undefined) {
          updateBalance(response.balance);
        }
        // 刷新 variant 获取最新状态
        await refreshVariant(script.id, selectedEpisode.id, selectedStoryboardId, newVariantId);
        showToast('编辑已提交，正在生成新素材', 'success');
      } else {
        throw new Error('未获取到任务ID');
      }
    } catch (error) {
      // 失败时恢复余额
      updateBalance((prev) => prev + tokenCost);
      console.error('视频编辑失败:', error);
      showToast(error instanceof Error ? error.message : '视频编辑失败，请重试', 'error');
      // 如果失败，需要找到刚创建的素材并更新状态
      const updatedStoryboard = selectedEpisode.storyboards.find((sb) => sb.id === selectedStoryboardId);
      const latestVariant = (updatedStoryboard?.variants || []).slice(-1)[0];
      if (latestVariant) {
        await updateVariant(script.id, selectedEpisode.id, selectedStoryboardId, latestVariant.id, {
          status: 'failed',
          progress: undefined,
        });
      }
    }
  };

  // 保存所有配置（不包括API设置）
  const handleSaveConfig = async () => {
    if (!script || !selectedEpisode || !selectedStoryboardId || !selectedStoryboard) return;

    try {
      // 构建更新数据（不包括aspectRatio和duration）
      const updates: Partial<Storyboard> = {};

      if (localDescription !== selectedStoryboard.description) {
        updates.description = localDescription;
      }
      if (localReferenceImageUrl !== (selectedStoryboard.referenceImageUrl || '')) {
        updates.referenceImageUrl = localReferenceImageUrl || undefined;
      }

      // 如果有变更，则保存
      if (Object.keys(updates).length > 0) {
        await updateStoryboard(script.id, selectedEpisode.id, selectedStoryboardId, updates);
        showToast('配置已保存', 'success');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存配置失败', 'error');
    }
  };

  const handleAspectRatioChange = (ratio: '9:16' | '16:9') => {
    setLocalAspectRatio(ratio);
  };

  const handleDurationChange = (duration: '10' | '15') => {
    setLocalDuration(duration);
  };

  const handleClearStoryboards = () => {
    if (!script || !selectedEpisode) return;
    clearStoryboards(script.id, selectedEpisode.id);
    onStoryboardChange(null);
    setShowClearConfirm(false);
  };

  const handleReorderStoryboards = (fromIndex: number, toIndex: number) => {
    if (!script || !selectedEpisode) return;
    reorderStoryboards(script.id, selectedEpisode.id, fromIndex, toIndex);
  };

  const handleDownloadAll = async () => {
    if (!selectedEpisode) return;
    const completedCount = selectedEpisode.storyboards.filter(
      (sb) => sb.status === 'completed' && sb.videoUrl
    ).length;
    if (completedCount === 0) {
      alert('暂无可下载的视频');
      return;
    }
    setIsDownloading(true);
    try {
      const result = await downloadEpisodeVideos(selectedEpisode, () => { });
      if (result.failed > 0) {
        alert(`下载完成！成功：${result.success} 个，失败：${result.failed} 个`);
      }
    } catch (error) {
      console.error('批量下载失败:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // 播放器导航
  const currentStoryboardIndex =
    selectedEpisode?.storyboards.findIndex((sb) => sb.id === selectedStoryboardId) ?? -1;

  const handlePreviousStoryboard = () => {
    if (!selectedEpisode || currentStoryboardIndex <= 0) return;
    onStoryboardChange(selectedEpisode.storyboards[currentStoryboardIndex - 1].id);
  };

  const handleNextStoryboard = () => {
    if (!selectedEpisode || currentStoryboardIndex >= selectedEpisode.storyboards.length - 1)
      return;
    onStoryboardChange(selectedEpisode.storyboards[currentStoryboardIndex + 1].id);
  };

  const deleteStoryboardIndex =
    deleteConfirmStoryboardId && selectedEpisode
      ? selectedEpisode.storyboards.findIndex((sb) => sb.id === deleteConfirmStoryboardId)
      : -1;

  // 获取当前选中素材的信息
  const activeVariant = selectedStoryboard?.variants?.find(
    (v) => v.id === selectedStoryboard.activeVariantId
  );

  // 获取当前显示的视频URL（优先使用选中素材的，否则使用旧数据）
  const currentVideoUrl = activeVariant?.videoUrl || selectedStoryboard?.videoUrl;
  const currentThumbnailUrl = activeVariant?.thumbnailUrl || selectedStoryboard?.thumbnailUrl;

  if (!selectedEpisode) {
    return (
      <div className="flex-1 flex">
        {/* 剧集列表 */}
        <EpisodePanel
          scriptId={scriptId}
          selectedEpisodeId={selectedEpisodeId}
          onSelectEpisode={onEpisodeChange}
        />

        {/* 空状态 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="relative mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
                border: '1px solid rgba(0,245,255,0.2)',
              }}
            >
              <Film size={36} style={{ color: 'rgba(0,245,255,0.5)' }} />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ff00ff, #bf00ff)',
                boxShadow: '0 0 10px rgba(255,0,255,0.5)',
              }}
            >
              <Sparkles size={12} className="text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">选择一个剧集</h3>
          <p className="text-sm max-w-md" style={{ color: '#6b7280' }}>
            在左侧面板点击剧集，即可在此处编辑分镜、生成视频
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* 剧集列表 */}
        <EpisodePanel
          scriptId={scriptId}
          selectedEpisodeId={selectedEpisodeId}
          onSelectEpisode={onEpisodeChange}
        />

        {/* 主工作区 */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* 上方：左侧配置面板 + 视频播放器 + 分镜池 */}
          <div className="flex-[3] flex gap-3 min-h-0 overflow-hidden">
            {/* 左侧配置面板（脚本 + 参考图） */}
            <StoryboardLeftPanel
              storyboard={selectedStoryboard || null}
              storyboardIndex={currentStoryboardIndex}
              localDescription={localDescription}
              onLocalDescriptionChange={setLocalDescription}
              onSave={handleSaveConfig}
              hasUnsavedChanges={hasUnsavedChanges}
              localReferenceImageUrl={localReferenceImageUrl}
              onReferenceImageUrlChange={setLocalReferenceImageUrl}
              storyboardImages={selectedEpisode?.storyboardImages || []}
            />

            {/* 中间视频播放器 */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <CyberVideoPlayer
                videoUrl={currentVideoUrl}
                thumbnailUrl={currentThumbnailUrl}
                title={selectedStoryboard ? `分镜 #${currentStoryboardIndex + 1}` : undefined}
                onPrevious={handlePreviousStoryboard}
                onNext={handleNextStoryboard}
                hasPrevious={currentStoryboardIndex > 0}
                hasNext={currentStoryboardIndex < (selectedEpisode?.storyboards.length ?? 0) - 1}
                scriptName={script?.title}
                episodeNumber={selectedEpisode?.episodeNumber}
                storyboardNumber={currentStoryboardIndex + 1}
                aspectRatio={localAspectRatio}
                onAspectRatioChange={handleAspectRatioChange}
                duration={localDuration}
                onDurationChange={handleDurationChange}
              />
            </div>

            {/* 右侧分镜池 */}
            <StoryboardVariantPool
              storyboard={selectedStoryboard || null}
              onSelectVariant={handleSelectVariant}
              onDeleteVariant={handleDeleteVariant}
              onGenerate={() => selectedStoryboardId && handleGenerateVideo(selectedStoryboardId)}
              onRemixVariant={handleRemixVariant}
            />
          </div>

          {/* 下方：分镜列表 */}
          <div className="flex-[1] min-h-[120px] max-h-[160px]">
            <StoryboardGrid
              storyboards={selectedEpisode.storyboards}
              selectedId={selectedStoryboardId}
              onSelect={onStoryboardChange}
              onAdd={handleAddStoryboard}
              onDelete={handleDeleteStoryboard}
              onReorder={handleReorderStoryboards}
              onDownloadAll={handleDownloadAll}
              onClearAll={() => setShowClearConfirm(true)}
              isDownloading={isDownloading}
            />
          </div>
        </div>
      </div>

      {/* 删除分镜确认弹框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirmStoryboardId}
        title="确认删除"
        message={`确定要删除分镜 #${deleteStoryboardIndex + 1} 吗？此操作不可撤销。`}
        type="danger"
        confirmText="确认删除"
        onConfirm={confirmDeleteStoryboard}
        onCancel={() => setDeleteConfirmStoryboardId(null)}
      />

      {/* 删除素材确认弹框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirmVariantId}
        title="确认删除"
        message="删除后无法恢复，确定要删除吗？"
        type="warning"
        confirmText="确认删除"
        onConfirm={confirmDeleteVariant}
        onCancel={() => setDeleteConfirmVariantId(null)}
      />

      {/* 清空分镜确认弹框 */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="确认清空"
        message="确定要清空当前剧集的所有分镜吗？此操作不可撤销。"
        type="danger"
        confirmText="确认清空"
        onConfirm={handleClearStoryboards}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Toast 容器 */}
      <ToastContainer />
    </>
  );
};
