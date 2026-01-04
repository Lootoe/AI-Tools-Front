import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Play, Loader2, RefreshCw, User, ImagePlus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Character } from '@/types/video';
import { generateSora2Video, getVideoStatus, uploadImage, createSora2Character } from '@/services/api';
import { useVideoStore } from '@/stores/videoStore';

// 高级设置类型
interface AdvancedSettings {
  duration: '10' | '15';
  referenceImage: string | null;
}

// 时长选项
const DURATION_OPTIONS = [
  { value: '10', label: '10秒' },
  { value: '15', label: '15秒' },
] as const;

// 轮询间隔（毫秒）
const POLL_INTERVAL = 7000;

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
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  
  // 获取 store 方法，用于在后台更新角色状态
  const { getCurrentScript } = useVideoStore();
  const script = getCurrentScript();
  
  // 高级设置
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    duration: '10',
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
        case 'SUCCESS': {
          clearPolling();
          const newVideoUrl = data?.output;
          setVideoUrl(newVideoUrl);
          setIsGenerating(false);
          setProgress(0);
          
          if (isEditing && onUpdate && newVideoUrl) {
            onUpdate({
              videoUrl: newVideoUrl,
              status: 'completed',
              // 保留 taskId，后续创建角色时需要使用
            });
          }
          break;
        }

        case 'FAILURE':
          // 任务失败，立即停止轮询
          clearPolling();
          setIsGenerating(false);
          setProgress(0);
          setError(fail_reason || '视频生成失败，请重试');
          
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
      // 接口请求失败（网络问题等），任务可能还在运行，继续轮询
      console.error('轮询任务状态失败:', err);
      // 不清除轮询，继续尝试
      pollTimerRef.current = window.setTimeout(() => {
        pollTaskStatus(taskId);
      }, POLL_INTERVAL);
    }
  }, [clearPolling, isEditing, onUpdate]);

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  // 使用 ref 跟踪已初始化的 character id，防止重复初始化轮询
  const initializedCharacterIdRef = useRef<string | null>(null);

  // 初始化角色数据（仅在 character.id 变化时执行）
  useEffect(() => {
    if (character) {
      setName(character.name);
      setDescription(character.description);
      setVideoUrl(character.videoUrl);
      setThumbnailUrl(character.profilePictureUrl || character.thumbnailUrl);
      
      if (character.taskId) {
        taskIdRef.current = character.taskId;
      }
      
      if (character.isCreatingCharacter) {
        setIsCreatingCharacter(true);
      }
    }
  }, [character?.id]);

  // 单独处理轮询逻辑，防止重复启动定时器
  useEffect(() => {
    // 如果是同一个角色且已经初始化过轮询，不重复启动
    if (character?.id === initializedCharacterIdRef.current) {
      return;
    }
    
    // 先清理之前的轮询
    clearPolling();
    
    if (character && character.taskId && character.status === 'generating') {
      // 标记当前角色已初始化轮询
      initializedCharacterIdRef.current = character.id;
      setIsGenerating(true);
      setProgress(0);
      pollTaskStatus(character.taskId);
    } else if (!character) {
      // 新建角色时重置
      initializedCharacterIdRef.current = null;
    }
  }, [character?.id, character?.taskId, character?.status, clearPolling, pollTaskStatus]);

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
    
    clearPolling();
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    
    // 清空旧的视频数据
    setVideoUrl(undefined);
    setThumbnailUrl(undefined);

    try {
      const response = await generateSora2Video({
        prompt: description.trim(),
        model: 'sora-2',
        aspect_ratio: '9:16', // 固定使用竖屏
        duration: advancedSettings.duration,
        private: true,
        reference_image: advancedSettings.referenceImage || undefined,
      });

      if (response.success && response.data?.task_id) {
        const taskId = response.data.task_id;
        taskIdRef.current = taskId;
        setProgress(0);
        
        if (isEditing && onUpdate) {
          // 清空旧的角色认证信息和视频数据
          onUpdate({
            status: 'generating',
            taskId: taskId,
            videoUrl: undefined,
            thumbnailUrl: undefined,
            characterId: undefined,
            username: undefined,
            permalink: undefined,
            profilePictureUrl: undefined,
          });
        }
        
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

  // 确认形象 - 创建 Sora2 角色
  const handleConfirmCharacter = async () => {
    // 优先使用 taskId，如果没有则使用 videoUrl
    if (!taskIdRef.current && !videoUrl) {
      setError('请先生成角色视频');
      return;
    }
    
    // 需要有 script 和 character 才能更新
    if (!script || !character) {
      setError('角色信息不完整');
      return;
    }

    setIsCreatingCharacter(true);
    setError(null);

    try {
      // 从视频中提取角色（使用视频的1-3秒）
      const requestData: { characterId: string; timestamps: string; from_task?: string; url?: string } = {
        characterId: character.id, // 传入数据库角色ID
        timestamps: '1,3',
      };

      // 优先使用 from_task，如果没有则使用 url
      if (taskIdRef.current) {
        requestData.from_task = taskIdRef.current;
      } else if (videoUrl) {
        requestData.url = videoUrl;
      }

      // 调用后端接口，后端会自动更新数据库
      const response = await createSora2Character(requestData);

      if (response.success && response.data) {
        // 后端已更新数据库，刷新前端 store 数据
        await useVideoStore.getState().refreshScript(script.id);
        
        // 更新本地状态（如果弹框还开着）
        setThumbnailUrl(response.data.profilePictureUrl);
      } else {
        throw new Error('创建角色失败');
      }
    } catch (err) {
      console.error('创建角色失败:', err);
      setError(err instanceof Error ? err.message : '创建角色失败，请重试');
    } finally {
      setIsCreatingCharacter(false);
    }
  };

  // 获取角色头像（从视频截图或缩略图）
  const avatarUrl = thumbnailUrl || (videoUrl ? undefined : undefined);

  // 处理关闭 - 直接关闭，不影响后台请求
  const handleClose = () => {
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {isEditing ? '编辑角色' : '新建角色'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区域 - 左右两栏 */}
        <div className="flex">
          {/* 左侧 - 视频预览 + 生成设置 + 生成按钮 */}
          <div className="w-80 p-6 border-r border-gray-100 dark:border-gray-700">
            {/* 视频预览区域 - 固定高度容器 */}
            <div className="h-64 flex items-center justify-center mb-5">
              <div 
                className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 w-36 h-64"
              >
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20">
                    {/* 圆形进度 */}
                    <div className="relative w-24 h-24 mb-4">
                      {/* 进度圆环 */}
                      <svg className="w-full h-full -rotate-90">
                        {/* 背景圆 */}
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-gray-200/50 dark:text-gray-700/50"
                        />
                        {/* 进度圆 */}
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          fill="none"
                          stroke="url(#progressGradient)"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                          className="transition-all duration-500 ease-out"
                        />
                        <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="50%" stopColor="#EC4899" />
                            <stop offset="100%" stopColor="#3B82F6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* 中心内容 */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    
                    {/* 文字提示 */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">生成中</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">预计 1-3 分钟</span>
                    </div>
                    
                    {/* 底部装饰点 */}
                    <div className="flex gap-1.5 mt-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    poster={thumbnailUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <Play size={40} className="mb-2 opacity-30" />
                    <span className="text-xs">视频预览</span>
                  </div>
                )}
              </div>
            </div>

            {/* 生成设置 */}
            <div className="space-y-3.5">
              {/* 标题 */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent"></div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  生成设置
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent"></div>
              </div>
              
              {/* 时长和尺寸 */}
              <div className="space-y-3">
                {/* 时长 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    视频时长
                  </label>
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAdvancedSettings(prev => ({ ...prev, duration: option.value }))}
                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                          advancedSettings.duration === option.value
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 参考图 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  参考图片
                </label>
                <div className="flex items-center gap-2.5">
                  {advancedSettings.referenceImage ? (
                    <div className="relative group">
                      <img
                        src={advancedSettings.referenceImage}
                        alt="参考图"
                        className="w-14 h-14 object-cover rounded-lg border-2 border-purple-200 dark:border-purple-800 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveReferenceImage}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-md"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-14 h-14 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReferenceImageUpload}
                        className="hidden"
                        disabled={isUploadingRef}
                      />
                      {isUploadingRef ? (
                        <Loader2 size={16} className="text-purple-500 animate-spin" />
                      ) : (
                        <ImagePlus size={16} className="text-gray-400" />
                      )}
                    </label>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    可选，上传参考图让生成效果更精准
                  </span>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* 按钮组 */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim() || isGenerating || isCreatingCharacter}
                  variant={videoUrl ? 'outline' : 'default'}
                  size="sm"
                  className="flex-1"
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
                
                {/* 确认形象按钮 - 根据状态显示不同按钮 */}
                {character?.characterId ? (
                  // 已认证
                  <Button
                    size="sm"
                    disabled
                    className="flex-1 bg-green-500 text-white shadow-lg cursor-not-allowed"
                  >
                    <CheckCircle size={14} className="mr-1.5" />
                    已认证
                  </Button>
                ) : !videoUrl || isGenerating ? (
                  // 未生成视频或生成中 - 显示待确认（灰色禁用）
                  <Button
                    size="sm"
                    disabled
                    className="flex-1 bg-gray-400 text-white shadow-lg cursor-not-allowed"
                  >
                    <Save size={14} className="mr-1.5" />
                    待确认
                  </Button>
                ) : (
                  // 视频已生成 - 显示确认形象（可点击）
                  <Button
                    onClick={handleConfirmCharacter}
                    size="sm"
                    disabled={isCreatingCharacter}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingCharacter ? (
                      <>
                        创建中
                        <Loader2 size={14} className="ml-1.5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <Save size={14} className="mr-1.5" />
                        注册角色
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 右侧 - 角色头像 + 名称 + 描述 */}
          <div className="flex-1 p-6 flex flex-col">
            {/* 角色头像 */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden shadow-lg">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name || '角色头像'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-purple-300 dark:text-purple-600" />
                  )}
                </div>
                {/* 认证标识 - 仅在已确认形象时显示 */}
                {character?.characterId && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-md">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              {/* 角色名称预览 */}
              <div className="mt-3 text-center">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {name || '未命名角色'}
                </span>
              </div>
            </div>

            {/* 角色名称输入 */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                角色名称 <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="给角色起个名字"
              />
            </div>

            {/* 角色描述 */}
            <div className="flex-1 flex flex-col">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                角色描述
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述角色的外貌、服装、动作等特征，用于生成角色视频..."
                className="flex-1 min-h-[160px] resize-none mb-2"
              />
              
              {/* Sora2 用户名 - 在描述下方显示 */}
              {character?.username && (
                <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Sora2 用户名：
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 ml-1">
                    {character.username}
                  </span>
                </div>
              )}
              
              {/* 警告提示 - 仅在未确认形象时显示 */}
              {!character?.characterId && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <AlertCircle size={14} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                    角色未注册，无法确保后续视频角色一致
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save size={16} className="mr-2" />
            保存角色
          </Button>
        </div>
      </div>
    </div>
  );
};
