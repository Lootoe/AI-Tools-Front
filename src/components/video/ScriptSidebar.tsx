import React, { useState } from 'react';
import { Plus, FileText, Trash2, Edit3, Check, X } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { cn } from '@/utils/cn';

export const ScriptSidebar: React.FC = () => {
  const { scripts, currentScriptId, createScript, selectScript, deleteScript, renameScript } = useVideoStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    createScript();
  };

  const handleStartRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const handleConfirmRename = () => {
    if (editingId && editTitle.trim()) {
      renameScript(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteScript(deletingId);
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  return (
    <>
      <div className="w-64 flex-shrink-0 bg-white/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText size={16} className="text-purple-500" />
              剧本管理
            </h3>
            <button
              onClick={handleCreate}
              className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition-all shadow-sm"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* 剧本列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {scripts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              暂无剧本，点击上方按钮创建
            </div>
          ) : (
            scripts.map((script) => (
              <div
                key={script.id}
                className={cn(
                  'group relative p-3 rounded-xl cursor-pointer transition-all',
                  currentScriptId === script.id
                    ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                )}
                onClick={() => selectScript(script.id)}
              >
                {editingId === script.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename();
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleConfirmRename(); }}
                      className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancelRename(); }}
                      className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-14">
                      {script.title}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {script.characters.length} 角色 · {script.episodes.length} 剧集
                    </div>
                    {/* 操作按钮 */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartRename(script.id, script.title); }}
                        className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(script.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 全屏删除确认对话框 */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              确认删除剧本
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              删除后将无法恢复，确定要删除「{scripts.find(s => s.id === deletingId)?.title}」吗？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
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
