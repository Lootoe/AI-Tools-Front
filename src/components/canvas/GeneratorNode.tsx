/**
 * GeneratorNode - 生成节点组件
 * 
 * 实现功能：
 * - 模型选择器（Nano Banana 2、豆包）
 * - 参数配置（比例、质量）
 * - 提示词输入框
 * - 生成按钮和状态显示
 * - 图片结果展示
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
import React, { useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Sparkles, ChevronDown, AlertCircle, RefreshCw, Save, X, Copy } from 'lucide-react';
import { BaseNode, NODE_WIDTH } from './BaseNode';
import { InlineLoading } from '@/components/ui/Loading';
import { CanvasNode, Position, NodeStatus } from '@/types/canvas';
import CoinIcon from '@/img/coin.webp';

// 模型选项
export const IMAGE_MODELS = [
  { value: 'nano-banana-2', label: 'Nano Banana 2', cost: 4 },
  { value: 'doubao-seedream-3-0-t2i-250415', label: '豆包', cost: 2 },
] as const;

export type ImageModel = typeof IMAGE_MODELS[number]['value'];

// 比例选项
export const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 方形' },
  { value: '4:3', label: '4:3 标准' },
  { value: '16:9', label: '16:9 横版' },
] as const;

export type AspectRatio = typeof ASPECT_RATIOS[number]['value'];

// 图片质量选项
export const IMAGE_SIZES = [
  { value: '1K', label: '1K 标清' },
  { value: '2K', label: '2K 高清' },
] as const;

export type ImageSize = typeof IMAGE_SIZES[number]['value'];

export interface GeneratorNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  connectedInputUrls: string[];
  zoom?: number; // 画布缩放比例
  onSelect: () => void;
  onDelete: () => void;
  onMove: (position: Position) => void;
  onMoveEnd?: (position: Position) => void; // 拖拽结束时触发 API 保存
  onUpdate: (updates: Partial<CanvasNode>) => void;
  onGenerate: () => void;
  onSave?: () => void;
  onDuplicate?: () => void; // 复制节点
  onStartConnect?: (nodeId: string, portType: 'output') => void;
  onEndConnect?: (nodeId: string, portType: 'input') => void;
}

export const GeneratorNode: React.FC<GeneratorNodeProps> = ({
  node,
  isSelected,
  connectedInputUrls,
  zoom,
  onSelect,
  onDelete,
  onMove,
  onMoveEnd,
  onUpdate,
  onGenerate,
  onSave,
  onDuplicate,
  onStartConnect,
  onEndConnect,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [localPrompt, setLocalPrompt] = useState(node.prompt || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 当前选中的模型
  const currentModel = (node.model as ImageModel) || 'nano-banana-2';
  const modelInfo = IMAGE_MODELS.find((m) => m.value === currentModel) || IMAGE_MODELS[0];

  // 当前选中的比例
  const currentRatio = (node.aspectRatio as AspectRatio) || '1:1';

  // 当前选中的质量
  const currentSize = (node.imageSize as ImageSize) || '1K';

  // 节点状态
  const isGenerating = node.status === 'generating';
  const isFailed = node.status === 'failed';
  const hasImage = !!node.imageUrl;

  // 是否可以生成
  const canGenerate = !isGenerating && localPrompt?.trim();

  // 同步外部 prompt 变化到本地状态
  React.useEffect(() => {
    setLocalPrompt(node.prompt || '');
  }, [node.prompt]);

  // 清理防抖定时器
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 处理模型选择
  const handleModelSelect = useCallback((model: ImageModel) => {
    onUpdate({ model });
    setIsModelDropdownOpen(false);
  }, [onUpdate]);

  // 处理比例选择
  const handleRatioSelect = useCallback((ratio: AspectRatio) => {
    onUpdate({ aspectRatio: ratio });
    setIsRatioDropdownOpen(false);
  }, [onUpdate]);

  // 处理质量选择
  const handleSizeSelect = useCallback((size: ImageSize) => {
    onUpdate({ imageSize: size });
    setIsSizeDropdownOpen(false);
  }, [onUpdate]);

  // 处理提示词变化（带防抖）
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // 立即更新本地状态，保证输入流畅
    setLocalPrompt(newValue);

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器，800ms 后调用 API
    debounceTimerRef.current = setTimeout(() => {
      onUpdate({ prompt: newValue });
    }, 800);
  }, [onUpdate]);

  // 处理生成按钮点击
  const handleGenerate = useCallback(() => {
    if (canGenerate) {
      onGenerate();
    }
  }, [canGenerate, onGenerate]);

  // 处理重试
  const handleRetry = useCallback(() => {
    onUpdate({ status: 'idle', failReason: undefined });
  }, [onUpdate]);

  // 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
  }, []);

  // 处理保存（从右键菜单）
  const handleSaveFromMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
      onSave();
    }
    closeContextMenu();
  }, [onSave, closeContextMenu]);

  // 处理删除（从右键菜单）
  const handleDeleteFromMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    closeContextMenu();
  }, [onDelete, closeContextMenu]);

  // 处理复制（从右键菜单）
  const handleDuplicateFromMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate();
    }
    closeContextMenu();
  }, [onDuplicate, closeContextMenu]);

  // 处理图片点击 - 打开预览
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.imageUrl) {
      setPreviewImageUrl(node.imageUrl);
    }
  }, [node.imageUrl]);

  // 关闭图片预览
  const closePreview = useCallback(() => {
    setPreviewImageUrl(null);
  }, []);

  // 点击外部关闭菜单
  React.useEffect(() => {
    if (!contextMenuPosition) return;

    const handleClickOutside = () => closeContextMenu();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenuPosition, closeContextMenu]);

  return (
    <>
      <BaseNode
        id={node.id}
        type="generator"
        position={{ x: node.positionX, y: node.positionY }}
        isSelected={isSelected}
        zoom={zoom}
        hasInputPort={true}
        hasOutputPort={true}
        outputPortEnabled={true} // 始终允许连线，即使没有生成结果
        onSelect={onSelect}
        onDelete={onDelete}
        onMove={(pos) => onMove(pos)}
        onMoveEnd={onMoveEnd}
        onStartConnect={onStartConnect}
        onEndConnect={onEndConnect}
        onContextMenu={handleContextMenu}
      >
        {/* 节点头部 */}
        <div
          className="px-3 py-2.5 flex items-center gap-2 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(191, 0, 255, 0.25), rgba(255, 0, 255, 0.15))',
            borderBottom: '1px solid rgba(191, 0, 255, 0.3)',
          }}
        >
          {/* 头部底部高光 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(191, 0, 255, 0.4), transparent)',
            }}
          />
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(191, 0, 255, 0.4), rgba(255, 0, 255, 0.3))',
              border: '1px solid rgba(191, 0, 255, 0.5)',
              boxShadow: '0 2px 8px rgba(191, 0, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <Sparkles size={14} style={{ color: '#bf00ff', filter: 'drop-shadow(0 0 2px rgba(191, 0, 255, 0.8))' }} />
          </div>
          <span className="text-xs font-medium text-white flex-1 truncate" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
            {node.label || '生成节点'}
          </span>
        </div>

        {/* 图片展示区域 */}
        <div
          className="relative"
          style={{
            width: NODE_WIDTH - 2,
            height: NODE_WIDTH - 2,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* 生成中状态 */}
          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <InlineLoading size={24} color="#bf00ff" />
              <span className="text-xs" style={{ color: '#bf00ff' }}>
                {node.progress || '生成中...'}
              </span>
            </div>
          )}

          {/* 失败状态 */}
          {isFailed && !hasImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
              <span className="text-xs text-center" style={{ color: '#ef4444' }}>
                {node.failReason || '生成失败'}
              </span>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                }}
              >
                <RefreshCw size={10} />
                重试
              </button>
            </div>
          )}

          {/* 已完成 - 显示图片 */}
          {hasImage && !isGenerating && (
            <img
              src={node.imageUrl}
              alt="生成结果"
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleImageClick}
            />
          )}

          {/* 空状态 */}
          {!hasImage && !isGenerating && !isFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Sparkles size={32} style={{ color: 'rgba(191, 0, 255, 0.3)' }} />
              <span className="text-xs" style={{ color: '#6b7280' }}>
                填写提示词后点击生成
              </span>
            </div>
          )}

          {/* 连接的参考图指示 */}
          {connectedInputUrls.length > 0 && (
            <div
              className="absolute top-2 left-2 px-2 py-1 rounded text-[10px]"
              style={{
                backgroundColor: 'rgba(0, 245, 255, 0.2)',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                color: '#00f5ff',
              }}
            >
              {connectedInputUrls.length} 张参考图
            </div>
          )}

          {/* 保存按钮 */}
          {hasImage && !isGenerating && onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className="absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200 opacity-0 hover:opacity-100 hover:scale-110"
              style={{
                backgroundColor: 'rgba(0, 245, 255, 0.9)',
                boxShadow: '0 2px 8px rgba(0, 245, 255, 0.4)',
              }}
              title="保存到资产仓库"
            >
              <Save size={12} className="text-white" />
            </button>
          )}
        </div>

        {/* 配置面板 */}
        <div
          className="p-3 flex flex-col gap-2 relative"
          style={{
            borderTop: '1px solid rgba(30, 30, 46, 0.8)',
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.1), transparent)',
          }}
        >
          {/* 顶部分隔高光 */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(191, 0, 255, 0.2), transparent)',
            }}
          />
          {/* 模型和参数选择行 */}
          <div className="flex items-center gap-2">
            {/* 模型选择 */}
            <div className="relative flex-1">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                disabled={isGenerating}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px]"
                style={{
                  backgroundColor: 'rgba(191, 0, 255, 0.1)',
                  border: '1px solid rgba(191, 0, 255, 0.2)',
                  color: '#bf00ff',
                  opacity: isGenerating ? 0.5 : 1,
                }}
              >
                <span className="truncate">{modelInfo.label}</span>
                <ChevronDown size={10} />
              </button>
              {isModelDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                  <div
                    className="absolute left-0 right-0 top-full mt-1 z-20 rounded overflow-hidden"
                    style={{
                      backgroundColor: 'rgba(18, 18, 26, 0.98)',
                      border: '1px solid rgba(191, 0, 255, 0.2)',
                    }}
                  >
                    {IMAGE_MODELS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => handleModelSelect(m.value)}
                        className="w-full px-2 py-1.5 text-[10px] text-left"
                        style={{
                          color: currentModel === m.value ? '#bf00ff' : '#d1d5db',
                          backgroundColor: currentModel === m.value ? 'rgba(191, 0, 255, 0.1)' : 'transparent',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 比例选择 */}
            <div className="relative">
              <button
                onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)}
                disabled={isGenerating}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-[10px]"
                style={{
                  backgroundColor: 'rgba(77, 124, 255, 0.1)',
                  border: '1px solid rgba(77, 124, 255, 0.2)',
                  color: '#4d7cff',
                  opacity: isGenerating ? 0.5 : 1,
                }}
              >
                <span>{currentRatio}</span>
                <ChevronDown size={10} />
              </button>
              {isRatioDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsRatioDropdownOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-20 rounded overflow-hidden min-w-[80px]"
                    style={{
                      backgroundColor: 'rgba(18, 18, 26, 0.98)',
                      border: '1px solid rgba(77, 124, 255, 0.2)',
                    }}
                  >
                    {ASPECT_RATIOS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => handleRatioSelect(r.value)}
                        className="w-full px-2 py-1.5 text-[10px] text-left whitespace-nowrap"
                        style={{
                          color: currentRatio === r.value ? '#4d7cff' : '#d1d5db',
                          backgroundColor: currentRatio === r.value ? 'rgba(77, 124, 255, 0.1)' : 'transparent',
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 质量选择 */}
            <div className="relative">
              <button
                onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                disabled={isGenerating}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-[10px]"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#22c55e',
                  opacity: isGenerating ? 0.5 : 1,
                }}
              >
                <span>{currentSize}</span>
                <ChevronDown size={10} />
              </button>
              {isSizeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSizeDropdownOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-20 rounded overflow-hidden min-w-[80px]"
                    style={{
                      backgroundColor: 'rgba(18, 18, 26, 0.98)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    {IMAGE_SIZES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => handleSizeSelect(s.value)}
                        className="w-full px-2 py-1.5 text-[10px] text-left whitespace-nowrap"
                        style={{
                          color: currentSize === s.value ? '#22c55e' : '#d1d5db',
                          backgroundColor: currentSize === s.value ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 提示词输入 */}
          <textarea
            value={localPrompt}
            onChange={handlePromptChange}
            placeholder="输入提示词描述..."
            disabled={isGenerating}
            className="w-full h-48 px-2 py-1.5 rounded text-xs resize-none [&::-webkit-scrollbar]:hidden"
            style={{
              backgroundColor: 'rgba(20, 20, 35, 0.8)',
              border: '1px solid rgba(60, 60, 80, 0.5)',
              color: '#e5e7eb',
              opacity: isGenerating ? 0.5 : 1,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          />

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: canGenerate
                ? 'linear-gradient(135deg, rgba(191, 0, 255, 0.4), rgba(255, 0, 255, 0.3))'
                : 'rgba(191, 0, 255, 0.1)',
              border: '1px solid rgba(191, 0, 255, 0.5)',
              color: '#bf00ff',
              opacity: canGenerate ? 1 : 0.5,
              boxShadow: canGenerate ? '0 4px 12px rgba(191, 0, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none',
              textShadow: canGenerate ? '0 0 8px rgba(191, 0, 255, 0.5)' : 'none',
            }}
          >
            {isGenerating ? (
              <>
                <InlineLoading size={12} color="#bf00ff" />
                <span>生成中...</span>
              </>
            ) : (
              <>
                <Sparkles size={12} />
                <span>生成</span>
                <span className="flex items-center">
                  （<img src={CoinIcon} alt="" className="w-3 h-3" />{modelInfo.cost}）
                </span>
              </>
            )}
          </button>
        </div>
      </BaseNode>

      {/* 右键菜单 - 使用 Portal 渲染到 body */}
      {contextMenuPosition && ReactDOM.createPortal(
        <div
          className="fixed z-[9999]"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-lg overflow-hidden shadow-xl"
            style={{
              backgroundColor: 'rgba(18, 18, 26, 0.98)',
              border: '1px solid rgba(191, 0, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              minWidth: '160px',
            }}
          >
            <div className="py-1">
              {/* 保存图像 */}
              {hasImage && onSave && (
                <button
                  onClick={handleSaveFromMenu}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors text-left"
                >
                  <Save size={14} style={{ color: '#00f5ff' }} />
                  <span className="text-sm" style={{ color: '#e5e7eb' }}>
                    保存图像
                  </span>
                </button>
              )}
              {/* 复制节点 */}
              {onDuplicate && (
                <button
                  onClick={handleDuplicateFromMenu}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors text-left"
                >
                  <Copy size={14} style={{ color: '#22c55e' }} />
                  <span className="text-sm" style={{ color: '#e5e7eb' }}>
                    复制节点
                  </span>
                </button>
              )}
              {/* 删除节点 */}
              <button
                onClick={handleDeleteFromMenu}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors text-left"
              >
                <X size={14} style={{ color: '#ef4444' }} />
                <span className="text-sm" style={{ color: '#e5e7eb' }}>
                  删除节点
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 图片预览模态框 */}
      {previewImageUrl && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
          onClick={closePreview}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <img
            src={previewImageUrl}
            alt="预览"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {/* 关闭提示 */}
          <div
            className="absolute top-4 right-4 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(18, 18, 26, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e5e7eb',
            }}
          >
            点击任意处关闭
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

/**
 * 根据节点状态获取渲染内容类型
 * 用于属性测试验证
 */
export function getNodeRenderType(status: NodeStatus, imageUrl?: string): 'loading' | 'image' | 'error' | 'empty' {
  if (status === 'generating') return 'loading';
  if (status === 'failed' && !imageUrl) return 'error';
  if (imageUrl) return 'image';
  return 'empty';
}

export default GeneratorNode;
