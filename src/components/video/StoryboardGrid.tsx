import React, { useState, useRef } from 'react';
import { Plus, Loader2, Trash2, Video, Download } from 'lucide-react';
import { Storyboard } from '@/types/video';

interface StoryboardGridProps {
  storyboards: Storyboard[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onDownloadAll?: () => void;
  onClearAll?: () => void;
  isDownloading?: boolean;
}

export const StoryboardGrid: React.FC<StoryboardGridProps> = ({
  storyboards,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
  onDownloadAll,
  onClearAll,
  isDownloading = false,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 支持鼠标滚轮横向滚动
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex && onReorder) {
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(10,10,15,0.6)',
        border: '1px solid #1e1e2e',
      }}
    >
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid #1e1e2e' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>
            分镜列表
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#1e1e2e', color: '#6b7280' }}
          >
            {storyboards.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 批量下载按钮 */}
          {onDownloadAll && storyboards.some((sb) => {
            const activeVariant = sb.variants?.find(v => v.id === sb.activeVariantId);
            return (activeVariant?.status === 'completed' && activeVariant?.videoUrl) ||
              (sb.status === 'completed' && sb.videoUrl);
          }) && (
              <button
                onClick={onDownloadAll}
                disabled={isDownloading}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors disabled:opacity-50"
                style={{
                  color: '#4d7cff',
                  border: '1px solid rgba(77,124,255,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isDownloading) {
                    e.currentTarget.style.backgroundColor = 'rgba(77,124,255,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Download size={12} />
                批量下载
              </button>
            )}

          {/* 清空按钮 */}
          {onClearAll && storyboards.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
              style={{
                color: '#ff00ff',
                border: '1px solid rgba(255,0,255,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,0,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={12} />
              清空
            </button>
          )}

          {/* 添加分镜按钮 */}
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
            style={{ color: '#00f5ff', border: '1px solid rgba(0,245,255,0.3)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,245,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Plus size={12} />
            添加分镜
          </button>
        </div>
      </div>

      {/* 分镜横向列表 */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex-1 overflow-x-auto overflow-y-hidden p-2 cyber-scrollbar-x"
      >
        <div className="flex gap-2 h-full">
          {storyboards.map((storyboard, index) => {
            const isSelected = selectedId === storyboard.id;
            const isHovered = hoveredId === storyboard.id;
            const isGenerating =
              storyboard.status === 'generating' || storyboard.status === 'queued';
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={storyboard.id}
                draggable={!isGenerating}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelect(storyboard.id)}
                onMouseEnter={() => setHoveredId(storyboard.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex-shrink-0 w-28 h-full rounded-lg overflow-hidden cursor-pointer transition-all"
                style={{
                  backgroundColor: '#12121a',
                  border: isDragOver
                    ? '2px solid #bf00ff'
                    : isSelected
                      ? '2px solid #00f5ff'
                      : isHovered
                        ? '1px solid rgba(0,245,255,0.3)'
                        : '1px solid #1e1e2e',
                  boxShadow: isDragOver
                    ? '0 0 15px rgba(191,0,255,0.5)'
                    : isSelected
                      ? '0 0 15px rgba(0,245,255,0.3)'
                      : isHovered
                        ? '0 0 8px rgba(0,245,255,0.1)'
                        : 'none',
                  opacity: isDragging ? 0.5 : 1,
                  transform: isDragOver ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {/* 缩略图 */}
                <div
                  className="w-full h-full relative"
                  style={{ backgroundColor: '#0a0a0f' }}
                >
                  {storyboard.videoUrl ? (
                    <video
                      src={`${storyboard.videoUrl}#t=0.1`}
                      className="w-full h-full object-cover pointer-events-none"
                      preload="metadata"
                      muted
                      disablePictureInPicture
                      controlsList="nodownload nofullscreen noremoteplayback"
                    />
                  ) : storyboard.thumbnailUrl ? (
                    <img
                      src={storyboard.thumbnailUrl}
                      alt={`分镜 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={14} style={{ color: '#374151' }} />
                    </div>
                  )}

                  {/* 生成中遮罩 */}
                  {isGenerating && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(10,10,15,0.9)' }}
                    >
                      <div className="text-center">
                        <Loader2
                          size={14}
                          className="animate-spin mx-auto mb-1"
                          style={{ color: '#00f5ff' }}
                        />
                        <span className="text-[8px]" style={{ color: '#00f5ff' }}>
                          {storyboard.status === 'queued'
                            ? '排队'
                            : `${storyboard.progress || '0'}%`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 序号 */}
                  <div
                    className="absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold"
                    style={{
                      backgroundColor: isSelected ? '#00f5ff' : 'rgba(10,10,15,0.8)',
                      color: isSelected ? '#0a0a0f' : '#00f5ff',
                      border: '1px solid rgba(0,245,255,0.3)',
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* 删除按钮 */}
                  {isHovered && !isGenerating && (
                    <div className="absolute top-1 right-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(storyboard.id);
                        }}
                        className="p-1 rounded transition-colors"
                        style={{ backgroundColor: 'rgba(10,10,15,0.8)', color: '#ff00ff' }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 添加分镜卡片 */}
          <div
            onClick={onAdd}
            className="relative flex-shrink-0 w-28 h-full rounded-lg overflow-hidden cursor-pointer transition-all group"
            style={{
              backgroundColor: 'rgba(18,18,26,0.5)',
              border: '2px dashed rgba(0,245,255,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,245,255,0.6)';
              e.currentTarget.style.backgroundColor = 'rgba(0,245,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,245,255,0.3)';
              e.currentTarget.style.backgroundColor = 'rgba(18,18,26,0.5)';
            }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(191,0,255,0.2))',
                  border: '1px solid rgba(0,245,255,0.3)',
                }}
              >
                <Plus size={16} style={{ color: '#00f5ff' }} />
              </div>
              <span className="text-[10px]" style={{ color: '#00f5ff' }}>
                添加分镜
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
