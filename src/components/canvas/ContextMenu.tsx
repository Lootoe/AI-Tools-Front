/**
 * ContextMenu - 画布右键菜单组件
 * 
 * 实现功能：
 * - 右键菜单
 * - 新建生成节点选项
 * - 新建输入节点选项
 * 
 * Requirements: 5.2
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { Position } from '@/types/canvas';

export interface ContextMenuProps {
  position: Position;        // 菜单在画布上的位置
  screenPosition: Position;  // 菜单在屏幕上的位置
  onCreateGeneratorNode: () => void;
  onCreateInputNode: () => void;
  onClose: () => void;
}

export interface ContextMenuState {
  isOpen: boolean;
  canvasPosition: Position | null;
  screenPosition: Position | null;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  screenPosition,
  onCreateGeneratorNode,
  onCreateInputNode,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // 延迟添加事件监听，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 调整菜单位置，确保不超出视口
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = screenPosition.x;
      let adjustedY = screenPosition.y;

      // 如果菜单超出右边界
      if (screenPosition.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // 如果菜单超出下边界
      if (screenPosition.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      // 确保不超出左边界和上边界
      adjustedX = Math.max(10, adjustedX);
      adjustedY = Math.max(10, adjustedY);

      if (adjustedX !== screenPosition.x || adjustedY !== screenPosition.y) {
        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [screenPosition]);

  // 处理创建生成节点
  const handleCreateGenerator = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateGeneratorNode();
    onClose();
  }, [onCreateGeneratorNode, onClose]);

  // 处理创建输入节点
  const handleCreateInput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateInputNode();
    onClose();
  }, [onCreateInputNode, onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] animate-fade-in"
      style={{
        left: screenPosition.x,
        top: screenPosition.y,
      }}
    >
      <div
        className="rounded-lg overflow-hidden shadow-xl"
        style={{
          backgroundColor: 'rgba(18, 18, 26, 0.98)',
          border: '1px solid rgba(0, 245, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          minWidth: '180px',
        }}
      >
        {/* 菜单头部 */}
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{
            borderBottom: '1px solid rgba(60, 60, 80, 0.3)',
            background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.05), rgba(191, 0, 255, 0.05))',
          }}
        >
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            新建节点
          </span>
          <button
            onClick={onClose}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <X size={12} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* 菜单选项 */}
        <div className="py-1">
          {/* 新建生成节点 */}
          <button
            onClick={handleCreateGenerator}
            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(191, 0, 255, 0.2), rgba(255, 0, 255, 0.1))',
                border: '1px solid rgba(191, 0, 255, 0.3)',
              }}
            >
              <Sparkles size={14} style={{ color: '#bf00ff' }} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium" style={{ color: '#e5e7eb' }}>
                生成节点
              </div>
              <div className="text-[10px]" style={{ color: '#6b7280' }}>
                AI 图片生成
              </div>
            </div>
          </button>

          {/* 新建输入节点 */}
          <button
            onClick={handleCreateInput}
            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(0, 212, 170, 0.1))',
                border: '1px solid rgba(0, 245, 255, 0.3)',
              }}
            >
              <ImageIcon size={14} style={{ color: '#00f5ff' }} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium" style={{ color: '#e5e7eb' }}>
                输入节点
              </div>
              <div className="text-[10px]" style={{ color: '#6b7280' }}>
                上传参考图片
              </div>
            </div>
          </button>
        </div>

        {/* 快捷键提示 */}
        <div
          className="px-3 py-1.5 text-[10px]"
          style={{
            borderTop: '1px solid rgba(60, 60, 80, 0.3)',
            color: '#6b7280',
          }}
        >
          按 ESC 关闭
        </div>
      </div>
    </div>
  );
};

/**
 * Hook: 使用右键菜单
 * 提供状态管理和事件处理
 */
export function useContextMenu() {
  const [state, setState] = React.useState<ContextMenuState>({
    isOpen: false,
    canvasPosition: null,
    screenPosition: null,
  });

  const open = useCallback((canvasPosition: Position, screenPosition: Position) => {
    setState({
      isOpen: true,
      canvasPosition,
      screenPosition,
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      canvasPosition: null,
      screenPosition: null,
    });
  }, []);

  return {
    state,
    open,
    close,
  };
}

export default ContextMenu;
