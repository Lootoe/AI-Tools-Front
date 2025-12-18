import React, { useState } from 'react';
import {
  History,
  Trash2,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  X,
  Maximize2,
} from 'lucide-react';
import { useImageHistoryStore, ImageHistoryItem } from '@/stores/imageHistoryStore';

interface ImageHistoryPanelProps {
  onLoadHistory: (item: ImageHistoryItem) => void;
}

export const ImageHistoryPanel: React.FC<ImageHistoryPanelProps> = ({
  onLoadHistory,
}) => {
  const { history, removeHistory, clearHistory } = useImageHistoryStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
          <History className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">暂无历史记录</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">生成图片后会自动保存</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/30">
            <History size={12} className="text-white" />
          </div>
          <h3 className="text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            历史记录
          </h3>
          <span className="text-xs text-gray-400">({history.length})</span>
        </div>
        <button
          onClick={() => {
            if (confirm('确定要清空所有历史记录吗？')) {
              clearHistory();
            }
          }}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} />
          清空
        </button>
      </div>

      {/* 历史列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
          >
            {/* 记录头部 */}
            <div
              className="p-2.5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex items-start gap-2">
                {/* 缩略图 */}
                {item.generatedImages.length > 0 && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                    <img
                      src={item.generatedImages[0]}
                      alt="预览"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                    {item.prompt || item.positiveTags.join(', ') || '无提示词'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Clock size={10} />
                      {formatTime(item.createdAt)}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <ImageIcon size={10} />
                      {item.generatedImages.length}张
                    </span>
                  </div>
                </div>

                {/* 展开箭头 */}
                <ChevronRight
                  size={14}
                  className={`text-gray-400 transition-transform flex-shrink-0 ${
                    expandedId === item.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>

            {/* 展开详情 */}
            {expandedId === item.id && (
              <div className="px-2.5 pb-2.5 border-t border-gray-100 dark:border-gray-700 pt-2">
                {/* 参数信息 */}
                <div className="space-y-1.5 text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">模型:</span>
                    <span className="text-gray-600 dark:text-gray-300">{item.model}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">比例:</span>
                    <span className="text-gray-600 dark:text-gray-300">{item.aspectRatio}</span>
                    <span className="text-gray-400 ml-2">清晰度:</span>
                    <span className="text-gray-600 dark:text-gray-300">{item.imageSize}</span>
                  </div>
                  {item.positiveTags.length > 0 && (
                    <div>
                      <span className="text-gray-400">正向标签: </span>
                      <span className="text-orange-500">{item.positiveTags.join(', ')}</span>
                    </div>
                  )}
                  {item.negativeTags.length > 0 && (
                    <div>
                      <span className="text-gray-400">负面标签: </span>
                      <span className="text-red-500">{item.negativeTags.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* 生成的图片预览 */}
                {item.generatedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {item.generatedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer group relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                      >
                        <img
                          src={img}
                          alt={`生成图片 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 size={14} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadHistory(item);
                    }}
                    className="flex-1 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-colors"
                  >
                    加载参数
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHistory(item.id);
                    }}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={previewImage}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
