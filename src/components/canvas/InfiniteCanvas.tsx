/**
 * InfiniteCanvas - 无限画布核心组件
 * 
 * 实现功能：
 * - SVG 画布容器，渲染网格背景
 * - 鼠标滚轮缩放（0.1-3.0 范围）
 * - 中键拖拽/Space+拖拽平移
 * - 坐标转换（屏幕坐标 ↔ 画布坐标）
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Viewport, Position, CanvasNode, CanvasEdge } from '@/types/canvas';
import { clampZoom } from '@/stores/canvasStore';

// 网格配置
const GRID_SIZE = 20; // 小网格大小
const GRID_SIZE_LARGE = 100; // 大网格大小

export interface InfiniteCanvasProps {
  viewport: Viewport;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  onViewportChange: (viewport: Viewport) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: Position) => void;
  onContextMenu: (position: Position) => void;
  children?: React.ReactNode;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  viewport,
  // 以下属性将在后续任务中用于渲染节点和边
  nodes: _nodes,
  edges: _edges,
  selectedNodeId: _selectedNodeId,
  onViewportChange,
  onNodeSelect,
  onNodeMove: _onNodeMove,
  onContextMenu,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [panStart, setPanStart] = useState<Position | null>(null);
  const [viewportStart, setViewportStart] = useState<Viewport | null>(null);

  // 屏幕坐标转画布坐标
  const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // 画布坐标转屏幕坐标（供外部使用）
  const canvasToScreen = useCallback((canvasX: number, canvasY: number): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: canvasX * viewport.zoom + viewport.x + rect.left,
      y: canvasY * viewport.zoom + viewport.y + rect.top,
    };
  }, [viewport]);

  // 暴露坐标转换方法供外部使用
  void canvasToScreen; // 标记为已使用，将在后续任务中通过 ref 暴露

  // 处理滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // 检查事件目标是否是可滚动的交互元素
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    // 如果是交互元素，不阻止默认行为，让元素自己处理滚动
    if (isInteractiveElement) {
      return;
    }

    e.preventDefault();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // 鼠标相对于容器的位置
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 计算缩放因子
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = clampZoom(viewport.zoom * zoomFactor);

    // 如果缩放没有变化，直接返回
    if (newZoom === viewport.zoom) return;

    // 以鼠标位置为中心进行缩放
    // 缩放前鼠标指向的画布坐标
    const canvasX = (mouseX - viewport.x) / viewport.zoom;
    const canvasY = (mouseY - viewport.y) / viewport.zoom;

    // 缩放后保持鼠标指向同一画布坐标
    const newX = mouseX - canvasX * newZoom;
    const newY = mouseY - canvasY * newZoom;

    onViewportChange({
      x: newX,
      y: newY,
      zoom: newZoom,
    });
  }, [viewport, onViewportChange]);

  // 处理鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 检查是否点击在交互元素上
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    // 如果点击在交互元素上，不处理画布平移
    if (isInteractiveElement) {
      return;
    }

    // 中键拖拽或 Space + 左键拖拽
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setViewportStart({ ...viewport });
    } else if (e.button === 0) {
      // 左键点击空白区域取消选中
      if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
        onNodeSelect(null);
      }
    }
  }, [isSpacePressed, viewport, onNodeSelect]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStart && viewportStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      onViewportChange({
        x: viewportStart.x + dx,
        y: viewportStart.y + dy,
        zoom: viewportStart.zoom,
      });
    }
  }, [isPanning, panStart, viewportStart, onViewportChange]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
    setViewportStart(null);
  }, []);

  // 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    onContextMenu(canvasPos);
  }, [screenToCanvas, onContextMenu]);

  // 监听键盘事件（Space 键）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        setPanStart(null);
        setViewportStart(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 监听全局鼠标释放（防止拖拽时鼠标移出容器）
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setPanStart(null);
      setViewportStart(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // 计算网格偏移
  const gridOffsetX = viewport.x % (GRID_SIZE * viewport.zoom);
  const gridOffsetY = viewport.y % (GRID_SIZE * viewport.zoom);
  const largeGridOffsetX = viewport.x % (GRID_SIZE_LARGE * viewport.zoom);
  const largeGridOffsetY = viewport.y % (GRID_SIZE_LARGE * viewport.zoom);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: '#0a0a0f',
        cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* SVG 网格背景 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none canvas-background"
        style={{ zIndex: 0 }}
      >
        <defs>
          {/* 小网格图案 */}
          <pattern
            id="smallGrid"
            width={GRID_SIZE * viewport.zoom}
            height={GRID_SIZE * viewport.zoom}
            patternUnits="userSpaceOnUse"
            x={gridOffsetX}
            y={gridOffsetY}
          >
            <path
              d={`M ${GRID_SIZE * viewport.zoom} 0 L 0 0 0 ${GRID_SIZE * viewport.zoom}`}
              fill="none"
              stroke="rgba(0, 245, 255, 0.05)"
              strokeWidth="0.5"
            />
          </pattern>
          {/* 大网格图案 */}
          <pattern
            id="largeGrid"
            width={GRID_SIZE_LARGE * viewport.zoom}
            height={GRID_SIZE_LARGE * viewport.zoom}
            patternUnits="userSpaceOnUse"
            x={largeGridOffsetX}
            y={largeGridOffsetY}
          >
            <rect
              width={GRID_SIZE_LARGE * viewport.zoom}
              height={GRID_SIZE_LARGE * viewport.zoom}
              fill="url(#smallGrid)"
            />
            <path
              d={`M ${GRID_SIZE_LARGE * viewport.zoom} 0 L 0 0 0 ${GRID_SIZE_LARGE * viewport.zoom}`}
              fill="none"
              stroke="rgba(0, 245, 255, 0.1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#largeGrid)" />
      </svg>

      {/* 画布内容容器 */}
      <div
        className="absolute"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          zIndex: 1,
        }}
      >
        {children}
      </div>

      {/* 边框发光效果 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 60px rgba(0, 245, 255, 0.05), inset 0 0 120px rgba(191, 0, 255, 0.03)',
        }}
      />
    </div>
  );
};

// 导出坐标转换工具函数
export const createCoordinateTransformer = (viewport: Viewport, containerRect: DOMRect) => ({
  screenToCanvas: (screenX: number, screenY: number): Position => ({
    x: (screenX - containerRect.left - viewport.x) / viewport.zoom,
    y: (screenY - containerRect.top - viewport.y) / viewport.zoom,
  }),
  canvasToScreen: (canvasX: number, canvasY: number): Position => ({
    x: canvasX * viewport.zoom + viewport.x + containerRect.left,
    y: canvasY * viewport.zoom + viewport.y + containerRect.top,
  }),
});

export default InfiniteCanvas;
