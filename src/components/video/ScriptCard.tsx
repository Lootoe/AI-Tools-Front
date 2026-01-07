import React, { useState } from 'react';
import { MoreVertical, Trash2, Edit2, Film, Play, Layers, Check } from 'lucide-react';
import { Script } from '@/types/video';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ScriptCardProps {
  script: Script;
  onClick: (scriptId: string) => void;
  onDelete: (scriptId: string) => void;
  onRename: (scriptId: string, newTitle: string) => void;
  defaultRenaming?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (scriptId: string, selected: boolean) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  onClick,
  onDelete,
  onRename,
  defaultRenaming = false,
  selectionMode = false,
  isSelected = false,
  onSelect,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRenaming, setIsRenaming] = useState(defaultRenaming);
  const [renameValue, setRenameValue] = useState(script.title);
  const [isHovered, setIsHovered] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsRenaming(true);
    setRenameValue(script.title);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (renameValue.trim() && renameValue !== script.title) {
      onRename(script.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsRenaming(false);
      setRenameValue(script.title);
    }
  };

  const handleCardClick = () => {
    if (selectionMode) {
      onSelect?.(script.id, !isSelected);
    } else if (!isRenaming) {
      onClick(script.id);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <>
      <div
        data-testid="script-card"
        data-script-id={script.id}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
        style={{ 
          backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isSelected 
            ? '1px solid rgba(139, 92, 246, 0.5)'
            : isHovered 
              ? '1px solid rgba(255, 255, 255, 0.25)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isHovered 
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1) inset' 
            : '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255,255,255,0.05) inset'
        }}
      >
        {/* 选择框 */}
        {selectionMode && (
          <div 
            className="absolute top-3 left-3 z-10 w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{
              backgroundColor: isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
              border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {isSelected && <Check size={14} className="text-white" />}
          </div>
        )}
        
        <div className="p-4 relative">
          {/* 图标和标题 */}
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              style={{ 
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(191, 0, 255, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: 'inset 0 0 10px rgba(255,255,255,0.05)'
              }}
            >
              <Film size={20} style={{ color: '#00f5ff' }} />
            </div>
            <div className="flex-1 min-w-0">
              {isRenaming ? (
                <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleRenameSubmit}
                    autoFocus
                    className="w-full px-2 py-1 text-sm font-medium rounded-lg text-white focus:outline-none"
                    style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(0, 245, 255, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                </form>
              ) : (
                <h3 
                  data-testid="script-card-title"
                  className="font-semibold truncate transition-colors text-base"
                  style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {script.title}
                </h3>
              )}
            </div>
          </div>

          {/* 底部信息 */}
          <div 
            className="flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <Layers size={12} style={{ color: '#a855f7' }} />
              <span>{script.episodes.length} 个剧集</span>
            </div>
            <div 
              className="flex items-center gap-1 transition-opacity"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              <button 
                className="p-1.5 rounded-lg transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(0, 245, 255, 0.1))',
                  border: '1px solid rgba(0, 245, 255, 0.3)',
                  color: '#00f5ff'
                }}
              >
                <Play size={12} />
              </button>
            </div>
          </div>

          {/* 菜单按钮 */}
          <div className="absolute top-3 right-3">
            <button
              onClick={handleMenuClick}
              className="p-1.5 rounded-lg transition-all"
              style={{ 
                color: 'rgba(255,255,255,0.6)',
                opacity: isHovered ? 1 : 0,
                backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                backdropFilter: 'blur(10px)'
              }}
            >
              <MoreVertical size={14} />
            </button>

            {/* 下拉菜单 */}
            {showMenu && (
              <div 
                className="absolute right-0 top-8 w-32 rounded-xl shadow-xl py-1 z-10 overflow-hidden"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <button
                  onClick={handleRenameClick}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors hover:bg-[rgba(255,255,255,0.1)]"
                  style={{ color: '#ffffff' }}
                >
                  <Edit2 size={12} />
                  重命名
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors hover:bg-[rgba(255,100,150,0.15)]"
                  style={{ color: '#ff6b9d' }}
                >
                  <Trash2 size={12} />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="删除剧本"
        message={`确定要删除剧本「${script.title}」吗？此操作不可撤销。`}
        type="danger"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => {
          onDelete(script.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
