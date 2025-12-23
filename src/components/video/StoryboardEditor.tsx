import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Play, Loader2, RefreshCw, Trash2, Video, Users, X, FileText, AlertTriangle, Settings } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { Character, Episode, Storyboard } from '@/types/video';
import { Button } from '@/components/ui/Button';
import { CharacterSelectModal } from './CharacterSelectModal';
import { StoryboardScriptModal } from './StoryboardScriptModal';
import { generateStoryboardVideo, getVideoStatus } from '@/services/api';
import { cn } from '@/utils/cn';

interface StoryboardEditorProps {
  episode: Episode;
}

export const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ episode }) => {
  const { getCurrentScript, addStoryboard, updateStoryboard, deleteStoryboard, clearStoryboards } = useVideoStore();
  const script = getCurrentScript();

  const [characterModalStoryboardId, setCharacterModalStoryboardId] = useState<string | null>(null);
  const [scriptModalStoryboardId, setScriptModalStoryboardId] = useState<string | null>(null);
  const [settingsModalStoryboardId, setSettingsModalStoryboardId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // 轮询定时器引用
  const pollingTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // 轮询查询分镜状态
  const pollStoryboardStatus = useCallback(async (storyboard: Storyboard) => {
    if (!script || !storyboard.taskId) return;

    try {
      const response = await getVideoStatus(storyboard.taskId);
      const { status, progress, data } = response.data;

      if (status === 'SUCCESS') {
        // 生成成功
        updateStoryboard(script.id, episode.id, storyboard.id, {
          status: 'completed',
          videoUrl: data?.output,
          progress: '100',
        });
        // 清除定时器
        const timer = pollingTimersRef.current.get(storyboard.id);
        if (timer) {
          clearInterval(timer);
          pollingTimersRef.current.delete(storyboard.id);
        }
      } else if (status === 'FAILURE') {
        // 生成失败
        updateStoryboard(script.id, episode.id, storyboard.id, {
          status: 'failed',
          progress: undefined,
        });
        // 清除定时器
        const timer = pollingTimersRef.current.get(storyboard.id);
        if (timer) {
          clearInterval(timer);
          pollingTimersRef.current.delete(storyboard.id);
        }
      } else {
        // 进行中，更新进度
        updateStoryboard(script.id, episode.id, storyboard.id, {
          progress: progress || '0',
        });
      }
    } catch (error) {
      console.error('查询分镜状态失败:', error);
    }
  }, [script, episode.id, updateStoryboard]);

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

    // 立即查询一次
    pollStoryboardStatus(storyboard);

    // 每10秒轮询一次
    const timer = setInterval(() => {
      const currentStoryboard = episode.storyboards.find(sb => sb.id === storyboard.id);
      // 检查 taskId 是否匹配，如果不匹配说明已经重新生成了，停止当前轮询
      if (!currentStoryboard || currentStoryboard.taskId !== currentTaskId) {
        clearInterval(timer);
        pollingTimersRef.current.delete(storyboard.id);
        return;
      }
      if (currentStoryboard.taskId) {
        pollStoryboardStatus(currentStoryboard);
      }
    }, 10000);

    pollingTimersRef.current.set(storyboard.id, timer);
  }, [episode.storyboards, pollStoryboardStatus]);

  // 组件挂载时，恢复生成中的分镜轮询
  useEffect(() => {
    episode.storyboards.forEach((storyboard) => {
      if (storyboard.status === 'generating' && storyboard.taskId) {
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

  const handleUpdateDescription = (storyboardId: string, description: string) => {
    if (!script) return;
    updateStoryboard(script.id, episode.id, storyboardId, { description });
  };

  const handleDeleteStoryboard = (storyboardId: string) => {
    if (!script) return;
    deleteStoryboard(script.id, episode.id, storyboardId);
  };

  const handleUpdateCharacters = (storyboardId: string, characterIds: string[]) => {
    if (!script) return;
    updateStoryboard(script.id, episode.id, storyboardId, { characterIds });
  };

  const handleRemoveCharacter = (storyboardId: string, characterId: string) => {
    if (!script) return;
    const storyboard = episode.storyboards.find((sb) => sb.id === storyboardId);
    if (!storyboard) return;
    updateStoryboard(script.id, episode.id, storyboardId, {
      characterIds: storyboard.characterIds.filter((id) => id !== characterId),
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

      const response = await generateStoryboardVideo({
        prompt: finalPrompt,
        aspect_ratio: storyboard.aspectRatio || '9:16',
        duration: storyboard.duration || '15',
      });

      if (response.success && response.data.task_id) {
        // 保存 taskId 并开始轮询
        updateStoryboard(script.id, episode.id, storyboardId, {
          taskId: response.data.task_id,
        });
        
        // 获取更新后的 storyboard
        const updatedStoryboard = {
          ...storyboard,
          taskId: response.data.task_id,
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

  if (!script) return null;

  const currentCharacterStoryboard = characterModalStoryboardId
    ? episode.storyboards.find((sb) => sb.id === characterModalStoryboardId)
    : null;

  const currentScriptStoryboard = scriptModalStoryboardId
    ? episode.storyboards.find((sb) => sb.id === scriptModalStoryboardId)
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
            const selectedCharacters = storyboard.characterIds
              .map((id) => script.characters.find((c) => c.id === id))
              .filter(Boolean);

            return (
              <div
                key={storyboard.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
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

                  {/* 生成中遮罩 */}
                  {storyboard.status === 'generating' && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 size={24} className="animate-spin mx-auto mb-1" />
                        <span className="text-xs">生成中 {storyboard.progress ? `${storyboard.progress.replace('%', '')}%` : '...'}</span>
                      </div>
                    </div>
                  )}

                  {/* 序号 */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium">
                    #{index + 1}
                  </div>

                  {/* 右上角按钮组 */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      onClick={() => setSettingsModalStoryboardId(storyboard.id)}
                      className="p-1.5 rounded-md bg-black/40 text-white/80 hover:bg-purple-500 hover:text-white transition-colors"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteStoryboard(storyboard.id)}
                      className="p-1.5 rounded-md bg-black/40 text-white/80 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 内容区 */}
                <div className="p-2.5">
                  {/* 描述 - 固定高度确保对齐 */}
                  <p
                    className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors leading-relaxed h-[40px] overflow-hidden"
                    onClick={() => setScriptModalStoryboardId(storyboard.id)}
                  >
                    {storyboard.description || '点击编辑分镜脚本...'}
                  </p>

                  {/* 角色标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                    {selectedCharacters.length === 0 ? (
                      <span className="text-xs text-gray-400">暂无角色</span>
                    ) : (
                      selectedCharacters.map((char) => char && (
                        <span
                          key={char.id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-md text-xs"
                        >
                          {(char.profilePictureUrl || char.thumbnailUrl) && (
                            <img
                              src={char.profilePictureUrl || char.thumbnailUrl}
                              alt={char.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          )}
                          {char.name}
                          <button
                            onClick={() => handleRemoveCharacter(storyboard.id, char.id)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setScriptModalStoryboardId(storyboard.id)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors"
                    >
                      <FileText size={12} />
                      脚本
                    </button>

                    <button
                      onClick={() => setCharacterModalStoryboardId(storyboard.id)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors"
                    >
                      <Users size={12} />
                      角色
                    </button>

                    {storyboard.status === 'generating' ? (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg opacity-50 cursor-not-allowed"
                      >
                        <Loader2 size={12} className="animate-spin" />
                        生成中
                      </button>
                    ) : storyboard.status === 'completed' ? (
                      <button
                        onClick={() => handleGenerateVideo(storyboard.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
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

      {/* 角色选择弹框 */}
      {characterModalStoryboardId && currentCharacterStoryboard && (
        <CharacterSelectModal
          characters={script.characters}
          selectedIds={currentCharacterStoryboard.characterIds}
          onConfirm={(ids) => handleUpdateCharacters(characterModalStoryboardId, ids)}
          onClose={() => setCharacterModalStoryboardId(null)}
        />
      )}

      {/* 脚本编辑弹框 */}
      {scriptModalStoryboardId && currentScriptStoryboard && (
        <StoryboardScriptModal
          description={currentScriptStoryboard.description}
          onSave={(desc) => handleUpdateDescription(scriptModalStoryboardId, desc)}
          onClose={() => setScriptModalStoryboardId(null)}
        />
      )}

      {/* 视频设置弹框 */}
      {settingsModalStoryboardId && (() => {
        const storyboard = episode.storyboards.find(sb => sb.id === settingsModalStoryboardId);
        if (!storyboard) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  视频设置
                </h3>
                <button
                  onClick={() => setSettingsModalStoryboardId(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 比例选择 */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  视频比例
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!script) return;
                      updateStoryboard(script.id, episode.id, storyboard.id, { aspectRatio: '9:16' });
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-xl border-2 transition-colors flex flex-col items-center justify-center gap-1',
                      (storyboard.aspectRatio || '9:16') === '9:16'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                    )}
                  >
                    <div className="h-10 flex items-center justify-center">
                      <div className="w-6 h-10 border-2 border-current rounded" />
                    </div>
                    <span className="text-xs font-medium">9:16</span>
                    <span className="text-xs text-gray-400">竖屏</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!script) return;
                      updateStoryboard(script.id, episode.id, storyboard.id, { aspectRatio: '16:9' });
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-xl border-2 transition-colors flex flex-col items-center justify-center gap-1',
                      storyboard.aspectRatio === '16:9'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                    )}
                  >
                    <div className="h-10 flex items-center justify-center">
                      <div className="w-10 h-6 border-2 border-current rounded" />
                    </div>
                    <span className="text-xs font-medium">16:9</span>
                    <span className="text-xs text-gray-400">横屏</span>
                  </button>
                </div>
              </div>

              {/* 时长选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  视频时长
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!script) return;
                      updateStoryboard(script.id, episode.id, storyboard.id, { duration: '10' });
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-xl border-2 transition-colors text-center',
                      storyboard.duration === '10'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                    )}
                  >
                    <span className="text-lg font-bold">10</span>
                    <span className="text-xs ml-1">秒</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!script) return;
                      updateStoryboard(script.id, episode.id, storyboard.id, { duration: '15' });
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-xl border-2 transition-colors text-center',
                      (storyboard.duration || '15') === '15'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                    )}
                  >
                    <span className="text-lg font-bold">15</span>
                    <span className="text-xs ml-1">秒</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSettingsModalStoryboardId(null)}
                className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-xl transition-colors"
              >
                完成
              </button>
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
