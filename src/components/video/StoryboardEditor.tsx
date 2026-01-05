import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Play, Loader2, RefreshCw, Trash2, Video, AlertTriangle, Settings } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { Character, Episode, Storyboard } from '@/types/video';
import { Button } from '@/components/ui/Button';
import { StoryboardSettingsModal } from './StoryboardSettingsModal';
import { generateStoryboardVideo, getVideoStatus, remixVideo } from '@/services/api';

interface StoryboardEditorProps {
  episode: Episode;
}

export const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ episode }) => {
  const { getCurrentScript, addStoryboard, updateStoryboard, deleteStoryboard, clearStoryboards, reorderStoryboards } = useVideoStore();
  const script = getCurrentScript();

  const [settingsModalStoryboardId, setSettingsModalStoryboardId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmStoryboardId, setDeleteConfirmStoryboardId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 轮询定时器引用
  const pollingTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // 启动轮询
  const startPolling = useCallback((storyboard: Storyboard) => {
    // 如果已有定时器，先清除
    const existingTimer = pollingTimersRef.current.get(storyboard.id);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // 保存当前的 taskId，确保轮询使用正确的 taskId
    const currentTaskId = storyboard.taskId;
    if (!currentTaskId) return;

    // 定义轮询函数，直接使用传入的 storyboard 信息
    const doPoll = async () => {
      if (!script) return;
      
      try {
        const response = await getVideoStatus(currentTaskId);
        const responseData = response.data as {
          status?: string;
          progress?: string | number;
          data?: { 
            output?: string;
            video_url?: string;  // remix 接口返回的字段
            status?: string;     // 内层状态
          };
          output?: { url?: string };
        };
        // 优先使用外层 status，如果是 NOT_START 则检查内层 data.status
        const outerStatus = responseData.status;
        const innerStatus = responseData.data?.status;
        const progress = responseData.progress;
        // 兼容多种视频 URL 字段：data.video_url, data.output, output.url
        const videoUrl = responseData.data?.video_url || responseData.data?.output || responseData.output?.url;

        // 判断是否排队中：外层 NOT_START 且内层 queued
        const isQueued = outerStatus === 'NOT_START' || innerStatus === 'queued';
        const isSuccess = outerStatus === 'SUCCESS' || outerStatus === 'completed' || innerStatus === 'completed';
        const isFailed = outerStatus === 'FAILURE' || outerStatus === 'failed' || innerStatus === 'failed';
        const isInProgress = outerStatus === 'IN_PROGRESS' || innerStatus === 'pending';

        if (isSuccess) {
          updateStoryboard(script.id, episode.id, storyboard.id, {
            status: 'completed',
            videoUrl: videoUrl,
            progress: '100',
          });
          const timer = pollingTimersRef.current.get(storyboard.id);
          if (timer) {
            clearInterval(timer);
            pollingTimersRef.current.delete(storyboard.id);
          }
        } else if (isFailed) {
          updateStoryboard(script.id, episode.id, storyboard.id, {
            status: 'failed',
            progress: undefined,
          });
          const timer = pollingTimersRef.current.get(storyboard.id);
          if (timer) {
            clearInterval(timer);
            pollingTimersRef.current.delete(storyboard.id);
          }
        } else if (isQueued) {
          // 排队中状态
          updateStoryboard(script.id, episode.id, storyboard.id, {
            status: 'queued',
            progress: '0',
          });
        } else if (isInProgress) {
          // 生成中状态
          const progressValue = typeof progress === 'number' ? String(progress) : (progress || '0');
          updateStoryboard(script.id, episode.id, storyboard.id, {
            status: 'generating',
            progress: progressValue,
          });
        } else {
          // 其他状态，保持生成中
          const progressValue = typeof progress === 'number' ? String(progress) : (progress || '0');
          updateStoryboard(script.id, episode.id, storyboard.id, {
            progress: progressValue,
          });
        }
      } catch (error) {
        console.error('查询分镜状态失败:', error);
      }
    };

    // 立即查询一次
    doPoll();

    // 每10秒轮询一次
    const timer = setInterval(() => {
      const currentStoryboard = episode.storyboards.find(sb => sb.id === storyboard.id);
      // 检查 taskId 是否匹配，如果不匹配说明已经重新生成了，停止当前轮询
      if (!currentStoryboard || currentStoryboard.taskId !== currentTaskId) {
        clearInterval(timer);
        pollingTimersRef.current.delete(storyboard.id);
        return;
      }
      doPoll();
    }, 10000);

    pollingTimersRef.current.set(storyboard.id, timer);
  }, [script, episode.id, episode.storyboards, updateStoryboard]);

  // 组件挂载时，恢复生成中或排队中的分镜轮询
  useEffect(() => {
    episode.storyboards.forEach((storyboard) => {
      if ((storyboard.status === 'generating' || storyboard.status === 'queued') && storyboard.taskId) {
        startPolling(storyboard);
      }
    });

    // 组件卸载时清除所有定时器
    return () => {
      pollingTimersRef.current.forEach((timer) => clearInterval(timer));
      pollingTimersRef.current.clear();
    };
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
    }
  ) => {
    if (!script) return;
    updateStoryboard(script.id, episode.id, storyboardId, {
      description: data.description,
      characterIds: data.characterIds,
      referenceImageUrls: data.referenceImageUrls,
      aspectRatio: data.aspectRatio as '9:16' | '16:9',
      duration: data.duration as '10' | '15',
    });
  };

  const handleGenerateVideo = async (storyboardId: string) => {
    if (!script) return;

    const storyboard = episode.storyboards.find((sb) => sb.id === storyboardId);
    if (!storyboard || !storyboard.description) {
      alert('请先填写分镜脚本');
      return;
    }

    // 重新生成时，先停止旧的轮询
    const existingTimer = pollingTimersRef.current.get(storyboardId);
    if (existingTimer) {
      clearInterval(existingTimer);
      pollingTimersRef.current.delete(storyboardId);
    }

    updateStoryboard(script.id, episode.id, storyboardId, { 
      status: 'generating',
      progress: '0',
      taskId: undefined, // 清除旧的 taskId
    });

    try {
      // 构建全局设定
      const globalSettings: string[] = [];
      
      // 1. 风格设定
      globalSettings.push('风格：日漫风格');
      
      // 2. 角色参演设定
      const selectedCharacters = storyboard.characterIds
        .map((id) => script.characters.find((c) => c.id === id))
        .filter((char): char is Character => !!char && !!char.username);
      
      if (selectedCharacters.length > 0) {
        const characterSettings = selectedCharacters
          .map((char) => `${char.name}：@${char.username}`)
          .join('，');
        globalSettings.push(`角色参演：${characterSettings}`);
      }
      
      // 组合最终 prompt：全局设定 + 分镜脚本
      const finalPrompt = globalSettings.length > 0
        ? `【全局设定】${globalSettings.join('；')}。\n\n${storyboard.description}`
        : storyboard.description;

      // 判断是否是第一个分镜
      const storyboardIndex = episode.storyboards.findIndex((sb) => sb.id === storyboardId);
      const isFirstStoryboard = storyboardIndex === 0;
      
      // 查找上一个已完成的分镜（用于 remix）
      let previousTaskId: string | undefined;
      if (!isFirstStoryboard) {
        // 从当前分镜往前找，找到第一个有 taskId 且已完成的分镜
        for (let i = storyboardIndex - 1; i >= 0; i--) {
          const prevStoryboard = episode.storyboards[i];
          if (prevStoryboard.taskId && prevStoryboard.status === 'completed') {
            previousTaskId = prevStoryboard.taskId;
            break;
          }
        }
      }

      let response;
      
      if (isFirstStoryboard || !previousTaskId) {
        // 第一个分镜或找不到上一个已完成的分镜，使用普通生成接口
        response = await generateStoryboardVideo({
          prompt: finalPrompt,
          aspect_ratio: storyboard.aspectRatio || '9:16',
          duration: storyboard.duration || '15',
          characterIds: storyboard.characterIds,
        });
      } else {
        // 后续分镜，使用 remix 接口，并在提示词前添加衔接语
        const remixPrompt = `接上个视频结尾，以下是后续剧情。\n\n${finalPrompt}`;
        response = await remixVideo({
          taskId: previousTaskId,
          prompt: remixPrompt,
          aspect_ratio: storyboard.aspectRatio || '9:16',
          duration: storyboard.duration || '15',
          characterIds: storyboard.characterIds,
        });
      }

      // 兼容两种响应格式：task_id 或 id
      const taskId = response.data.task_id || (response.data as { id?: string }).id;
      if (response.success && taskId) {
        // 保存 taskId 并开始轮询
        updateStoryboard(script.id, episode.id, storyboardId, {
          taskId: taskId,
        });
        
        // 获取更新后的 storyboard
        const updatedStoryboard = {
          ...storyboard,
          taskId: taskId,
        };
        startPolling(updatedStoryboard);
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
    clearStoryboards(script.id, episode.id);
    setShowClearConfirm(false);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    
    // 隐藏默认的拖拽幻影
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!script || draggedIndex === null || draggedIndex === dropIndex) return;
    
    reorderStoryboards(script.id, episode.id, draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!script) return null;

  const currentSettingsStoryboard = settingsModalStoryboardId
    ? episode.storyboards.find((sb) => sb.id === settingsModalStoryboardId)
    : null;

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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowClearConfirm(true)}
              className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} className="mr-1.5" />
              清空分镜
            </Button>
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
            const isDragging = draggedIndex === index;
            const isDropTarget = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;
            
            // 检查前面是否有正在生成中或排队中的分镜
            const hasPreviousGenerating = episode.storyboards
              .slice(0, index)
              .some((sb) => sb.status === 'generating' || sb.status === 'queued');
            const isGenerateDisabled = hasPreviousGenerating && storyboard.status !== 'generating' && storyboard.status !== 'queued';
            
            return (
              <div
                key={storyboard.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden shadow-sm transition-all ${
                  isDragging
                    ? 'opacity-30 cursor-grabbing'
                    : isDropTarget
                    ? 'border-purple-500 shadow-lg ring-2 ring-purple-300 dark:ring-purple-600'
                    : 'border-gray-200 dark:border-gray-700 cursor-grab hover:shadow-md'
                }`}
              >
                {/* 拖拽目标指示器 */}
                {isDropTarget && (
                  <div className="absolute inset-0 bg-purple-500/10 pointer-events-none z-10 flex items-center justify-center">
                    <div className="text-purple-600 dark:text-purple-400 font-semibold text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg">
                      放置到这里
                    </div>
                  </div>
                )}
                {/* 视频预览 */}
                <div className="aspect-video bg-gray-800 dark:bg-gray-900 relative">
                  {storyboard.videoUrl ? (
                    <video
                      src={`${storyboard.videoUrl}#t=0.1`}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  ) : storyboard.thumbnailUrl ? (
                    <img
                      src={storyboard.thumbnailUrl}
                      alt={`分镜 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={32} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  )}

                  {/* 生成中/排队中遮罩 */}
                  {(storyboard.status === 'generating' || storyboard.status === 'queued') && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 size={24} className="animate-spin mx-auto mb-1" />
                        <span className="text-xs">
                          {storyboard.status === 'queued' 
                            ? '排队中...' 
                            : `生成中 ${storyboard.progress ? `${storyboard.progress.replace('%', '')}%` : '...'}`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 序号 */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium">
                    #{index + 1}
                  </div>

                  {/* 右上角删除按钮 */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setDeleteConfirmStoryboardId(storyboard.id)}
                      className="p-1.5 rounded-md bg-black/40 text-white/80 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 内容区 */}
                <div className="p-2.5">
                  {/* 描述 - 固定高度 */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed h-[40px] overflow-hidden">
                    {storyboard.description || '暂无描述'}
                  </p>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1.5">
                    {/* 配置按钮 - 50% 宽度 */}
                    <button
                      onClick={() => setSettingsModalStoryboardId(storyboard.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors"
                    >
                      <Settings size={12} />
                      配置
                    </button>

                    {/* 生成按钮 - 50% 宽度 */}
                    {storyboard.status === 'generating' || storyboard.status === 'queued' ? (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg opacity-50 cursor-not-allowed"
                      >
                        <Loader2 size={12} className="animate-spin" />
                        {storyboard.status === 'queued' ? '排队中' : '生成中'}
                      </button>
                    ) : isGenerateDisabled ? (
                      <button
                        disabled
                        title="为了确保一致性，请等待上一个视频生成完毕"
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg opacity-50 cursor-not-allowed"
                      >
                        <Play size={12} />
                        {storyboard.status === 'completed' ? '重新生成' : '生成'}
                      </button>
                    ) : storyboard.status === 'completed' ? (
                      <button
                        onClick={() => handleGenerateVideo(storyboard.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-lg transition-colors"
                      >
                        <RefreshCw size={12} />
                        重新生成
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateVideo(storyboard.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-lg transition-colors"
                      >
                        <Play size={12} />
                        生成
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
          onSave={(data) => handleSaveSettings(settingsModalStoryboardId, data)}
          onClose={() => setSettingsModalStoryboardId(null)}
        />
      )}

      {/* 删除分镜确认弹框 */}
      {deleteConfirmStoryboardId && (() => {
        const index = episode.storyboards.findIndex(sb => sb.id === deleteConfirmStoryboardId);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  确认删除
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                确定要删除分镜 #{index + 1} 吗？此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmStoryboardId(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteStoryboard(deleteConfirmStoryboardId)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 清空分镜确认弹框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                确认清空
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              确定要清空当前剧集的所有分镜吗？此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearStoryboards}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
