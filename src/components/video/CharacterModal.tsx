import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Play, Loader2, RefreshCw, User, Settings2, ImagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Character } from '@/types/video';
import { generateSora2Video, getVideoStatus, uploadImage } from '@/services/api';

// 高级设置类型
interface AdvancedSettings {
  duration: '10' | '15';
  aspectRatio: '16:9' | '9:16';
  referenceImage: string | null;
}

// 尺寸选项
const ASPECT_RATIO_OPTIONS = [
  { value: '9:16', label: '竖屏 9:16', desc: '720×1280' },
  { value: '16:9', label: '横屏 16:9', desc: '1280×720' },
] as const;

// 时长选项
const DURATION_OPTIONS = [
  { value: '10', label: '10s' },
  { value: '15', label: '15s' },
] as const;

// 轮询间隔（毫秒）
const POLL_INTERVAL = 3000;

interface CharacterModalProps {
  character?: Character;
  onSave: (name: string, description: string) => void;
  onUpdate?: (updates: Partial<Character>) => void;
  onClose: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({ 
  character, 
  onSave, 
  onUpdate,
  onClose 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  
  // 高级设置
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    duration: '10',
    aspectRatio: '9:16',
    referenceImage: null,
  });
  const [isUploadingRef, setIsUploadingRef] = useState(false);

  // 轮询相关
  const pollTimerRef = useRef<number | null>(null);
  const taskIdRef = useRef<string | null>(null);

  const isEditing = !!character;

  // 清理轮询
  const clearPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      const response = await getVideoStatus(taskId);
      
      if (!response.success || !response.data) {
        throw new Error('查询状态失败');
      }

      const { status, fail_reason, progress: taskProgress, data } = response.data;
      
      // 更新进度（progress 是 1-100 的数字）
      if (taskProgress !== undefined && taskProgress !== null) {
        const progressNum = typeof taskProgress === 'string' ? parseInt(taskProgress, 10) : taskProgress;
        setProgress(isNaN(progressNum) ? 0 : progressNum);
      }

      switch (status) {
        case 'SUCCESS':
          // 生成成功
          clearPolling();
          const newVideoUrl = data?.output;
          setVideoUrl(newVideoUrl);
          setIsGenerating(false);
          setProgress(0);
          
          // 更新角色数据，清除 taskId
          if (isEditing && onUpdate && newVideoUrl) {
            onUpdate({
              videoUrl: newVideoUrl,
              status: 'completed',
              taskId: undefined,
            });
          }
          break;

        case 'FAILURE':
          // 生成失败
          clearPolling();
          setIsGenerating(false);
          setProgress(0);
          setError(fail_reason || '视频生成失败，请重试');
          
          // 更新角色状态，清除 taskId
          if (isEditing && onUpdate) {
            onUpdate({
              status: 'failed',
              taskId: undefined,
            });
          }
          break;

        case 'NOT_START':
        case 'IN_PROGRESS':
        default:
          // 继续轮询
          pollTimerRef.current = window.setTimeout(() => {
            pollTaskStatus(taskId);
          }, POLL_INTERVAL);
          break;
      }
    } catch (err) {
      console.error('轮询任务状态失败:', err);
      // 出错时继续轮询，但不要无限重试
      pollTimerRef.current = window.setTimeout(() => {
        pollTaskStatus(taskId);
      }, POLL_INTERVAL);
    }
  }, [clearPolling, isEditing, onUpdate]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  useEffect(() => {
    if (character) {
      setName(character.name);
      setDescription(character.description);
      setVideoUrl(character.videoUrl);
      setThumbnailUrl(character.thumbnailUrl);
      
      // 如果有 taskId 且状态是 generating，恢复轮询
      if (character.taskId && character.status === 'generating') {
        taskIdRef.current = character.taskId;
        setIsGenerating(true);
        setProgress(0);
        // 立即开始轮询
        pollTaskStatus(character.taskId);
      }
    }
  }, [character, pollTaskStatus]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (isEditing && onUpdate) {
      onUpdate({ name: name.trim(), description: description.trim() });
    } else {
      onSave(name.trim(), description.trim());
    }
    onClose();
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    // 清理之前的轮询
    clearPolling();
    
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const response = await generateSora2Video({
        prompt: description.trim(),
        model: 'sora-2',
        aspect_ratio: advancedSettings.aspectRatio,
        duration: advancedSettings.duration,
        private: true,
        reference_image: advancedSettings.referenceImage || undefined,
      });

      if (response.success && response.data?.task_id) {
        // 保存 taskId 并开始轮询
        const taskId = response.data.task_id;
        taskIdRef.current = taskId;
        setProgress(0);
        
        // 更新角色状态和 taskId
        if (isEditing && onUpdate) {
          onUpdate({
            status: 'generating',
            taskId: taskId,
          });
        }
        
        // 开始轮询任务状态
        pollTimerRef.current = window.setTimeout(() => {
          pollTaskStatus(taskId);
        }, POLL_INTERVAL);
      } else {
        throw new Error('未获取到任务ID');
      }
    } catch (err) {
      console.error('Sora2 生成失败:', err);
      setError(err instanceof Error ? err.message : '生成失败，请重试');
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRef(true);
    try {
      const result = await uploadImage(file);
      if (result.success && result.url) {
        setAdvancedSettings(prev => ({ ...prev, referenceImage: result.url }));
      }
    } catch (err) {
      console.error('上传参考图失败:', err);
      setError('上传参考图失败');
    } finally {
      setIsUploadingRef(false);
    }
  };

  const handleRemoveReferenceImage = () => {
    setAdvancedSettings(prev => ({ ...prev, referenceImage: null }));
  };

  // 根据选择的比例计算预览区域样式
  const isVertical = advancedSettings.aspectRatio === '9:16';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {isEditing ? '编辑角色' : '新建角色'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* 左侧 - 表单 */}
            <div className="flex-1 space-y-4">
              {/* 角色名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  角色名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="给角色起个名字"
                  autoFocus
                />
              </div>

              {/* 角色描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  角色描述
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述角色的外貌、服装、动作等特征..."
                  className="h-24 resize-none"
                />
              </div>

              {/* 高级设置 - 平铺展示 */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Settings2 size={14} />
                  <span>生成设置</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* 时长 */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">时长</label>
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                      {DURATION_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAdvancedSettings(prev => ({ ...prev, duration: option.value }))}
                          className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                            advancedSettings.duration === option.value
                              ? 'bg-purple-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 尺寸 */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">尺寸</label>
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                      {ASPECT_RATIO_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAdvancedSettings(prev => ({ ...prev, aspectRatio: option.value }))}
                          className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                            advancedSettings.aspectRatio === option.value
                              ? 'bg-purple-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 参考图 */}
                <div className="mt-4">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">参考图（可选）</label>
                  <div className="flex items-start gap-3">
                    {advancedSettings.referenceImage ? (
                      <div className="relative group">
                        <img
                          src={advancedSettings.referenceImage}
                          alt="参考图"
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveReferenceImage}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceImageUpload}
                          className="hidden"
                          disabled={isUploadingRef}
                        />
                        {isUploadingRef ? (
                          <Loader2 size={18} className="text-purple-500 animate-spin" />
                        ) : (
                          <ImagePlus size={18} className="text-gray-400" />
                        )}
                      </label>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                      上传参考图让生成效果更精准
                    </span>
                  </div>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* 右侧 - 预览区域 */}
            <div className="flex flex-col items-center">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 self-start">预览</label>
              <div 
                className={`relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center ${
                  isVertical ? 'w-36 h-64' : 'w-64 h-36'
                }`}
              >
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center text-center p-4 w-full">
                    {/* 圆形进度 */}
                    <div className="relative w-20 h-20 mb-3">
                      {/* 背景圆环 */}
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-gray-200 dark:text-gray-600"
                        />
                        {/* 进度圆环 */}
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          stroke="url(#progressGradient)"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 36}`}
                          strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                          className="transition-all duration-300 ease-out"
                        />
                        <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* 中心百分比 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">生成中</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">约1-3分钟</span>
                  </div>
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    poster={thumbnailUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={name || '角色预览'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <User size={32} className="mb-1 opacity-50" />
                    <span className="text-xs">等待生成</span>
                  </div>
                )}
              </div>

              {/* 生成/重新生成按钮 */}
              <Button
                onClick={handleGenerate}
                disabled={!description.trim() || isGenerating}
                variant={videoUrl ? 'outline' : 'default'}
                size="sm"
                className="mt-3 w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    生成中
                  </>
                ) : videoUrl ? (
                  <>
                    <RefreshCw size={14} className="mr-1.5" />
                    重新生成
                  </>
                ) : (
                  <>
                    <Play size={14} className="mr-1.5" />
                    生成视频
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save size={14} className="mr-1.5" />
            保存角色
          </Button>
        </div>
      </div>
    </div>
  );
};
