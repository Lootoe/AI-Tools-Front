import React, { useState } from 'react';
import { Film, Users, Plus, Trash2, Clapperboard, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { ResourceTab, Character } from '@/types/video';
import { cn } from '@/utils/cn';
import { CharacterModal } from './CharacterModal';

interface ResourcePanelProps {
  selectedEpisodeId: string | null;
  onSelectEpisode: (id: string | null) => void;
}

export const ResourcePanel: React.FC<ResourcePanelProps> = ({
  selectedEpisodeId,
  onSelectEpisode,
}) => {
  const [activeTab, setActiveTab] = useState<ResourceTab>('episodes');
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'episode' | 'character'; id: string; name: string } | null>(null);
  const { getCurrentScript, addEpisode, deleteEpisode, updateEpisode, addCharacter, updateCharacter, deleteCharacter } = useVideoStore();
  
  const script = getCurrentScript();

  const handleAddEpisode = () => {
    if (!script) return;
    const episodeNumber = script.episodes.length + 1;
    const newId = addEpisode(script.id, {
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
      setDeleteConfirm({ type: 'episode', id: episodeId, name: episode.title });
    }
  };

  const handleDeleteCharacter = (e: React.MouseEvent, characterId: string) => {
    e.stopPropagation();
    if (!script) return;
    const character = script.characters.find(c => c.id === characterId);
    if (character) {
      setDeleteConfirm({ type: 'character', id: characterId, name: character.name });
    }
  };

  const handleConfirmDelete = () => {
    if (!script || !deleteConfirm) return;
    if (deleteConfirm.type === 'episode') {
      deleteEpisode(script.id, deleteConfirm.id);
      if (selectedEpisodeId === deleteConfirm.id) {
        onSelectEpisode(null);
      }
    } else {
      deleteCharacter(script.id, deleteConfirm.id);
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

  const handleSaveCharacter = (name: string, description: string) => {
    if (!script) return;
    addCharacter(script.id, { name, description });
  };

  const handleUpdateCharacter = (updates: Partial<Character>) => {
    if (!script || !editingCharacter) return;
    updateCharacter(script.id, editingCharacter.id, updates);
  };

  const handleCharacterClick = (character: Character) => {
    setEditingCharacter(character);
  };

  const handleCloseCharacterModal = () => {
    setShowCharacterModal(false);
    setEditingCharacter(null);
  };

  if (!script) {
    return (
      <div className="w-72 flex-shrink-0 bg-white/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-center">
        <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
          请先选择或创建剧本
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-72 flex-shrink-0 bg-white/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col overflow-hidden">
        {/* Tab 切换 */}
        <div className="flex border-b border-gray-100 dark:border-gray-700/50">
          <button
            onClick={() => setActiveTab('episodes')}
            className={cn(
              'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
              activeTab === 'episodes'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Film size={14} />
            剧集
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={cn(
              'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
              activeTab === 'characters'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Users size={14} />
            角色
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          {activeTab === 'episodes' ? (
            <div className="space-y-2">
              <button
                onClick={handleAddEpisode}
                className="w-full p-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-gray-400 hover:text-purple-500 hover:border-purple-300 dark:hover:border-purple-600 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={16} />
                添加剧集
              </button>
              
              {script.episodes.map((episode) => (
                <div
                  key={episode.id}
                  onClick={() => onSelectEpisode(episode.id)}
                  className={cn(
                    'p-3 rounded-xl cursor-pointer transition-colors group',
                    selectedEpisodeId === episode.id
                      ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Clapperboard size={14} className={cn(
                        'flex-shrink-0',
                        selectedEpisodeId === episode.id
                          ? 'text-purple-500 dark:text-purple-400'
                          : 'text-gray-400 dark:text-gray-500'
                      )} />
                      {editingEpisodeId === episode.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={handleRenameKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="flex-1 text-sm font-medium bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      ) : (
                        <span className={cn(
                          'text-sm font-medium truncate',
                          selectedEpisodeId === episode.id
                            ? 'text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-300'
                        )}>
                          {episode.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {episode.storyboards.length} 分镜
                      </span>
                      {editingEpisodeId === episode.id ? (
                        <>
                          <button
                            onClick={handleSaveRename}
                            className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-all"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleStartRename(e, episode.id, episode.title)}
                            className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteEpisode(e, episode.id)}
                            className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {episode.content && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                      {episode.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setShowCharacterModal(true)}
                className="w-full p-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-gray-400 hover:text-purple-500 hover:border-purple-300 dark:hover:border-purple-600 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={16} />
                添加角色
              </button>

              {script.characters.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  暂无角色
                </div>
              ) : (
                script.characters.map((character) => (
                  <div
                    key={character.id}
                    onClick={() => handleCharacterClick(character)}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* 优先显示 Sora2 头像，其次是缩略图 */}
                      {(character.profilePictureUrl || character.thumbnailUrl) ? (
                        <img
                          src={character.profilePictureUrl || character.thumbnailUrl}
                          alt={character.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {character.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {character.name}
                          </span>
                          <button
                            onClick={(e) => handleDeleteCharacter(e, character.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {character.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">
                            {character.description}
                          </p>
                        )}
                        {/* 状态标签 - 根据是否有 characterId 判断是否已认证 */}
                        <span className={cn(
                          'inline-block text-xs px-1.5 py-0.5 rounded mt-1',
                          character.characterId && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                          !character.characterId && character.status === 'completed' && 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
                          character.status === 'generating' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                          character.status === 'pending' && 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                          character.status === 'failed' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                          {character.characterId && '已认证'}
                          {!character.characterId && character.status === 'completed' && '待认证'}
                          {character.status === 'generating' && '生成中'}
                          {character.status === 'pending' && '待生成'}
                          {character.status === 'failed' && '失败'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showCharacterModal && (
        <CharacterModal
          onSave={handleSaveCharacter}
          onClose={handleCloseCharacterModal}
        />
      )}

      {editingCharacter && (
        <CharacterModal
          character={editingCharacter}
          onSave={handleSaveCharacter}
          onUpdate={handleUpdateCharacter}
          onClose={handleCloseCharacterModal}
        />
      )}

      {/* 删除确认弹框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                确认删除
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              确定要删除{deleteConfirm.type === 'episode' ? '剧集' : '角色'} "{deleteConfirm.name}" 吗？此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
