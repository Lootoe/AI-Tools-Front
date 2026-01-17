/**
 * InputNode - 输入节点组件
 * 
 * 实现功能：
 * - 图片上传区域
 * - 图片预览
 * - 输出端口（有图片时可用）
 * 
 * Requirements: 3.1, 3.2, 3.3
 */
import React, { useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { Upload, Image as ImageIcon, X, Save, Copy } from 'lucide-react';
import { BaseNode, NODE_WIDTH } from './BaseNode';
import { InlineLoading } from '@/components/ui/Loading';
import { CanvasNode, Position } from '@/types/canvas';

export interface InputNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  zoom?: number; // 画布缩放比例
  onSelect: () => void;
  onDelete: () => void;
  onMove: (position: Position) => void;
  onMoveEnd?: (position: Position) => void; // 拖拽结束时触发 API 保存
  onUpdate: (updates: Partial<CanvasNode>) => void;
  onUpload: (file: File) => Promise<string | null>; // 返回上传后的 URL
  onSave?: () => void; // 保存到资产仓库
  onDuplicate?: () => void; // 复制节点
  onStartConnect?: (nodeId: string, portType: 'output') => void;
  onEndConnect?: (nodeId: string, portType: 'input') => void;
}

export const InputNode: React.FC<InputNodeProps> = ({
  node,
  isSelected,
  zoom,
  onSelect,
  onDelete,
  onMove,
  onMoveEnd,
  onUpdate,
  onUpload,
  onSave,
  onDuplicate,
  onStartConnect,
  onEndConnect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 是否有图片
  const hasImage = !!node.imageUrl;

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    setIsUploading(true);
    try {
      const url = await onUpload(file);
      if (url) {
        onUpdate({ imageUrl: url, status: 'completed' });
      }
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, onUpdate]);

  // 处理文件输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // 重置 input 以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  // 处理点击上传区域
  const handleUploadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }, [isUploading]);

  // 处理拖拽进入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 处理拖拽放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 处理清除图片
  const handleClearImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ imageUrl: undefined, status: 'idle' });
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
        type="input"
        position={{ x: node.positionX, y: node.positionY }}
        isSelected={isSelected}
        zoom={zoom}
        hasInputPort={false} // 输入节点没有输入端口
        hasOutputPort={true}
        outputPortEnabled={true} // 始终允许连线，即使没有图片
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
            background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.25), rgba(0, 212, 170, 0.15))',
            borderBottom: '1px solid rgba(0, 245, 255, 0.3)',
          }}
        >
          {/* 头部底部高光 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.4), transparent)',
            }}
          />
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.4), rgba(0, 212, 170, 0.3))',
              border: '1px solid rgba(0, 245, 255, 0.5)',
              boxShadow: '0 2px 8px rgba(0, 245, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <ImageIcon size={14} style={{ color: '#00f5ff', filter: 'drop-shadow(0 0 2px rgba(0, 245, 255, 0.8))' }} />
          </div>
          <span className="text-xs font-medium text-white flex-1 truncate" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
            {node.label || '输入节点'}
          </span>
        </div>

        {/* 图片展示/上传区域 */}
        <div
          className="relative cursor-pointer"
          style={{
            width: NODE_WIDTH - 2,
            height: NODE_WIDTH - 60, // 减去头部高度
            backgroundColor: isDragOver ? 'rgba(0, 245, 255, 0.15)' : 'rgba(0, 0, 0, 0.4)',
            border: isDragOver ? '2px dashed rgba(0, 245, 255, 0.6)' : '2px dashed transparent',
            transition: 'all 0.2s ease',
            boxShadow: isDragOver
              ? 'inset 0 0 20px rgba(0, 245, 255, 0.2), inset 0 2px 8px rgba(0, 0, 0, 0.3)'
              : 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
          onClick={handleUploadClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* 上传中状态 */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
              <InlineLoading size={24} color="#00f5ff" />
              <span className="text-xs" style={{ color: '#00f5ff' }}>
                上传中...
              </span>
            </div>
          )}

          {/* 已有图片 */}
          {hasImage && !isUploading && (
            <>
              <img
                src={node.imageUrl}
                alt="输入图片"
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleImageClick}
              />
              {/* 清除按钮 */}
              <button
                onClick={handleClearImage}
                className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 hover:opacity-100 transition-all duration-200 hover:scale-110"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                }}
                title="清除图片"
              >
                <X size={12} className="text-white" />
              </button>
              {/* 重新上传提示 */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              >
                <div className="flex flex-col items-center gap-1">
                  <Upload size={20} style={{ color: '#00f5ff' }} />
                  <span className="text-xs" style={{ color: '#00f5ff' }}>
                    点击更换图片
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 空状态 - 上传提示 */}
          {!hasImage && !isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(0, 212, 170, 0.1))',
                  border: '1px solid rgba(0, 245, 255, 0.2)',
                }}
              >
                <Upload size={20} style={{ color: 'rgba(0, 245, 255, 0.5)' }} />
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  点击或拖拽上传图片
                </p>
                <p className="text-[10px] mt-1" style={{ color: '#6b7280' }}>
                  支持 JPG、PNG、WebP
                </p>
              </div>
            </div>
          )}

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {/* 底部状态栏 */}
        <div
          className="px-3 py-2 flex items-center justify-between relative"
          style={{
            borderTop: '1px solid rgba(30, 30, 46, 0.8)',
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.1), transparent)',
          }}
        >
          {/* 顶部分隔高光 */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.2), transparent)',
            }}
          />
          <span className="text-[10px]" style={{ color: '#6b7280' }}>
            {hasImage ? '已上传图片' : '未上传图片'}
          </span>
          {hasImage && (
            <span
              className="text-[10px] px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(0, 245, 255, 0.15)',
                color: '#00f5ff',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                boxShadow: '0 0 8px rgba(0, 245, 255, 0.2)',
              }}
            >
              可连接
            </span>
          )}
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
              border: '1px solid rgba(0, 245, 255, 0.3)',
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
 * 判断输入节点的输出端口是否可用
 * 用于属性测试验证
 */
export function isInputNodeOutputEnabled(imageUrl?: string): boolean {
  return !!imageUrl;
}

export default InputNode;
