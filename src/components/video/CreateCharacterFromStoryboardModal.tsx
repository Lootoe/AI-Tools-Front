import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Loader2, User, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createSora2Character } from '@/services/api';
import { useVideoStore } from '@/stores/videoStore';

interface CreateCharacterFromStoryboardModalProps {
    videoUrl: string;
    taskId?: string;
    storyboardIndex: number;
    onClose: () => void;
}

export const CreateCharacterFromStoryboardModal: React.FC<CreateCharacterFromStoryboardModalProps> = ({
    videoUrl,
    taskId,
    storyboardIndex,
    onClose,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('0');
    const [endTime, setEndTime] = useState('3');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { getCurrentScript, addCharacter, refreshScript } = useVideoStore();
    const script = getCurrentScript();

    // 获取视频时长
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            const duration = video.duration;
            setVideoDuration(duration);
            // 如果默认的结束时间超过视频时长，调整为视频时长（但不超过3秒）
            if (parseFloat(endTime) > duration) {
                setEndTime(Math.min(duration, 3).toFixed(1));
            }
        };

        if (video.readyState >= 1) {
            // 视频元数据已加载
            handleLoadedMetadata();
        } else {
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [videoUrl]);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('请输入角色名称');
            return;
        }

        const start = parseFloat(startTime);
        const end = parseFloat(endTime);

        // 验证时间区间
        if (isNaN(start) || isNaN(end)) {
            setError('请输入有效的时间');
            return;
        }

        if (start < 0 || end < 0) {
            setError('时间不能为负数');
            return;
        }

        if (start >= end) {
            setError('结束时间必须大于开始时间');
            return;
        }

        const duration = end - start;
        if (duration < 1) {
            setError('时间区间至少为1秒');
            return;
        }

        if (duration > 3) {
            setError('时间区间最多为3秒');
            return;
        }

        // 验证时间不超过视频长度
        if (videoDuration !== null) {
            if (end > videoDuration) {
                setError(`结束时间不能超过视频长度（${videoDuration.toFixed(1)}秒）`);
                return;
            }
        }

        if (!script) {
            setError('未找到当前剧本');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            // 1. 先通过后端API在数据库中创建角色
            const characterId = await addCharacter(script.id, {
                name: name.trim(),
                description: description.trim(),
            });

            // 2. 调用 API 创建 Sora2 角色
            const timestamps = `${Math.floor(start)},${Math.ceil(end)}`;
            const requestData: {
                characterId: string;
                timestamps: string;
                from_task?: string;
                url?: string;
            } = {
                characterId,
                timestamps,
            };

            // 优先使用 taskId，否则使用 videoUrl
            if (taskId) {
                requestData.from_task = taskId;
            } else {
                requestData.url = videoUrl;
            }

            await createSora2Character(requestData);

            // 3. 刷新剧本数据以获取最新的角色信息
            await refreshScript(script.id);

            onClose();
        } catch (err) {
            console.error('创建角色失败:', err);
            setError(err instanceof Error ? err.message : '创建角色失败，请重试');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        从分镜视频创建角色
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 内容区域 */}
                <div className="flex">
                    {/* 左侧 - 视频预览 */}
                    <div className="w-80 p-6 border-r border-gray-100 dark:border-gray-700">
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                分镜视频预览
                            </label>
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    className="w-full h-full object-cover"
                                    controls
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    分镜 #{storyboardIndex + 1}
                                </p>
                                {videoDuration !== null && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Clock size={12} />
                                        <span>{videoDuration.toFixed(1)}秒</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 时间区间设置 */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent"></div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    时间区间
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent"></div>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        开始时间（秒）
                                    </label>
                                    <Input
                                        type="number"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        max={videoDuration !== null ? videoDuration : undefined}
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        结束时间（秒）
                                    </label>
                                    <Input
                                        type="number"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        placeholder="3"
                                        min="0"
                                        max={videoDuration !== null ? videoDuration : undefined}
                                        step="0.1"
                                    />
                                </div>
                            </div>

                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {videoDuration !== null
                                        ? `时间区间：1-3秒，不超过视频长度（${videoDuration.toFixed(1)}秒）`
                                        : '时间区间：1-3秒'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 右侧 - 角色信息 */}
                    <div className="flex-1 p-6 flex flex-col">
                        {/* 角色头像占位 */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden shadow-lg">
                                <User size={40} className="text-purple-300 dark:text-purple-600" />
                            </div>
                            <div className="mt-3 text-center">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                    {name || '未命名角色'}
                                </span>
                            </div>
                        </div>

                        {/* 角色名称 */}
                        <div className="mb-4">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
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
                        <div className="flex-1 flex flex-col mb-4">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                角色描述
                            </label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="描述角色的外貌、服装、特征等..."
                                className="flex-1 min-h-[120px] resize-none"
                            />
                        </div>

                        {/* 警告提示 */}
                        <div className="flex items-start gap-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg mb-4">
                            <AlertCircle size={14} className="text-yellow-500 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                                将从指定时间区间提取角色形象，请确保该时间段内角色清晰可见
                            </span>
                        </div>

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg mb-4">
                                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 底部操作 */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isCreating}
                        className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!name.trim() || isCreating}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                创建中...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                创建角色
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
