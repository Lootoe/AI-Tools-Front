import React, { useState } from 'react';
import { Conversation } from '@/types/conversation';
import { MessageSquarePlus, Trash2, Edit2, Check, X, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { formatTimestamp } from '@/utils/formatters';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onCreate: () => void;
  onClearAll: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelect,
  onDelete,
  onRename,
  onCreate,
  onClearAll,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditTitle('');
    }
  };
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* 对话列表标题和操作按钮 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-600 tracking-wide">
          对话列表
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCreate}
            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors duration-200"
            title="新建对话"
          >
            <MessageSquarePlus size={18} />
          </button>
          {conversations.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors duration-200"
              title="清空所有对话历史"
            >
              <Trash size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pt-2">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'group relative px-3 py-3 mb-1 cursor-pointer transition-all duration-200 rounded-lg',
              currentConversationId === conversation.id
                ? 'bg-blue-50 border border-blue-200 shadow-sm'
                : 'hover:bg-gray-100 border border-transparent'
            )}
            onClick={() => editingId !== conversation.id && onSelect(conversation.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {editingId === conversation.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(conversation.id, e)}
                      className="h-7 text-sm px-2"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={(e) => handleSaveEdit(conversation.id, e)}
                    >
                      <Check size={14} className="text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={handleCancelEdit}
                    >
                      <X size={14} className="text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className={cn(
                      "text-sm font-semibold truncate",
                      currentConversationId === conversation.id
                        ? "text-blue-700"
                        : "text-gray-800"
                    )}>
                      {conversation.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(conversation.updatedAt)}
                    </p>
                  </>
                )}
              </div>
              {editingId !== conversation.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-blue-100 transition-colors"
                    onClick={(e) => handleStartEdit(conversation, e)}
                  >
                    <Edit2 size={14} className="text-gray-600" />
                  </button>
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conversation.id);
                    }}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquarePlus size={32} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">还没有对话</p>
            <p className="text-xs text-gray-500">点击上方按钮创建新对话</p>
          </div>
        )}
      </div>
    </div>
  );
};
