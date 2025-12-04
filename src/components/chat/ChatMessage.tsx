import React, { useState } from 'react';
import { Message } from '@/types/message';
import { cn } from '@/utils/cn';
import { Bot, User, Edit2, Trash2, RotateCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface ChatMessageProps {
  message: Message;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onEdit,
  onDelete,
  onRegenerate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(message.id, editedContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'group flex gap-4 px-4 py-6 hover:bg-muted/50 transition-colors',
        message.role === 'assistant' && 'bg-muted/20'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 头像 */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          )}
        >
          {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
        </div>
      </div>

      {/* 消息内容 */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {message.role === 'user' ? '你' : 'AI助手'}
          </span>
          {isHovered && !isEditing && (
            <div className="flex gap-1">
              {message.role === 'user' && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8"
                >
                  <Edit2 size={14} />
                </Button>
              )}
              {message.role === 'assistant' && onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRegenerate(message.id)}
                  className="h-8 w-8"
                >
                  <RotateCw size={14} />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(message.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                保存
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                取消
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        )}

        {message.status === 'error' && (
          <div className="text-sm text-destructive">发送失败</div>
        )}
      </div>
    </div>
  );
};
