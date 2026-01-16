/**
 * BaseNode - 节点基础容器组件
 * 
 * 实现功能：
 * - 节点拖拽、选中、删除
 * - 输入/输出连接端口
 * - z-index 基于选中状态
 * 
 * Requirements: 5.1, 5.5
 */
import React, { useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Position, NodeType } from '@/types/canvas';

// 节点尺寸常量
export const NODE_WIDTH = 280;
export const NODE_MIN_HEIGHT = 200;

// 端口尺寸
export const PORT_SIZE = 12;
export const PORT_OFFSET = 6; // 端口距离节点边缘的偏移

export interface BaseNodeProps {
  id: string;
  type: NodeType;
  position: Position;
  isSelected: boolean;
  zoom?: number; // 画布缩放比例，用于正确计算拖拽距离
  hasInputPort?: boolean;
  hasOutputPort?: boolean;
  outputPortEnabled?: boolean; // 输出端口是否可用（如 InputNode 需要有图片才可用）
  onSelect: () => void;
  onDelete: () => void;
  onMove: (position: Position) => void; // 拖拽过程中的位置更新（仅本地状态）
  onMoveEnd?: (position: Position) => void; // 拖拽结束时的位置更新（触发 API 保存）
  onStartConnect?: (nodeId: string, portType: 'output') => void;
  onEndConnect?: (nodeId: string, portType: 'input') => void;
  onContextMenu?: (e: React.MouseEvent) => void; // 右键菜单事件
  children: React.ReactNode;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  type,
  position,
  isSelected,
  zoom = 1, // 默认缩放比例为 1
  hasInputPort = true,
  hasOutputPort = true,
  outputPortEnabled = true,
  onSelect,
  onDelete,
  onMove,
  onMoveEnd,
  onStartConnect,
  onEndConnect,
  onContextMenu,
  children,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [positionStart, setPositionStart] = useState<Position | null>(null);

  // 处理节点拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 只响应左键
    if (e.button !== 0) return;

    // 如果点击的是端口或删除按钮，不触发拖拽
    const target = e.target as HTMLElement;
    if (target.closest('.node-port') || target.closest('.node-delete-btn')) {
      return;
    }

    // 如果点击的是交互元素（输入框、下拉框等），不触发拖拽
    const isInteractiveElement = target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'BUTTON' ||
      target.isContentEditable;
    if (isInteractiveElement) {
      return;
    }

    e.stopPropagation();
    onSelect();

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPositionStart({ x: position.x, y: position.y });
  }, [position, onSelect]);

  // 处理节点拖拽移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart || !positionStart) return;

    // 计算鼠标移动的屏幕像素距离
    const screenDx = e.clientX - dragStart.x;
    const screenDy = e.clientY - dragStart.y;

    // 转换为画布坐标距离（除以缩放比例）
    const canvasDx = screenDx / zoom;
    const canvasDy = screenDy / zoom;

    onMove({
      x: positionStart.x + canvasDx,
      y: positionStart.y + canvasDy,
    });
  }, [isDragging, dragStart, positionStart, zoom, onMove]);

  // 处理节点拖拽结束
  const handleMouseUp = useCallback(() => {
    if (isDragging && positionStart) {
      // 拖拽结束时，检查位置是否有变化，如果有则触发 onMoveEnd
      const currentPos = nodeRef.current?.style;
      if (currentPos) {
        const finalX = parseFloat(currentPos.left) || position.x;
        const finalY = parseFloat(currentPos.top) || position.y;
        // 只有位置真正改变时才触发
        if (finalX !== positionStart.x || finalY !== positionStart.y) {
          onMoveEnd?.({ x: finalX, y: finalY });
        }
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setPositionStart(null);
  }, [isDragging, positionStart, position, onMoveEnd]);

  // 监听全局鼠标事件
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 处理删除按钮点击
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  // 处理输出端口拖拽开始（创建连接）
  const handleOutputPortMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (outputPortEnabled && onStartConnect) {
      onStartConnect(id, 'output');
    }
  }, [id, outputPortEnabled, onStartConnect]);

  // 处理输入端口鼠标释放（完成连接）
  const handleInputPortMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEndConnect) {
      onEndConnect(id, 'input');
    }
  }, [id, onEndConnect]);

  // 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(); // 右键时也选中节点
    if (onContextMenu) {
      onContextMenu(e);
    }
  }, [onSelect, onContextMenu]);

  // 获取节点类型对应的颜色
  const getNodeColor = () => {
    switch (type) {
      case 'generator':
        return {
          border: isSelected ? 'rgba(191, 0, 255, 0.6)' : 'rgba(191, 0, 255, 0.3)',
          shadow: isSelected ? '0 0 20px rgba(191, 0, 255, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
          headerBg: 'linear-gradient(135deg, rgba(191, 0, 255, 0.15), rgba(255, 0, 255, 0.1))',
          portColor: '#bf00ff',
        };
      case 'input':
        return {
          border: isSelected ? 'rgba(0, 245, 255, 0.6)' : 'rgba(0, 245, 255, 0.3)',
          shadow: isSelected ? '0 0 20px rgba(0, 245, 255, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
          headerBg: 'linear-gradient(135deg, rgba(0, 245, 255, 0.15), rgba(0, 212, 170, 0.1))',
          portColor: '#00f5ff',
        };
      default:
        return {
          border: isSelected ? 'rgba(107, 114, 128, 0.6)' : 'rgba(107, 114, 128, 0.3)',
          shadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          headerBg: 'rgba(107, 114, 128, 0.1)',
          portColor: '#6b7280',
        };
    }
  };

  const colors = getNodeColor();

  return (
    <div
      ref={nodeRef}
      className="absolute select-none"
      style={{
        left: position.x,
        top: position.y,
        width: NODE_WIDTH,
        minHeight: NODE_MIN_HEIGHT,
        zIndex: isSelected ? 100 : 10,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      {/* 节点主体 */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(18, 18, 26, 0.95)',
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* 删除按钮 */}
        <button
          className="node-delete-btn absolute top-2 right-2 p-1 rounded-md opacity-0 hover:opacity-100 transition-opacity z-10"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
          }}
          onClick={handleDelete}
          title="删除节点"
        >
          <X size={12} className="text-white" />
        </button>

        {/* 节点内容 */}
        {children}
      </div>

      {/* 输入端口（左侧，垂直居中） */}
      {hasInputPort && (
        <div
          className="node-port node-port-input absolute flex items-center justify-center cursor-crosshair"
          data-node-id={id}
          data-port-type="input"
          style={{
            left: -PORT_SIZE / 2 - PORT_OFFSET,
            top: '50%',
            transform: 'translateY(-50%)',
            width: PORT_SIZE,
            height: PORT_SIZE,
            borderRadius: '50%',
            backgroundColor: 'rgba(18, 18, 26, 0.95)',
            border: `2px solid ${colors.portColor}`,
            boxShadow: `0 0 8px ${colors.portColor}40`,
          }}
          onMouseUp={handleInputPortMouseUp}
          title="输入端口"
        >
          <div
            style={{
              width: PORT_SIZE / 3,
              height: PORT_SIZE / 3,
              borderRadius: '50%',
              backgroundColor: colors.portColor,
            }}
          />
        </div>
      )}

      {/* 输出端口（右侧，垂直居中） */}
      {hasOutputPort && (
        <div
          className="node-port node-port-output absolute flex items-center justify-center"
          data-node-id={id}
          data-port-type="output"
          style={{
            right: -PORT_SIZE / 2 - PORT_OFFSET,
            top: '50%',
            transform: 'translateY(-50%)',
            width: PORT_SIZE,
            height: PORT_SIZE,
            borderRadius: '50%',
            backgroundColor: outputPortEnabled ? 'rgba(18, 18, 26, 0.95)' : 'rgba(40, 40, 50, 0.8)',
            border: `2px solid ${outputPortEnabled ? colors.portColor : 'rgba(107, 114, 128, 0.3)'}`,
            boxShadow: outputPortEnabled ? `0 0 8px ${colors.portColor}40` : 'none',
            cursor: outputPortEnabled ? 'crosshair' : 'not-allowed',
            opacity: outputPortEnabled ? 1 : 0.5,
          }}
          onMouseDown={handleOutputPortMouseDown}
          title={outputPortEnabled ? '输出端口 - 拖拽创建连接' : '输出端口 - 需要先上传图片'}
        >
          <div
            style={{
              width: PORT_SIZE / 3,
              height: PORT_SIZE / 3,
              borderRadius: '50%',
              backgroundColor: outputPortEnabled ? colors.portColor : 'rgba(107, 114, 128, 0.3)',
            }}
          />
        </div>
      )}
    </div>
  );
};

// 计算节点的 z-index
export function getNodeZIndex(isSelected: boolean): number {
  return isSelected ? 100 : 10;
}

export default BaseNode;
