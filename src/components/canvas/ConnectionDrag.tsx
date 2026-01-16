/**
 * ConnectionDrag - 连接拖拽组件
 * 
 * 实现功能：
 * - 从端口拖拽创建连接的交互
 * - 拖拽时的临时连接线
 * 
 * Requirements: 4.1
 * 
 * 注意：此组件目前未被使用，AssetCanvasWorkspace 自己实现了连接拖拽逻辑
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Position, Viewport } from '@/types/canvas';
import { NODE_WIDTH, PORT_OFFSET } from './BaseNode';

// 节点高度常量
const NODE_HEIGHT_INPUT = 292;
const NODE_HEIGHT_GENERATOR = 478;

function getNodeHeight(nodeType?: string): number {
  return nodeType === 'input' ? NODE_HEIGHT_INPUT : NODE_HEIGHT_GENERATOR;
}

function getOutputPortPosition(nodeX: number, nodeY: number, nodeHeight: number): Position {
  return {
    x: nodeX + NODE_WIDTH + PORT_OFFSET,
    y: nodeY + nodeHeight / 2,
  };
}

export interface ConnectionDragState {
  isActive: boolean;
  sourceNodeId: string | null;
  sourceNodeType: string | null;
  sourcePosition: Position | null;
  currentPosition: Position | null;
}

export interface ConnectionDragProps {
  viewport: Viewport;
  containerRef: React.RefObject<HTMLDivElement>;
  onConnectionComplete: (sourceNodeId: string, targetNodeId: string) => void;
  children: (handlers: ConnectionDragHandlers) => React.ReactNode;
}

export interface ConnectionDragHandlers {
  onStartConnect: (nodeId: string, nodePosition: Position, nodeType?: string) => void;
  onEndConnect: (nodeId: string) => void;
  dragState: ConnectionDragState;
}

/**
 * 计算临时连接线的路径
 * 从源节点输出端口到当前鼠标位置
 */
export function calculateTempPath(
  sourcePosition: Position,
  currentPosition: Position,
  sourceNodeType?: string
): string {
  const sourceHeight = getNodeHeight(sourceNodeType);
  const sourcePort = getOutputPortPosition(sourcePosition.x, sourcePosition.y, sourceHeight);
  
  // 计算控制点偏移量
  const dx = Math.abs(currentPosition.x - sourcePort.x);
  const controlOffset = Math.max(50, dx * 0.4);
  
  // 贝塞尔曲线控制点
  const cp1x = sourcePort.x + controlOffset;
  const cp1y = sourcePort.y;
  const cp2x = currentPosition.x - controlOffset;
  const cp2y = currentPosition.y;
  
  return `M ${sourcePort.x} ${sourcePort.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currentPosition.x} ${currentPosition.y}`;
}

export const ConnectionDrag: React.FC<ConnectionDragProps> = ({
  viewport,
  containerRef,
  onConnectionComplete,
  children,
}) => {
  const [dragState, setDragState] = useState<ConnectionDragState>({
    isActive: false,
    sourceNodeId: null,
    sourceNodeType: null,
    sourcePosition: null,
    currentPosition: null,
  });

  // 存储源节点位置的 ref（用于在拖拽过程中保持稳定）
  const sourcePositionRef = useRef<Position | null>(null);

  // 屏幕坐标转画布坐标
  const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport, containerRef]);

  // 开始拖拽连接
  const handleStartConnect = useCallback((nodeId: string, nodePosition: Position, nodeType?: string) => {
    sourcePositionRef.current = nodePosition;
    const sourceHeight = getNodeHeight(nodeType);
    setDragState({
      isActive: true,
      sourceNodeId: nodeId,
      sourceNodeType: nodeType || null,
      sourcePosition: nodePosition,
      currentPosition: getOutputPortPosition(nodePosition.x, nodePosition.y, sourceHeight),
    });
  }, []);

  // 结束拖拽连接（在目标节点上释放）
  const handleEndConnect = useCallback((targetNodeId: string) => {
    if (dragState.isActive && dragState.sourceNodeId && dragState.sourceNodeId !== targetNodeId) {
      onConnectionComplete(dragState.sourceNodeId, targetNodeId);
    }
    
    // 重置状态
    sourcePositionRef.current = null;
    setDragState({
      isActive: false,
      sourceNodeId: null,
      sourceNodeType: null,
      sourcePosition: null,
      currentPosition: null,
    });
  }, [dragState.isActive, dragState.sourceNodeId, onConnectionComplete]);

  // 处理鼠标移动
  useEffect(() => {
    if (!dragState.isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setDragState(prev => ({
        ...prev,
        currentPosition: canvasPos,
      }));
    };

    const handleMouseUp = () => {
      // 如果在空白区域释放，取消连接
      sourcePositionRef.current = null;
      setDragState({
        isActive: false,
        sourceNodeId: null,
        sourceNodeType: null,
        sourcePosition: null,
        currentPosition: null,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isActive, screenToCanvas]);

  // 计算临时连接线路径
  const tempPath = dragState.isActive && dragState.sourcePosition && dragState.currentPosition
    ? calculateTempPath(dragState.sourcePosition, dragState.currentPosition, dragState.sourceNodeType || undefined)
    : null;

  return (
    <>
      {children({
        onStartConnect: handleStartConnect,
        onEndConnect: handleEndConnect,
        dragState,
      })}
      
      {/* 临时连接线 SVG 层 */}
      {tempPath && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1000,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* 发光效果 */}
          <path
            d={tempPath}
            fill="none"
            stroke="rgba(0, 245, 255, 0.3)"
            strokeWidth={6}
            strokeLinecap="round"
            style={{ filter: 'blur(4px)' }}
          />
          
          {/* 主连接线 */}
          <path
            d={tempPath}
            fill="none"
            stroke="#00f5ff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="8 4"
          />
          
          {/* 终点圆圈 */}
          {dragState.currentPosition && (
            <circle
              cx={dragState.currentPosition.x}
              cy={dragState.currentPosition.y}
              r={6}
              fill="rgba(0, 245, 255, 0.3)"
              stroke="#00f5ff"
              strokeWidth={2}
            />
          )}
        </svg>
      )}
    </>
  );
};

/**
 * Hook: 使用连接拖拽功能
 * 提供更简洁的 API 用于组件集成
 */
export function useConnectionDrag(
  viewport: Viewport,
  containerRef: React.RefObject<HTMLDivElement>,
  onConnectionComplete: (sourceNodeId: string, targetNodeId: string) => void
): ConnectionDragHandlers & { TempConnectionLine: React.FC } {
  const [dragState, setDragState] = useState<ConnectionDragState>({
    isActive: false,
    sourceNodeId: null,
    sourceNodeType: null,
    sourcePosition: null,
    currentPosition: null,
  });

  const sourcePositionRef = useRef<Position | null>(null);

  const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport, containerRef]);

  const onStartConnect = useCallback((nodeId: string, nodePosition: Position, nodeType?: string) => {
    sourcePositionRef.current = nodePosition;
    const sourceHeight = getNodeHeight(nodeType);
    setDragState({
      isActive: true,
      sourceNodeId: nodeId,
      sourceNodeType: nodeType || null,
      sourcePosition: nodePosition,
      currentPosition: getOutputPortPosition(nodePosition.x, nodePosition.y, sourceHeight),
    });
  }, []);

  const onEndConnect = useCallback((targetNodeId: string) => {
    if (dragState.isActive && dragState.sourceNodeId && dragState.sourceNodeId !== targetNodeId) {
      onConnectionComplete(dragState.sourceNodeId, targetNodeId);
    }
    
    sourcePositionRef.current = null;
    setDragState({
      isActive: false,
      sourceNodeId: null,
      sourceNodeType: null,
      sourcePosition: null,
      currentPosition: null,
    });
  }, [dragState.isActive, dragState.sourceNodeId, onConnectionComplete]);

  useEffect(() => {
    if (!dragState.isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setDragState(prev => ({
        ...prev,
        currentPosition: canvasPos,
      }));
    };

    const handleMouseUp = () => {
      sourcePositionRef.current = null;
      setDragState({
        isActive: false,
        sourceNodeId: null,
        sourceNodeType: null,
        sourcePosition: null,
        currentPosition: null,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isActive, screenToCanvas]);

  const TempConnectionLine: React.FC = () => {
    const tempPath = dragState.isActive && dragState.sourcePosition && dragState.currentPosition
      ? calculateTempPath(dragState.sourcePosition, dragState.currentPosition, dragState.sourceNodeType || undefined)
      : null;

    if (!tempPath) return null;

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1000,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <path
          d={tempPath}
          fill="none"
          stroke="rgba(0, 245, 255, 0.3)"
          strokeWidth={6}
          strokeLinecap="round"
          style={{ filter: 'blur(4px)' }}
        />
        <path
          d={tempPath}
          fill="none"
          stroke="#00f5ff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="8 4"
        />
        {dragState.currentPosition && (
          <circle
            cx={dragState.currentPosition.x}
            cy={dragState.currentPosition.y}
            r={6}
            fill="rgba(0, 245, 255, 0.3)"
            stroke="#00f5ff"
            strokeWidth={2}
          />
        )}
      </svg>
    );
  };

  return {
    onStartConnect,
    onEndConnect,
    dragState,
    TempConnectionLine,
  };
}

export default ConnectionDrag;
