import React, { useState } from 'react';
import { usePromptStore } from '@/stores/promptStore';
import { Plus, Sparkles, FileText, Edit2 } from 'lucide-react';
import { PromptModal } from './PromptModal';

export const PromptSidebar: React.FC = () => {
  const { prompts, selectedPromptId, selectPrompt } = usePromptStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

  const handlePromptClick = (id: string) => {
    selectPrompt(id);
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEditingPromptId(id);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingPromptId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromptId(null);
  };

  return (
    <>
      <aside className="w-72 border-l border-gray-200/80 dark:border-gray-700/50 flex flex-col h-full bg-gradient-to-b from-white/80 via-purple-50/30 to-white/80 dark:from-gray-900/80 dark:via-purple-950/20 dark:to-gray-900/80 backdrop-blur-xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-200/80 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles size={16} className="text-white" />
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                提示词库
              </h2>
            </div>
            <button
              onClick={handleCreateNew}
              className="group relative p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
              title="新建提示词"
            >
              <Plus size={18} className="relative z-10" />
              <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-10">
            {prompts.length} 个提示词
          </p>
        </div>

        {/* Prompt List */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900/50 scrollbar-track-transparent">
          {prompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
                <FileText size={28} className="text-purple-400 dark:text-purple-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                暂无提示词
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                点击上方 + 创建第一个提示词
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => handlePromptClick(prompt.id)}
                  className={`group w-full text-left p-4 rounded-xl transition-all duration-200 border cursor-pointer ${
                    selectedPromptId === prompt.id
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30 border-transparent'
                      : 'bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md border-gray-200/50 dark:border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 relative">
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm mb-1 truncate ${
                        selectedPromptId === prompt.id
                          ? 'text-white'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {prompt.name}
                      </div>
                      <div className={`text-xs line-clamp-2 leading-relaxed ${
                        selectedPromptId === prompt.id
                          ? 'text-white/90'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {prompt.description}
                      </div>
                    </div>
                    {/* Edit Icon */}
                    <button
                      onClick={(e) => handleEditClick(e, prompt.id)}
                      className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                        selectedPromptId === prompt.id
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                      } opacity-0 group-hover:opacity-100`}
                      title="编辑"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Modal */}
      {isModalOpen && (
        <PromptModal
          promptId={editingPromptId}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};
