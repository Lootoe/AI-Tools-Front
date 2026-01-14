import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Camera,
  Download,
  Save,
  Repeat,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { captureVideoFrame } from '@/services/api';
import CoinIcon from '@/img/coin.webp';

interface CyberVideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  // 文件命名信息
  scriptName?: string;
  episodeNumber?: number;
  storyboardNumber?: number;
  // 保存功能
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  // API设置
  aspectRatio?: '9:16' | '16:9';
  onAspectRatioChange?: (ratio: '9:16' | '16:9') => void;
  duration?: '10' | '15';
  onDurationChange?: (duration: '10' | '15') => void;
  isProcessing?: boolean;
  processingProgress?: string;
  // 生成按钮
  onGenerate?: () => void;
  generateDisabled?: boolean;
  generateCost?: number;
}

export const CyberVideoPlayer: React.FC<CyberVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  scriptName,
  episodeNumber,
  storyboardNumber,
  onSave,
  hasUnsavedChanges = false,
  aspectRatio = '9:16',
  onAspectRatioChange,
  duration = '15',
  onDurationChange,
  isProcessing = false,
  processingProgress,
  onGenerate,
  generateDisabled = false,
  generateCost,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekingProgress, setSeekingProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);

  // 当 videoUrl 变化时，重置播放状态
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setVideoDuration(0);
    // 如果开启自动连播，自动播放新视频
    if (autoPlay && videoUrl) {
      const video = videoRef.current;
      if (video) {
        // 等待视频加载后自动播放
        const playWhenReady = () => {
          video.play().catch(() => {
            // 忽略自动播放失败（浏览器策略限制）
          });
        };
        video.addEventListener('loadeddata', playWhenReady, { once: true });
        return () => video.removeEventListener('loadeddata', playWhenReady);
      }
    }
  }, [videoUrl, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
    };
    const handleLoadedMetadata = () => setVideoDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // 自动连播：如果开启且有下一个分镜，自动切换
      if (autoPlay && hasNext && onNext) {
        onNext();
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleSeeking = () => setIsLoading(true);
    const handleSeeked = () => {
      setIsLoading(false);
      setIsSeeking(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [videoUrl, autoPlay, hasNext, onNext, isSeeking]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    // 状态由 play/pause 事件处理器更新，不在这里手动设置
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progress = progressRef.current;
    if (!video || !progress || !videoUrl || videoDuration <= 0) return;

    setIsSeeking(true);

    const updateProgress = (clientX: number) => {
      const rect = progress.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      // 立即更新UI显示的进度
      setSeekingProgress(pos * 100);
      setCurrentTime(pos * videoDuration);
    };

    const applySeek = (clientX: number) => {
      const rect = progress.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      video.currentTime = pos * videoDuration;
    };

    updateProgress(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateProgress(moveEvent.clientX);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      // 鼠标释放时才真正设置视频时间
      applySeek(upEvent.clientX);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 点击进度条直接跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progress = progressRef.current;
    if (!video || !progress || !videoUrl || videoDuration <= 0) return;

    const rect = progress.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(pos * videoDuration);
    video.currentTime = pos * videoDuration;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !videoUrl || isCapturing) return;

    setIsCapturing(true);
    const fileName = generateFileName('frame', 'png');

    try {
      // 使用后端 ffmpeg 截屏（直接下载文件流）
      await captureVideoFrame(videoUrl, currentTime, fileName);

      // 显示闪光效果
      setCaptureFlash(true);
      setTimeout(() => setCaptureFlash(false), 200);
    } catch (error) {
      console.error('截屏失败:', error);
      alert(error instanceof Error ? error.message : '截屏失败');
    } finally {
      setIsCapturing(false);
    }
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('下载失败');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const fileName = generateFileName('video', 'mp4');
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('下载视频失败:', error);
      alert('下载失败，请重试');
    }
  };

  const generateFileName = (type: 'frame' | 'video', extension: string): string => {
    // 如果有完整的命名信息，使用格式：剧本名-剧集序号-分镜序号
    if (scriptName && episodeNumber !== undefined && storyboardNumber !== undefined) {
      // 清理文件名中的特殊字符
      const cleanScriptName = scriptName.replace(/[<>:"/\\|?*]/g, '-');
      return `${cleanScriptName}-E${episodeNumber}-S${storyboardNumber}.${extension}`;
    }
    // 否则使用时间戳
    return `${type}-${Date.now()}.${extension}`;
  };

  const progress = videoDuration > 0 ? (isSeeking ? seekingProgress : (currentTime / videoDuration) * 100) : 0;

  const ratioOptions = [
    { value: '9:16', label: '竖屏 9:16' },
    { value: '16:9', label: '横屏 16:9' },
  ] as const;

  const durationOptions = [
    { value: '10', label: '10秒' },
    { value: '15', label: '15秒' },
  ] as const;

  return (
    <div
      className="relative flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#0a0a0f',
        border: '1px solid #1e1e2e',
        boxShadow: '0 0 30px rgba(0,245,255,0.1), inset 0 0 60px rgba(0,0,0,0.5)'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* 顶部标题栏 */}
      {title && (
        <div
          className="flex items-center justify-between px-3 py-2 flex-shrink-0"
          style={{
            borderBottom: '1px solid #1e1e2e',
            background:
              'linear-gradient(90deg, rgba(0,245,255,0.05), transparent, rgba(191,0,255,0.05))',
          }}
        >
          <span className="text-xs font-medium" style={{ color: '#00f5ff' }}>
            {title}
          </span>
          <div className="flex items-center gap-2">
            {/* 画面比例选择 */}
            {onAspectRatioChange && (
              <div className="relative">
                <button
                  onClick={() => !isProcessing && setIsRatioDropdownOpen(!isRatioDropdownOpen)}
                  disabled={isProcessing}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'rgba(77,124,255,0.1)',
                    border: '1px solid rgba(77,124,255,0.2)',
                    color: '#4d7cff',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  <span>{aspectRatio}</span>
                  <ChevronDown size={12} />
                </button>
                {isRatioDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsRatioDropdownOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden min-w-[100px]"
                      style={{
                        backgroundColor: 'rgba(18,18,26,0.98)',
                        border: '1px solid rgba(77,124,255,0.2)',
                      }}
                    >
                      {ratioOptions.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => {
                            onAspectRatioChange(r.value);
                            setIsRatioDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap"
                          style={{
                            color: aspectRatio === r.value ? '#4d7cff' : '#d1d5db',
                            backgroundColor: aspectRatio === r.value ? 'rgba(77,124,255,0.1)' : 'transparent',
                          }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 视频时长选择 */}
            {onDurationChange && (
              <div className="relative">
                <button
                  onClick={() => !isProcessing && setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                  disabled={isProcessing}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'rgba(255,0,255,0.1)',
                    border: '1px solid rgba(255,0,255,0.2)',
                    color: '#ff00ff',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  <span>{duration}秒</span>
                  <ChevronDown size={12} />
                </button>
                {isDurationDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDurationDropdownOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden min-w-[80px]"
                      style={{
                        backgroundColor: 'rgba(18,18,26,0.98)',
                        border: '1px solid rgba(255,0,255,0.2)',
                      }}
                    >
                      {durationOptions.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => {
                            onDurationChange(d.value);
                            setIsDurationDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap"
                          style={{
                            color: duration === d.value ? '#ff00ff' : '#d1d5db',
                            backgroundColor: duration === d.value ? 'rgba(255,0,255,0.1)' : 'transparent',
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {onSave && (
              <>
                {hasUnsavedChanges && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107' }}
                  >
                    未保存
                  </span>
                )}
                <button
                  onClick={onSave}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all"
                  style={{
                    backgroundColor: hasUnsavedChanges ? 'rgba(0,245,255,0.15)' : 'transparent',
                    border: hasUnsavedChanges
                      ? '1px solid rgba(0,245,255,0.5)'
                      : '1px solid rgba(107,114,128,0.3)',
                    color: hasUnsavedChanges ? '#00f5ff' : '#6b7280',
                    boxShadow: hasUnsavedChanges ? '0 0 10px rgba(0,245,255,0.2)' : 'none',
                  }}
                >
                  <Save size={12} />
                  保存
                </button>
              </>
            )}

            {/* 生成按钮 */}
            {onGenerate && (
              <button
                onClick={onGenerate}
                disabled={isProcessing || generateDisabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isProcessing || generateDisabled
                    ? 'rgba(191,0,255,0.1)'
                    : 'linear-gradient(135deg, rgba(191,0,255,0.2), rgba(255,0,255,0.2))',
                  border: '1px solid rgba(191,0,255,0.3)',
                  color: '#bf00ff',
                  opacity: isProcessing || generateDisabled ? 0.5 : 1,
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    生成
                    {generateCost !== undefined && (
                      <>（<img src={CoinIcon} alt="" className="w-3 h-3 inline" />{generateCost}）</>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 视频区域 */}
      <div className="relative flex-1 bg-black cyber-scanlines overflow-hidden">
        {/* 截屏闪光效果 */}
        {captureFlash && (
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
          />
        )}
        {/* 处理中状态 */}
        {isProcessing && !videoUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(191,0,255,0.1), rgba(255,0,255,0.1))',
                  border: '1px solid rgba(191,0,255,0.3)',
                  boxShadow: '0 0 30px rgba(191,0,255,0.2)'
                }}
              >
                <Loader2 size={40} className="animate-spin" style={{ color: '#bf00ff' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#bf00ff' }}>视频生成中...</p>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>进度: {processingProgress || '0'}%</p>
            </div>
          </div>
        ) : videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            poster={thumbnailUrl}
            onClick={togglePlay}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="预览" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
                    border: '1px solid rgba(0,245,255,0.3)'
                  }}
                >
                  <Play size={32} style={{ color: 'rgba(0,245,255,0.5)' }} />
                </div>
                <p className="text-sm" style={{ color: '#6b7280' }}>选择分镜预览视频</p>
              </div>
            )}
          </div>
        )}

        {/* 播放按钮覆盖层 */}
        {videoUrl && !isPlaying && !isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(191,0,255,0.2))',
                border: '2px solid rgba(0,245,255,0.5)',
                boxShadow: '0 0 30px rgba(0,245,255,0.3)'
              }}
            >
              <Play size={28} style={{ color: '#00f5ff' }} fill="rgba(0,245,255,0.3)" />
            </div>
          </div>
        )}

        {/* 加载中覆盖层 */}
        {videoUrl && isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(191,0,255,0.2))',
                border: '2px solid rgba(0,245,255,0.5)',
                boxShadow: '0 0 30px rgba(0,245,255,0.3)'
              }}
            >
              <Loader2 size={28} className="animate-spin" style={{ color: '#00f5ff' }} />
            </div>
          </div>
        )}

        {/* 左右切换按钮 */}
        {(hasPrevious || hasNext) && isHovering && (
          <>
            {hasPrevious && (
              <button
                onClick={onPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all"
                style={{
                  backgroundColor: 'rgba(10,10,15,0.8)',
                  border: '1px solid rgba(0,245,255,0.3)',
                  color: '#00f5ff'
                }}
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {hasNext && (
              <button
                onClick={onNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all"
                style={{
                  backgroundColor: 'rgba(10,10,15,0.8)',
                  border: '1px solid rgba(0,245,255,0.3)',
                  color: '#00f5ff'
                }}
              >
                <ChevronRight size={20} />
              </button>
            )}
          </>
        )}
      </div>

      {/* 进度条 */}
      <div
        ref={progressRef}
        className="h-1.5 cursor-pointer relative group"
        style={{ backgroundColor: 'rgba(30,30,46,0.8)' }}
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
      >
        {/* 播放进度 */}
        <div
          className="absolute inset-y-0 left-0 pointer-events-none transition-[width] duration-75"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #00f5ff, #bf00ff)',
            boxShadow: '0 0 10px rgba(0,245,255,0.5)'
          }}
        />
        {/* 进度指示器 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            left: `${progress}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#00f5ff',
            boxShadow: '0 0 10px #00f5ff'
          }}
        />
        {/* 加载指示器 */}
        {isLoading && (
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Loader2 size={12} className="animate-spin" style={{ color: '#00f5ff' }} />
          </div>
        )}
      </div>

      {/* 控制栏 */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: 'rgba(10,10,15,0.9)' }}
      >
        {/* 左侧控制 */}
        <div className="flex items-center gap-2">
          <button
            onClick={restart}
            className="p-1.5 rounded transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00f5ff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="p-1.5 rounded transition-colors disabled:opacity-30"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#00f5ff')}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={togglePlay}
            disabled={!videoUrl}
            className="p-2 rounded-full transition-all disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(191,0,255,0.2))',
              border: '1px solid rgba(0,245,255,0.3)',
              color: '#00f5ff'
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="p-1.5 rounded transition-colors disabled:opacity-30"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#00f5ff')}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            <SkipForward size={14} />
          </button>
          <span className="text-xs ml-2" style={{ color: '#6b7280' }}>
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </span>

          {/* 自动连播开关 */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="p-1.5 rounded transition-colors ml-1"
            style={{
              color: autoPlay ? '#00f5ff' : '#6b7280',
              backgroundColor: autoPlay ? 'rgba(0,245,255,0.1)' : 'transparent',
            }}
            title={autoPlay ? '关闭自动连播' : '开启自动连播'}
          >
            <Repeat size={14} />
          </button>
        </div>

        {/* 右侧控制 */}
        <div className="flex items-center gap-2">
          <button
            onClick={captureFrame}
            disabled={!videoUrl || isCapturing}
            className="p-1.5 rounded transition-colors disabled:opacity-30"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#00f5ff')}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            title="截取当前帧"
          >
            {isCapturing ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          </button>
          <button
            onClick={downloadVideo}
            disabled={!videoUrl}
            className="p-1.5 rounded transition-colors disabled:opacity-30"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#00f5ff')}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            title="下载视频"
          >
            <Download size={14} />
          </button>

          <div className="w-px h-4 mx-1" style={{ backgroundColor: '#1e1e2e' }} />

          <button
            onClick={toggleMute}
            className="p-1.5 rounded transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00f5ff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #00f5ff ${volume * 100}%, #1e1e2e ${volume * 100}%)`
            }}
          />
          <button
            onClick={handleFullscreen}
            disabled={!videoUrl}
            className="p-1.5 rounded transition-colors disabled:opacity-30"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#00f5ff')}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>

      {/* 底部霓虹边框 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #bf00ff, #00f5ff, #bf00ff, transparent)',
          opacity: 0.5
        }}
      />
    </div>
  );
};
