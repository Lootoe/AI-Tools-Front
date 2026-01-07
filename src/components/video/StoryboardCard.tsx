import React, { useState } from 'react';
import { Play, Loader2, RefreshCw, Trash2, Video, Settings, Camera } from 'lucide-react';
import { Storyboard } from '@/types/video';
import { FrameCaptureModal } from './FrameCaptureModal';

interface StoryboardCardProps {
  storyboard: Storyboard;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  isGenerateDisabled: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onSettings: (id: string) => void;
  onGenerate: (id: string) => void;
}

export const StoryboardCard: React.FC<StoryboardCardProps> = ({
  storyboard,
  index,
  isDragging,
  isDropTarget,
  isGenerateDisabled,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDelete,
  onSettings,
  onGenerate,
}) => {
  const isGenerating = storyboard.status === 'generating' || storyboard.status === 'queued';
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  const handleCaptureFrame = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCaptureModal(true);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden shadow-sm transition-all ${isDragging
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
        {isGenerating && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 size={24} className="animate-spin mx-auto mb-1" />
              <span className="text-xs">
                {storyboard.status === 'queued'
                  ? '排队中...'
                  : `生成中 ${storyboard.progress ? `${storyboard.progress.replace('%', '')}%` : '...'}`}
              </span>
            </div>
          </div>
        )}

        {/* 序号 */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium">
          #{index + 1}
        </div>

        {/* 右上角操作按钮 */}
        <div className="absolute top-2 right-2 flex gap-1">
          {/* 截取关键帧按钮 - 仅在有视频时显示 */}
          {storyboard.videoUrl && (
            <button
              onClick={handleCaptureFrame}
              className="p-1.5 rounded-md bg-black/40 text-white/80 hover:bg-purple-500 hover:text-white transition-colors"
              title="截取关键帧"
            >
              <Camera size={14} />
            </button>
          )}
          {/* 删除按钮 */}
          <button
            onClick={() => onDelete(storyboard.id)}
            className="p-1.5 rounded-md bg-black/40 text-white/80 hover:bg-red-500 hover:text-white transition-colors"
            title="删除分镜"
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
          {/* 配置按钮 */}
          <button
            onClick={() => onSettings(storyboard.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors"
          >
            <Settings size={12} />
            配置
          </button>

          {/* 生成按钮 */}
          {isGenerating ? (
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
              onClick={() => onGenerate(storyboard.id)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-lg transition-colors"
            >
              <RefreshCw size={12} />
              重新生成
            </button>
          ) : (
            <button
              onClick={() => onGenerate(storyboard.id)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-lg transition-colors"
            >
              <Play size={12} />
              生成
            </button>
          )}
        </div>
      </div>

      {/* 关键帧截取弹窗 */}
      {showCaptureModal && storyboard.videoUrl && (
        <FrameCaptureModal
          videoUrl={storyboard.videoUrl}
          storyboardIndex={index}
          onClose={() => setShowCaptureModal(false)}
        />
      )}
    </div>
  );
};
