import React, { useState, useEffect, useCallback } from 'react';
import { Film, Sparkles } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { EpisodePanel } from './EpisodePanel';
import { StoryboardGrid } from './StoryboardGrid';
import { CyberVideoPlayer } from './CyberVideoPlayer';
import { StoryboardLeftPanel } from './StoryboardLeftPanel';
import { StoryboardVariantPool } from './StoryboardVariantPool';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useTaskPolling, PollResult } from '@/hooks/useTaskPolling';
import { generateStoryboardVideo } from '@/services/api';
import { downloadEpisodeVideos } from '@/utils/downloadVideos';

const DEFAULT_STYLE = '日漫风格';

interface EpisodeWorkspaceProps {
  scriptId: string;
}

export const EpisodeWorkspace: React.FC<EpisodeWorkspaceProps> = ({ scriptId }) => {
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
  } = useVideoStore();

  const { showToast, ToastContainer } = useToast();

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [selectedStoryboardId, setSelectedStoryboardId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmStoryboardId, setDeleteConfirmStoryboardId] = useState<string | null>(null);
  const [deleteConfirmVariantId, setDeleteConfirmVariantId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localDescription, setLocalDescription] = useState('');

  const script = scripts.find((s) => s.id === scriptId);

  // 初始化选中第一个剧集
  useEffect(() => {
    if (script && script.episodes.length > 0) {
      setSelectedEpisodeId(script.episodes[0].id);
    } else {
      setSelectedEpisodeId(null);
    }
  }, [script?.id]);

  const selectedEpisode = script?.episodes.find((e) => e.id === selectedEpisodeId);

  // 自动选择第一个分镜
  useEffect(() => {
    if (selectedEpisode && selectedEpisode.storyboards.length > 0) {
      setSelectedStoryboardId(selectedEpisode.storyboards[0].id);
    } else {
      setSelectedStoryboardId(null);
    }
  }, [selectedEpisode?.id, selectedEpisode?.storyboards.length]);

  const selectedStoryboard = selectedEpisode?.storyboards.find(
    (sb) => sb.id === selectedStoryboardId
  );

  // 当选中的分镜变化时，同步本地描述
  useEffect(() => {
    setLocalDescription(selectedStoryboard?.description || '');
  }, [selectedStoryboard?.id, selectedStoryboard?.description]);

  // 计算是否有未保存的更改
  const hasUnsavedChanges = localDescription !== (selectedStoryboard?.description || '');

  // 任务轮询
  const handleStatusChange = useCallback(
    (taskId: string, result: PollResult) => {
      if (!script || !selectedEpisode) return;
      // 查找包含此 taskId 的分镜副本
      for (const storyboard of selectedEpisode.storyboards) {
        const variant = (storyboard.variants || []).find((v) => v.taskId === taskId);
        if (variant) {
          updateVariant(script.id, selectedEpisode.id, storyboard.id, variant.id, {
            status: result.status,
            progress: result.progress,
            ...(result.videoUrl ? { videoUrl: result.videoUrl } : {}),
          });
          return;
        }
      }
      // 兼容旧数据：查找分镜本身的 taskId
      const storyboard = selectedEpisode.storyboards.find((sb) => sb.taskId === taskId);
      if (storyboard) {
        updateStoryboard(script.id, selectedEpisode.id, storyboard.id, {
          status: result.status,
          progress: result.progress,
          ...(result.videoUrl ? { videoUrl: result.videoUrl } : {}),
        });
      }
    },
    [script, selectedEpisode, updateVariant, updateStoryboard]
  );

  const { startPolling, stopPolling } = useTaskPolling({
    onStatusChange: handleStatusChange,
  });

  useEffect(() => {
    if (!selectedEpisode) return;
    selectedEpisode.storyboards.forEach((storyboard) => {
      // 轮询分镜副本的任务
      (storyboard.variants || []).forEach((variant) => {
        if (
          (variant.status === 'generating' || variant.status === 'queued') &&
          variant.taskId
        ) {
          startPolling(variant.taskId);
        }
      });
      // 兼容旧数据
      if (
        (storyboard.status === 'generating' || storyboard.status === 'queued') &&
        storyboard.taskId
      ) {
        startPolling(storyboard.taskId);
      }
    });
  }, [selectedEpisode?.id]);

  // 分镜操作
  const handleAddStoryboard = async () => {
    if (!script || !selectedEpisode) return;
    try {
      const sceneNumber = selectedEpisode.storyboards.length + 1;
      const newId = await addStoryboard(script.id, selectedEpisode.id, {
        sceneNumber,
        description: `分镜 ${sceneNumber}`,
      });
      setSelectedStoryboardId(newId);
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
      const storyboard = selectedEpisode.storyboards.find(
        (sb) => sb.id === deleteConfirmStoryboardId
      );
      if (storyboard?.taskId) {
        stopPolling(storyboard.taskId);
      }
      await deleteStoryboard(script.id, selectedEpisode.id, deleteConfirmStoryboardId);
      if (selectedStoryboardId === deleteConfirmStoryboardId) {
        setSelectedStoryboardId(null);
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

    try {
      // 创建新的分镜副本
      const variantId = await addVariant(script.id, selectedEpisode.id, storyboardId);
      
      // 更新副本状态为生成中
      await updateVariant(script.id, selectedEpisode.id, storyboardId, variantId, {
        status: 'generating',
        progress: '0',
      });

      const finalPrompt = buildPrompt(storyboard.description);
      const response = await generateStoryboardVideo({
        prompt: finalPrompt,
        aspect_ratio: storyboard.aspectRatio || '9:16',
        duration: storyboard.duration || '15',
        referenceImageUrls: storyboard.referenceImageUrls,
      });
      const taskId = response.data.task_id || (response.data as { id?: string }).id;
      if (response.success && taskId) {
        await updateVariant(script.id, selectedEpisode.id, storyboardId, variantId, { taskId });
        startPolling(taskId);
      } else {
        throw new Error('未获取到任务ID');
      }
    } catch (error) {
      console.error('分镜视频生成失败:', error);
      showToast(error instanceof Error ? error.message : '视频生成失败，请重试', 'error');
      // 如果失败，需要找到刚创建的副本并更新状态
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

  // 分镜副本操作
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
      const storyboard = selectedEpisode.storyboards.find((sb) => sb.id === selectedStoryboardId);
      const variant = (storyboard?.variants || []).find((v) => v.id === deleteConfirmVariantId);
      if (variant?.taskId) {
        stopPolling(variant.taskId);
      }
      await deleteVariant(script.id, selectedEpisode.id, selectedStoryboardId, deleteConfirmVariantId);
      showToast('副本已删除', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除副本失败', 'error');
    }
    setDeleteConfirmVariantId(null);
  };

  // 保存所有配置
  const handleSaveConfig = () => {
    if (!script || !selectedEpisode || !selectedStoryboardId) return;
    // 保存脚本描述
    if (localDescription !== selectedStoryboard?.description) {
      updateStoryboard(script.id, selectedEpisode.id, selectedStoryboardId, {
        description: localDescription,
      });
    }
  };

  const handleAspectRatioChange = (ratio: '9:16' | '16:9') => {
    if (!script || !selectedEpisode || !selectedStoryboardId) return;
    updateStoryboard(script.id, selectedEpisode.id, selectedStoryboardId, { aspectRatio: ratio });
  };

  const handleDurationChange = (duration: '10' | '15') => {
    if (!script || !selectedEpisode || !selectedStoryboardId) return;
    updateStoryboard(script.id, selectedEpisode.id, selectedStoryboardId, { duration });
  };

  const handleClearStoryboards = () => {
    if (!script || !selectedEpisode) return;
    selectedEpisode.storyboards.forEach((sb) => {
      if (sb.taskId) stopPolling(sb.taskId);
    });
    clearStoryboards(script.id, selectedEpisode.id);
    setSelectedStoryboardId(null);
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
      const result = await downloadEpisodeVideos(selectedEpisode, () => {});
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
    setSelectedStoryboardId(selectedEpisode.storyboards[currentStoryboardIndex - 1].id);
  };

  const handleNextStoryboard = () => {
    if (!selectedEpisode || currentStoryboardIndex >= selectedEpisode.storyboards.length - 1)
      return;
    setSelectedStoryboardId(selectedEpisode.storyboards[currentStoryboardIndex + 1].id);
  };

  const deleteStoryboardIndex =
    deleteConfirmStoryboardId && selectedEpisode
      ? selectedEpisode.storyboards.findIndex((sb) => sb.id === deleteConfirmStoryboardId)
      : -1;

  // 获取当前选中副本的信息
  const activeVariant = selectedStoryboard?.variants?.find(
    (v) => v.id === selectedStoryboard.activeVariantId
  );

  // 获取当前显示的视频URL（优先使用选中副本的，否则使用旧数据）
  const currentVideoUrl = activeVariant?.videoUrl || selectedStoryboard?.videoUrl;
  const currentThumbnailUrl = activeVariant?.thumbnailUrl || selectedStoryboard?.thumbnailUrl;

  if (!selectedEpisode) {
    return (
      <div className="flex-1 flex">
        {/* 剧集列表 */}
        <EpisodePanel
          scriptId={scriptId}
          selectedEpisodeId={selectedEpisodeId}
          onSelectEpisode={setSelectedEpisodeId}
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
          onSelectEpisode={setSelectedEpisodeId}
        />

        {/* 主工作区 */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* 上方：左侧配置面板 + 视频播放器 + 分镜池 */}
          <div className="flex-[3] flex gap-3 min-h-0 overflow-hidden">
            {/* 左侧配置面板（脚本 + API设置 + 关联资产） */}
            <StoryboardLeftPanel
              storyboard={selectedStoryboard || null}
              storyboardIndex={currentStoryboardIndex}
              onAspectRatioChange={handleAspectRatioChange}
              onDurationChange={handleDurationChange}
              localDescription={localDescription}
              onLocalDescriptionChange={setLocalDescription}
              onSave={handleSaveConfig}
              hasUnsavedChanges={hasUnsavedChanges}
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
              />
            </div>

            {/* 右侧分镜池 */}
            <StoryboardVariantPool
              storyboard={selectedStoryboard || null}
              onSelectVariant={handleSelectVariant}
              onDeleteVariant={handleDeleteVariant}
              onGenerate={() => selectedStoryboardId && handleGenerateVideo(selectedStoryboardId)}
            />
          </div>

          {/* 下方：分镜列表 */}
          <div className="flex-[1] min-h-[120px] max-h-[160px]">
            <StoryboardGrid
              storyboards={selectedEpisode.storyboards}
              selectedId={selectedStoryboardId}
              onSelect={setSelectedStoryboardId}
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

      {/* 删除副本确认弹框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirmVariantId}
        title="确认删除副本"
        message="确定要删除这个分镜副本吗？此操作不可撤销。"
        type="danger"
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
    </>
  );
};

function buildPrompt(description: string): string {
  return `【全局设定】风格：${DEFAULT_STYLE}。\n\n${description}`;
}
