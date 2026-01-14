import React, { useState } from 'react';
import { Film, Plus, Trash2, Clapperboard, Pencil, Check, X } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface EpisodePanelProps {
  scriptId: string;
  selectedEpisodeId: string | null;
  onSelectEpisode: (id: string | null) => void;
}

export const EpisodePanel: React.FC<EpisodePanelProps> = ({
  scriptId,
  selectedEpisodeId,
  onSelectEpisode,
}) => {
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { scripts, addEpisode, deleteEpisode, updateEpisode } = useVideoStore();
  const script = scripts.find(s => s.id === scriptId);

  const handleAddEpisode = async () => {
    if (!script) return;
    const episodeNumber = script.episodes.length + 1;
    const newId = await addEpisode(script.id, {
      episodeNumber,
      title: `第 ${episodeNumber} 集`,
      content: '',
    });
    onSelectEpisode(newId);
  };

  const handleDeleteEpisode = (e: React.MouseEvent, episodeId: string) => {
    e.stopPropagation();
    if (!script) return;
    const episode = script.episodes.find(ep => ep.id === episodeId);
    if (episode) {
      setDeleteConfirm({ id: episodeId, name: episode.title });
    }
  };

  const handleConfirmDelete = () => {
    if (!script || !deleteConfirm) return;
    deleteEpisode(script.id, deleteConfirm.id);
    if (selectedEpisodeId === deleteConfirm.id) {
      onSelectEpisode(null);
    }
    setDeleteConfirm(null);
  };

  const handleStartRename = (e: React.MouseEvent, episodeId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingEpisodeId(episodeId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!script || !editingEpisodeId || !editingTitle.trim()) return;
    updateEpisode(script.id, editingEpisodeId, { title: editingTitle.trim() });
    setEditingEpisodeId(null);
    setEditingTitle('');
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEpisodeId(null);
    setEditingTitle('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!script || !editingEpisodeId || !editingTitle.trim()) return;
      updateEpisode(script.id, editingEpisodeId, { title: editingTitle.trim() });
      setEditingEpisodeId(null);
      setEditingTitle('');
    } else if (e.key === 'Escape') {
      setEditingEpisodeId(null);
      setEditingTitle('');
    }
  };

  if (!script) {
    return (
      <div
        className="w-56 flex-shrink-0 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(18,18,26,0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #1e1e2e'
        }}
      >
        <div className="text-center text-sm" style={{ color: '#6b7280' }}>
          请先选择或创建剧本
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="w-56 flex-shrink-0 rounded-xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'rgba(18,18,26,0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #1e1e2e'
        }}
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ borderBottom: '1px solid #1e1e2e' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
                border: '1px solid rgba(0,245,255,0.2)'
              }}
            >
              <Film size={12} style={{ color: '#00f5ff' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>剧集列表</span>
          </div>
          <button
            onClick={handleAddEpisode}
            className="p-1 rounded transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00f5ff';
              e.currentTarget.style.backgroundColor = 'rgba(0,245,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="添加剧集"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* 剧集列表 */}
        <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.episode-list::-webkit-scrollbar { display: none; }`}</style>
          <div className="space-y-1.5 episode-list">
            {script.episodes.length === 0 && (
              <button
                onClick={handleAddEpisode}
                className="w-full p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-xs transition-all"
                style={{
                  border: '1px dashed #1e1e2e',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00f5ff';
                  e.currentTarget.style.borderColor = 'rgba(0,245,255,0.3)';
                  e.currentTarget.style.backgroundColor = 'rgba(0,245,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = '#1e1e2e';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Plus size={16} />
                <span>添加第一个剧集</span>
              </button>
            )}

            {script.episodes.map((episode) => {
              const isSelected = selectedEpisodeId === episode.id;
              const isHovered = hoveredId === episode.id;

              return (
                <div
                  key={episode.id}
                  onClick={() => onSelectEpisode(episode.id)}
                  onMouseEnter={() => setHoveredId(episode.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="p-2.5 rounded-lg cursor-pointer transition-all group relative"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))'
                      : isHovered ? 'rgba(26,26,40,0.8)' : 'rgba(26,26,40,0.3)',
                    border: isSelected
                      ? '1px solid rgba(0,245,255,0.3)'
                      : isHovered ? '1px solid #1e1e2e' : '1px solid transparent',
                    boxShadow: isSelected ? '0 0 15px rgba(0,245,255,0.1)' : 'none'
                  }}
                >
                  {/* 选中指示器 */}
                  {isSelected && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                      style={{
                        background: 'linear-gradient(180deg, #00f5ff, #bf00ff)',
                        boxShadow: '0 0 8px rgba(0,245,255,0.8)'
                      }}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pl-1">
                      <Clapperboard
                        size={12}
                        className="flex-shrink-0 transition-colors"
                        style={{ color: isSelected ? '#00f5ff' : isHovered ? '#9ca3af' : '#6b7280' }}
                      />
                      {editingEpisodeId === episode.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={handleRenameKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="flex-1 text-xs font-medium rounded px-1.5 py-0.5 text-white focus:outline-none"
                          style={{
                            backgroundColor: '#0a0a0f',
                            border: '1px solid rgba(0,245,255,0.5)'
                          }}
                        />
                      ) : (
                        <span
                          className="text-xs font-medium truncate transition-colors"
                          style={{ color: isSelected ? '#fff' : isHovered ? '#e5e7eb' : '#d1d5db' }}
                        >
                          {episode.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {editingEpisodeId === episode.id ? (
                        <>
                          <button
                            onClick={handleSaveRename}
                            className="p-0.5 rounded transition-all"
                            style={{ color: '#00ff9d' }}
                          >
                            <Check size={10} />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-0.5 rounded transition-all"
                            style={{ color: '#9ca3af' }}
                          >
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleStartRename(e, episode.id, episode.title)}
                            className="p-0.5 rounded transition-all"
                            style={{
                              color: '#6b7280',
                              opacity: isHovered ? 1 : 0
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#00f5ff';
                              e.currentTarget.style.backgroundColor = 'rgba(0,245,255,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#6b7280';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteEpisode(e, episode.id)}
                            className="p-0.5 rounded transition-all"
                            style={{
                              color: '#6b7280',
                              opacity: isHovered ? 1 : 0
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ff00ff';
                              e.currentTarget.style.backgroundColor = 'rgba(255,0,255,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#6b7280';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 删除确认弹框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="确认删除"
        message={deleteConfirm ? `确定要删除剧集 "${deleteConfirm.name}" 吗？此操作不可撤销。` : ''}
        type="danger"
        confirmText="确认删除"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  );
};
