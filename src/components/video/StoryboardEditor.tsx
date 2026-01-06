import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Video, Download } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { Character, Episode } from '@/types/video';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StoryboardCard } from './StoryboardCard';
import { StoryboardSettingsModal } from './StoryboardSettingsModal';
import { useTaskPolling, PollResult } from '@/hooks/useTaskPolling';
import { useStoryboardDrag } from '@/hooks/useStoryboardDrag';
import { generateStoryboardVideo, remixVideo } from '@/services/api';
import { downloadEpisodeVideos } from '@/utils/downloadVideos';

// 默认风格设定
const DEFAULT_STYLE = '日漫风格';

interface StoryboardEditorProps {
  episode: Episode;
}

export const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ episode }) => {
  const {
    getCurrentScript,
    addStoryboard,
    updateStoryboard,
    deleteStoryboard,
    clearStoryboards,
    reorderStoryboards
  } = useVideoStore();

  const script = getCurrentScript();

  const [settingsModalStoryboardId, setSettingsModalStoryboardId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmStoryboardId, setDeleteConfirmStoryboardId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number; filename: string } | null>(null);

  // 轮询状态变更回调
  const handleStatusChange = useCallback((taskId: string, result: PollResult) => {
    if (!script) return;

    // 找到对应的分镜
    const storyboard = episode.storyboards.find(sb => sb.taskId === taskId);
    if (!storyboard) return;

    updateStoryboard(script.id, episode.id, storyboard.id, {
      status: result.status,
      progress: result.progress,
      ...(result.videoUrl ? { videoUrl: result.videoUrl } : {}),
    });
  }, [script, episode, updateStoryboard]);

  // 使用轮询 hook
  const { startPolling, stopPolling } = useTaskPolling({
    onStatusChange: handleStatusChange,
  });

  // 使用拖拽 hook
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (!script) return;
    reorderStoryboards(script.id, episode.id, fromIndex, toIndex);
  }, [script, episode.id, reorderStoryboards]);

  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useStoryboardDrag(handleReorder);

  // 组件挂载时，恢复生成中或排队中的分镜轮询
  useEffect(() => {
    episode.storyboards.forEach((storyboard) => {
      if ((storyboard.status === 'generating' || storyboard.status === 'queued') && storyboard.taskId) {
        startPolling(storyboard.taskId);
      }
    });
  }, [episode.id]); // 只在 episode 变化时重新检查

  const handleAddStoryboard = () => {
    if (!script) return;
    const sceneNumber = episode.storyboards.length + 1;
    addStoryboard(script.id, episode.id, {
      sceneNumber,
      description: `分镜 ${sceneNumber}`,
      characterIds: [],
    });
  };

  const handleDeleteStoryboard = (storyboardId: string) => {
    if (!script) return;

    // 停止该分镜的轮询
    const storyboard = episode.storyboards.find(sb => sb.id === storyboardId);
    if (storyboard?.taskId) {
      stopPolling(storyboard.taskId);
    }

    deleteStoryboard(script.id, episode.id, storyboardId);
    setDeleteConfirmStoryboardId(null);
  };

  const handleSaveSettings = (
    storyboardId: string,
    data: {
      description: string;
      characterIds: string[];
      referenceImageUrls?: string[];
      aspectRatio: string;
      duration: string;
      mode: string;
    }
  ) => {
    if (!script) return;
    updateStoryboard(script.id, episode.id, storyboardId, {
      description: data.description,
      characterIds: data.characterIds,
      referenceImageUrls: data.referenceImageUrls,
      aspectRatio: data.aspectRatio as '9:16' | '16:9',
      duration: data.duration as '10' | '15',
      mode: data.mode as 'normal' | 'remix',
    });
  };

  const handleGenerateVideo = async (storyboardId: string) => {
    if (!script) return;

    const storyboard = episode.storyboards.find((sb) => sb.id === storyboardId);
    if (!storyboard || !storyboard.description) {
      alert('请先填写分镜脚本');
      return;
    }

    // 停止旧的轮询
    if (storyboard.taskId) {
      stopPolling(storyboard.taskId);
    }

    updateStoryboard(script.id, episode.id, storyboardId, {
      status: 'generating',
      progress: '0',
      taskId: undefined,
    });

    try {
      // 构建 prompt
      const finalPrompt = buildPrompt(storyboard.description, storyboard.characterIds, script.characters);

      // 根据用户选择的模式决定是否使用 remix
      const useRemixMode = storyboard.mode === 'remix';
      const storyboardIndex = episode.storyboards.findIndex((sb) => sb.id === storyboardId);
      const previousTaskId = findPreviousCompletedTaskId(episode.storyboards, storyboardIndex);

      let response;
      if (useRemixMode && previousTaskId) {
        // 用户选择了 remix 模式且有上一个完成的视频
        const remixPrompt = `接上个视频结尾，以下是后续剧情。\n\n${finalPrompt}`;
        response = await remixVideo({
          taskId: previousTaskId,
          prompt: remixPrompt,
          aspect_ratio: storyboard.aspectRatio || '9:16',
          duration: storyboard.duration || '15',
          characterIds: storyboard.characterIds,
          // remix 模式不支持参考图
        });
      } else {
        // 普通模式或没有上一个视频
        response = await generateStoryboardVideo({
          prompt: finalPrompt,
          aspect_ratio: storyboard.aspectRatio || '9:16',
          duration: storyboard.duration || '15',
          characterIds: storyboard.characterIds,
          referenceImageUrls: storyboard.referenceImageUrls,
        });
      }

      const taskId = response.data.task_id || (response.data as { id?: string }).id;
      if (response.success && taskId) {
        updateStoryboard(script.id, episode.id, storyboardId, { taskId });
        startPolling(taskId);
      } else {
        throw new Error('未获取到任务ID');
      }
    } catch (error) {
      console.error('分镜视频生成失败:', error);
      updateStoryboard(script.id, episode.id, storyboardId, {
        status: 'failed',
        progress: undefined,
      });
    }
  };

  const handleClearStoryboards = () => {
    if (!script) return;

    // 停止所有分镜的轮询
    episode.storyboards.forEach(sb => {
      if (sb.taskId) stopPolling(sb.taskId);
    });

    clearStoryboards(script.id, episode.id);
    setShowClearConfirm(false);
  };

  const handleDownloadAll = async () => {
    // 检查是否有可下载的视频
    const completedCount = episode.storyboards.filter(
      sb => sb.status === 'completed' && sb.videoUrl
    ).length;

    if (completedCount === 0) {
      alert('暂无可下载的视频');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: completedCount, filename: '' });

    try {
      const result = await downloadEpisodeVideos(episode, (current, total, filename) => {
        setDownloadProgress({ current, total, filename });
      });

      if (result.failed > 0) {
        alert(`下载完成！成功：${result.success} 个，失败：${result.failed} 个`);
      } else {
        alert(`成功下载 ${result.success} 个视频！`);
      }
    } catch (error) {
      console.error('批量下载失败:', error);
      alert(error instanceof Error ? error.message : '下载失败');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  if (!script) return null;

  const currentSettingsStoryboard = settingsModalStoryboardId
    ? episode.storyboards.find((sb) => sb.id === settingsModalStoryboardId)
    : null;

  const deleteStoryboardIndex = deleteConfirmStoryboardId
    ? episode.storyboards.findIndex(sb => sb.id === deleteConfirmStoryboardId)
    : -1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
        <div>
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">
            {episode.title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {episode.storyboards.length} 个分镜
          </p>
        </div>
        <div className="flex items-center gap-2">
          {episode.storyboards.length > 0 && (
            <>
              {episode.storyboards.some(sb => sb.status === 'completed' && sb.videoUrl) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                  className="text-blue-500 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
                >
                  <Download size={14} className="mr-1.5" />
                  {isDownloading ? `下载中 ${downloadProgress?.current}/${downloadProgress?.total}` : '批量下载'}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} className="mr-1.5" />
                清空分镜
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleAddStoryboard}>
            <Plus size={14} className="mr-1.5" />
            添加分镜
          </Button>
        </div>
      </div>

      {/* 分镜列表 */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-3 items-start">
          {/* 空状态 */}
          {episode.storyboards.length === 0 && (
            <div className="col-span-3 xl:col-span-4 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
                <Video size={28} className="text-purple-500/50" />
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                暂无分镜，点击上方按钮添加
              </p>
            </div>
          )}

          {/* 分镜卡片 */}
          {episode.storyboards.map((storyboard, index) => {
            const hasPreviousGenerating = episode.storyboards
              .slice(0, index)
              .some((sb) => sb.status === 'generating' || sb.status === 'queued');
            const isGenerateDisabled = hasPreviousGenerating &&
              storyboard.status !== 'generating' &&
              storyboard.status !== 'queued';

            return (
              <StoryboardCard
                key={storyboard.id}
                storyboard={storyboard}
                index={index}
                isDragging={draggedIndex === index}
                isDropTarget={dragOverIndex === index && draggedIndex !== null && draggedIndex !== index}
                isGenerateDisabled={isGenerateDisabled}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onDelete={setDeleteConfirmStoryboardId}
                onSettings={setSettingsModalStoryboardId}
                onGenerate={handleGenerateVideo}
              />
            );
          })}
        </div>
      </div>

      {/* 分镜设置弹框 */}
      {settingsModalStoryboardId && currentSettingsStoryboard && (
        <StoryboardSettingsModal
          description={currentSettingsStoryboard.description}
          characters={script.characters}
          selectedCharacterIds={currentSettingsStoryboard.characterIds}
          referenceImageUrls={currentSettingsStoryboard.referenceImageUrls}
          aspectRatio={currentSettingsStoryboard.aspectRatio}
          duration={currentSettingsStoryboard.duration}
          mode={currentSettingsStoryboard.mode}
          taskId={currentSettingsStoryboard.taskId}
          onSave={(data) => handleSaveSettings(settingsModalStoryboardId, data)}
          onClose={() => setSettingsModalStoryboardId(null)}
        />
      )}

      {/* 删除分镜确认弹框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirmStoryboardId}
        title="确认删除"
        message={`确定要删除分镜 #${deleteStoryboardIndex + 1} 吗？此操作不可撤销。`}
        type="danger"
        confirmText="确认删除"
        onConfirm={() => deleteConfirmStoryboardId && handleDeleteStoryboard(deleteConfirmStoryboardId)}
        onCancel={() => setDeleteConfirmStoryboardId(null)}
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
    </div>
  );
};

// 辅助函数：构建 prompt
function buildPrompt(description: string, characterIds: string[], characters: Character[]): string {
  const globalSettings: string[] = [];

  globalSettings.push(`风格：${DEFAULT_STYLE}`);

  const selectedCharacters = characterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter((char): char is Character => !!char && !!char.username);

  if (selectedCharacters.length > 0) {
    const characterSettings = selectedCharacters
      .map((char) => `${char.name}：@${char.username}`)
      .join('，');
    globalSettings.push(`角色参演：${characterSettings}`);
  }

  return globalSettings.length > 0
    ? `【全局设定】${globalSettings.join('；')}。\n\n${description}`
    : description;
}

// 辅助函数：查找上一个已完成的分镜的 taskId
function findPreviousCompletedTaskId(
  storyboards: { taskId?: string; status: string }[],
  currentIndex: number
): string | undefined {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const sb = storyboards[i];
    if (sb.taskId && sb.status === 'completed') {
      return sb.taskId;
    }
  }
  return undefined;
}
