import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Download } from 'lucide-react';
import { downloadBlob } from '@/utils/videoCapture';
import { Button } from '@/components/ui/Button';

interface FrameCaptureModalProps {
  videoUrl: string;
  storyboardIndex: number;
  onClose: () => void;
}

export const FrameCaptureModal: React.FC<FrameCaptureModalProps> = ({
  videoUrl,
  storyboardIndex,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const getProxiedUrl = (url: string) => {
    const ossPattern = /^https:\/\/mycdn-gg\.oss-us-west-1\.aliyuncs\.com\//;
    if (ossPattern.test(url)) {
      return url.replace(ossPattern, '/oss-video/');
    }
    return url;
  };

  const proxiedVideoUrl = getProxiedUrl(videoUrl);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsCapturing(true);
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建 Canvas 上下文');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/png');
      setCapturedFrame(dataUrl);
    } catch (error) {
      console.error('截取失败:', error);
      alert('截取失败，请重试');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = () => {
    if (!capturedFrame) return;

    fetch(capturedFrame)
      .then(res => res.blob())
      .then(blob => {
        const filename = `分镜_${storyboardIndex + 1}_${currentTime.toFixed(2)}s`;
        downloadBlob(blob, `${filename}.png`);
      })
      .catch(error => {
        console.error('下载失败:', error);
        alert('下载失败，请重试');
      });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = parseFloat(e.target.value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        className="rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ 
          backgroundColor: 'rgba(15, 15, 25, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)'
        }}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(60, 60, 80, 0.5)' }}
        >
          <h2 className="text-lg font-bold text-white">
            截取关键帧 - 分镜 #{storyboardIndex + 1}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.backgroundColor = 'rgba(60, 60, 80, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 左侧：视频预览 */}
            <div className="space-y-4">
              <div 
                className="rounded-xl overflow-hidden aspect-video"
                style={{ backgroundColor: '#0a0a12' }}
              >
                <video
                  ref={videoRef}
                  src={proxiedVideoUrl}
                  className="w-full h-full object-contain"
                  controls
                  crossOrigin="anonymous"
                />
              </div>

              {/* 时间轴控制 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#9ca3af' }}>
                    当前时间: {formatTime(currentTime)}
                  </span>
                  <span style={{ color: '#9ca3af' }}>
                    总时长: {formatTime(duration)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ 
                    backgroundColor: 'rgba(60, 60, 80, 0.5)',
                    accentColor: '#8b5cf6'
                  }}
                />
              </div>

              {/* 截取按钮 */}
              <Button
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full"
              >
                <Camera size={16} className="mr-2" />
                {isCapturing ? '截取中...' : '截取当前帧'}
              </Button>
            </div>

            {/* 右侧：截取预览 */}
            <div className="space-y-4">
              <div 
                className="rounded-xl overflow-hidden aspect-video flex items-center justify-center"
                style={{ backgroundColor: 'rgba(10, 10, 20, 0.8)' }}
              >
                {capturedFrame ? (
                  <img
                    src={capturedFrame}
                    alt="截取的帧"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center" style={{ color: '#6b7280' }}>
                    <Camera size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">点击左侧按钮截取关键帧</p>
                  </div>
                )}
              </div>

              {/* 下载按钮 */}
              {capturedFrame && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full"
                >
                  <Download size={16} className="mr-2" />
                  下载图片
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 隐藏的 Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
