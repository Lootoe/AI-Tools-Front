/**
 * CanvasEdge - 画布连接线组件
 * 
 * 实现功能：
 * - 贝塞尔曲线连接线
 * - 流动动画效果
 * - 选中高亮和删除
 * - 动态获取端口实际位置
 * 
 * Requirements: 4.1, 4.3
 */
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Position } from '@/types/canvas';
import { NODE_WIDTH, PORT_OFFSET } from './BaseNode';

export interface CanvasEdgeProps {
  id: string;
  sourceNodeId: string;
  sourcePosition: Position;
  sourceType: string;
  targetNodeId: string;
  targetPosition: Position;
  targetType: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

// 节点高度常量 - 根据实际渲染测量
// InputNode: 头部(40px) + 图片区域(220px) + 底部(32px) = 292px
// GeneratorNode: 头部(40px) + 图片区域(278px) + 配置面板(168px) = 486px
const NODE_HEIGHT_MAP: Record<string, number> = {
  input: 292,
  generator: 486,
};

function getNodeHeight(nodeType: string): number {
  return NODE_HEIGHT_MAP[nodeType] || 300;
}

// 计算输出端口位置（节点右边缘，固定在头部）
// 端口固定在距离节点顶部22px的位置
function getOutputPortPosition(nodeX: number, nodeY: number, _nodeType: string): Position {
  return {
    x: nodeX + NODE_WIDTH + PORT_OFFSET,  // 280 + 6 = 286
    y: nodeY + 22, // 微调位置
  };
}

// 计算输入端口位置（节点左边缘，固定在头部）
// 端口固定在距离节点顶部22px的位置
function getInputPortPosition(nodeX: number, nodeY: number, _nodeType: string): Position {
  return {
    x: nodeX - PORT_OFFSET,  // -6
    y: nodeY + 22, // 微调位置
  };
}

// 计算贝塞尔曲线路径
export function calculateBezierPath(
  sourcePort: Position,
  targetPort: Position
): string {
  const dx = Math.abs(targetPort.x - sourcePort.x);
  const controlOffset = Math.max(50, dx * 0.4);

  const cp1x = sourcePort.x + controlOffset;
  const cp1y = sourcePort.y;
  const cp2x = targetPort.x - controlOffset;
  const cp2y = targetPort.y;

  return `M ${sourcePort.x} ${sourcePort.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetPort.x} ${targetPort.y}`;
}

export const CanvasEdge: React.FC<CanvasEdgeProps> = ({
  id,
  sourceNodeId,
  sourcePosition,
  sourceType,
  targetNodeId,
  targetPosition,
  targetType,
  isSelected,
  onSelect,
  onDelete,
}) => {
  // 使用 DOM API 动态获取端口的实际位置
  const getPortPosition = useCallback((nodeId: string, portType: 'input' | 'output'): Position | null => {
    const portElement = document.querySelector(
      `.node-port[data-node-id="${nodeId}"][data-port-type="${portType}"]`
    ) as HTMLElement;

    if (!portElement) return null;

    const rect = portElement.getBoundingClientRect();
    // 返回端口中心点的屏幕坐标
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  // 将屏幕坐标转换为画布坐标
  const screenToCanvas = useCallback((screenPos: Position): Position => {
    // 获取画布容器
    const canvasContainer = document.querySelector('.canvas-background')?.parentElement;
    if (!canvasContainer) return screenPos;

    const containerRect = canvasContainer.getBoundingClientRect();

    // 获取当前的 transform
    const transformedDiv = canvasContainer.querySelector('[style*="transform"]') as HTMLElement;
    if (!transformedDiv) return screenPos;

    const transform = transformedDiv.style.transform;
    const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);

    const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
    const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

    // 转换为画布坐标
    return {
      x: (screenPos.x - containerRect.left - translateX) / scale,
      y: (screenPos.y - containerRect.top - translateY) / scale,
    };
  }, []);

  // 计算端口位置
  const sourcePort = useMemo(() => {
    const screenPos = getPortPosition(sourceNodeId, 'output');
    if (!screenPos) {
      // 降级：使用旧的计算方法
      return getOutputPortPosition(sourcePosition.x, sourcePosition.y, sourceType);
    }
    return screenToCanvas(screenPos);
  }, [sourceNodeId, sourcePosition, sourceType, getPortPosition, screenToCanvas]);

  const targetPort = useMemo(() => {
    const screenPos = getPortPosition(targetNodeId, 'input');
    if (!screenPos) {
      // 降级：使用旧的计算方法
      return getInputPortPosition(targetPosition.x, targetPosition.y, targetType);
    }
    return screenToCanvas(screenPos);
  }, [targetNodeId, targetPosition, targetType, getPortPosition, screenToCanvas]);

  // 强制更新：在组件挂载后重新计算一次，确保 DOM 已渲染
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    // 延迟一帧后强制更新，确保端口元素已渲染
    const timer = requestAnimationFrame(() => {
      forceUpdate(prev => prev + 1);
    });
    return () => cancelAnimationFrame(timer);
  }, [sourceNodeId, targetNodeId]);

  // 计算路径
  const path = useMemo(
    () => calculateBezierPath(sourcePort, targetPort),
    [sourcePort, targetPort]
  );

  // 计算删除按钮位置（连线中点）
  const deleteButtonPosition = useMemo(() => ({
    x: (sourcePort.x + targetPort.x) / 2,
    y: (sourcePort.y + targetPort.y) / 2,
  }), [sourcePort, targetPort]);

  // 处理点击
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  // 处理删除
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  // 颜色配置
  const strokeColor = isSelected ? '#00f5ff' : 'rgba(0, 245, 255, 0.5)';
  const glowColor = isSelected ? 'rgba(0, 245, 255, 0.4)' : 'rgba(0, 245, 255, 0.2)';

  return (
    <g className="canvas-edge" data-edge-id={id} style={{ pointerEvents: 'auto' }}>
      {/* 发光效果层 */}
      <path
        d={path}
        fill="none"
        stroke={glowColor}
        strokeWidth={isSelected ? 8 : 4}
        strokeLinecap="round"
        style={{ filter: 'blur(4px)' }}
      />

      {/* 主连接线 */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? 3 : 2}
        strokeLinecap="round"
        className="cursor-pointer"
        onClick={handleClick}
      />

      {/* 点击区域 */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        strokeLinecap="round"
        className="cursor-pointer"
        onClick={handleClick}
      />

      {/* 流动动画效果 */}
      <path
        d={path}
        fill="none"
        stroke="url(#edgeGradient)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="8 12"
        className="animate-flow"
      />

      {/* 选中时显示删除按钮 */}
      {isSelected && (
        <g
          className="cursor-pointer"
          onClick={handleDelete}
          transform={`translate(${deleteButtonPosition.x}, ${deleteButtonPosition.y})`}
        >
          <circle
            r={10}
            fill="rgba(239, 68, 68, 0.9)"
            stroke="rgba(239, 68, 68, 0.5)"
            strokeWidth={2}
          />
          <line x1={-4} y1={-4} x2={4} y2={4} stroke="white" strokeWidth={2} strokeLinecap="round" />
          <line x1={4} y1={-4} x2={-4} y2={4} stroke="white" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

export const CanvasEdgeDefs: React.FC = () => (
  <defs>
    <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="rgba(0, 245, 255, 0)" />
      <stop offset="50%" stopColor="rgba(0, 245, 255, 0.8)" />
      <stop offset="100%" stopColor="rgba(0, 245, 255, 0)" />
    </linearGradient>
  </defs>
);

export default CanvasEdge;
