import React, { useState } from 'react';
import { MoreVertical, Trash2, Edit2, Film, Play, Layers } from 'lucide-react';
import { Script } from '@/types/video';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ScriptCardProps {
  script: Script;
  onClick: (scriptId: string) => void;
  onDelete: (scriptId: string) => void;
  onRename: (scriptId: string, newTitle: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  onClick,
  onDelete,
  onRename,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
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
    if (!isRenaming) {
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
        className="group relative rounded-xl cursor-pointer transition-all duration-300"
        style={{ 
          backgroundColor: 'rgba(20, 20, 30, 0.8)',
          border: isHovered ? '1px solid rgba(0, 245, 255, 0.6)' : '1px solid rgba(60, 60, 80, 0.5)',
          boxShadow: isHovered ? '0 0 25px rgba(0, 245, 255, 0.2), inset 0 0 20px rgba(0, 245, 255, 0.05)' : 'none'
        }}
      >
        <div className="p-4 relative">
          {/* 图标和标题 */}
          <div className="flex items-start gap-3 mb-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              style={{ 
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.15), rgba(138, 43, 226, 0.15))',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                boxShadow: isHovered ? '0 0 12px rgba(0, 245, 255, 0.3)' : 'none'
              }}
            >
              <Film size={18} style={{ color: '#00f5ff' }} />
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
                    className="w-full px-2 py-1 text-sm font-medium rounded text-white focus:outline-none"
                    style={{ 
                      backgroundColor: 'rgba(10, 10, 20, 0.9)',
                      border: '1px solid rgba(0, 245, 255, 0.5)'
                    }}
                  />
                </form>
              ) : (
                <h3 
                  data-testid="script-card-title"
                  className="font-semibold truncate transition-colors"
                  style={{ color: '#ffffff' }}
                >
                  {script.title}
                </h3>
              )}
              <p 
                data-testid="script-card-description"
                className="text-xs line-clamp-1 mt-1"
                style={{ color: '#a0a0b0' }}
              >
                {script.content || '暂无描述'}
              </p>
            </div>
          </div>

          {/* 底部信息 */}
          <div 
            className="flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid rgba(60, 60, 80, 0.4)' }}
          >
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#b0b0c0' }}>
              <Layers size={12} style={{ color: '#a855f7' }} />
              <span>{script.episodes.length} 个剧集</span>
            </div>
            <div 
              className="flex items-center gap-1 transition-opacity"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              <button 
                className="p-1.5 rounded transition-colors"
                style={{ 
                  backgroundColor: 'rgba(0, 245, 255, 0.15)',
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
              className="p-1.5 rounded transition-all"
              style={{ 
                color: '#808090',
                opacity: isHovered ? 1 : 0,
                backgroundColor: isHovered ? 'rgba(40, 40, 60, 0.8)' : 'transparent'
              }}
            >
              <MoreVertical size={14} />
            </button>

            {/* 下拉菜单 */}
            {showMenu && (
              <div 
                className="absolute right-0 top-8 w-32 rounded-lg shadow-xl py-1 z-10 overflow-hidden"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 30, 0.95)', 
                  border: '1px solid rgba(60, 60, 80, 0.6)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <button
                  onClick={handleRenameClick}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors hover:bg-[rgba(60,60,80,0.5)]"
                  style={{ color: '#e0e0e0' }}
                >
                  <Edit2 size={12} />
                  重命名
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors hover:bg-[rgba(255,50,100,0.15)]"
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
