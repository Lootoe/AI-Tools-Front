/**
 * CanvasToolbar - 画布工具栏组件
 * 
 * 实现功能：
 * - 重置视图按钮
 * - 缩放比例显示
 * 
 * Requirements: 1.4
 */
import React from 'react';
import { Home, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Viewport } from '@/types/canvas';
import { clampZoom, MIN_ZOOM, MAX_ZOOM } from '@/stores/canvasStore';

export interface CanvasToolbarProps {
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  onResetView: () => void;
}

// 预设缩放级别
const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  viewport,
  onViewportChange,
  onResetView,
}) => {
  // 缩放百分比显示
  const zoomPercentage = Math.round(viewport.zoom * 100);

  // 放大
  const handleZoomIn = () => {
    const newZoom = clampZoom(viewport.zoom * 1.2);
    onViewportChange({ ...viewport, zoom: newZoom });
  };

  // 缩小
  const handleZoomOut = () => {
    const newZoom = clampZoom(viewport.zoom / 1.2);
    onViewportChange({ ...viewport, zoom: newZoom });
  };

  // 适应窗口（重置到 100%）
  const handleFitToWindow = () => {
    onViewportChange({ ...viewport, zoom: 1 });
  };

  // 选择预设缩放级别
  const handleZoomPreset = (zoom: number) => {
    onViewportChange({ ...viewport, zoom: clampZoom(zoom) });
  };

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl z-10"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.9)',
        border: '1px solid rgba(0, 245, 255, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 245, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* 重置视图按钮 */}
      <button
        onClick={onResetView}
        className="p-2 rounded-lg transition-all hover:scale-105"
        style={{
          backgroundColor: 'rgba(0, 245, 255, 0.1)',
          border: '1px solid rgba(0, 245, 255, 0.2)',
          color: '#00f5ff',
        }}
        title="重置视图 (回到中心)"
      >
        <Home size={16} />
      </button>

      {/* 分隔线 */}
      <div
        className="w-px h-6"
        style={{ backgroundColor: 'rgba(0, 245, 255, 0.2)' }}
      />

      {/* 缩小按钮 */}
      <button
        onClick={handleZoomOut}
        disabled={viewport.zoom <= MIN_ZOOM}
        className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgba(191, 0, 255, 0.1)',
          border: '1px solid rgba(191, 0, 255, 0.2)',
          color: '#bf00ff',
        }}
        title="缩小"
      >
        <ZoomOut size={16} />
      </button>

      {/* 缩放比例显示/选择 */}
      <div className="relative group">
        <button
          className="px-3 py-1.5 rounded-lg text-sm font-mono min-w-[70px] text-center transition-all"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e5e7eb',
          }}
          title="点击选择缩放级别"
        >
          {zoomPercentage}%
        </button>

        {/* 缩放预设下拉菜单 */}
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-1 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
          style={{
            backgroundColor: 'rgba(18, 18, 26, 0.98)',
            border: '1px solid rgba(0, 245, 255, 0.2)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            minWidth: '80px',
          }}
        >
          {ZOOM_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handleZoomPreset(preset)}
              className="w-full px-3 py-1.5 text-xs text-center transition-colors"
              style={{
                color: Math.abs(viewport.zoom - preset) < 0.01 ? '#00f5ff' : '#d1d5db',
                backgroundColor: Math.abs(viewport.zoom - preset) < 0.01 ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
              }}
            >
              {Math.round(preset * 100)}%
            </button>
          ))}
        </div>
      </div>

      {/* 放大按钮 */}
      <button
        onClick={handleZoomIn}
        disabled={viewport.zoom >= MAX_ZOOM}
        className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgba(191, 0, 255, 0.1)',
          border: '1px solid rgba(191, 0, 255, 0.2)',
          color: '#bf00ff',
        }}
        title="放大"
      >
        <ZoomIn size={16} />
      </button>

      {/* 分隔线 */}
      <div
        className="w-px h-6"
        style={{ backgroundColor: 'rgba(0, 245, 255, 0.2)' }}
      />

      {/* 适应窗口按钮 */}
      <button
        onClick={handleFitToWindow}
        className="p-2 rounded-lg transition-all hover:scale-105"
        style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          color: '#22c55e',
        }}
        title="适应窗口 (100%)"
      >
        <Maximize2 size={16} />
      </button>
    </div>
  );
};

export default CanvasToolbar;
