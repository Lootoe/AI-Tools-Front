import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '../ui/Textarea';
import { ModelConfigModal } from './ModelConfigModal';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  // 编辑模式相关
  editingMessageId?: string | null;
  editingContent?: string;
  onCancelEditing?: () => void;
  onConfirmEdit?: (messageId: string, content: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isGenerating = false,
  disabled = false,
  editingMessageId,
  editingContent = '',
  onCancelEditing,
  onConfirmEdit,
}) => {
  const [message, setMessage] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = !!editingMessageId;

  // 当进入编辑模式时，设置内容并聚焦
  useEffect(() => {
    if (editingMessageId && editingContent) {
      setMessage(editingContent);
      // 延迟聚焦，确保内容已设置
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [editingMessageId, editingContent]);

  const handleSubmit = () => {
    if (message.trim() && !isGenerating && !disabled) {
      if (isEditing && onConfirmEdit && editingMessageId) {
        // 编辑模式：提交编辑
        onConfirmEdit(editingMessageId, message.trim());
      } else {
        // 普通模式：发送新消息
        onSend(message.trim());
      }
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // ESC 键取消编辑
    if (e.key === 'Escape' && isEditing) {
      handleCancelEditing();
    }
  };

  const handleBlur = () => {
    // 失焦时，如果处于编辑模式且没有发送，则取消编辑并清空输入框
    if (isEditing) {
      // 使用 setTimeout 避免点击发送按钮时触发
      setTimeout(() => {
        if (document.activeElement !== textareaRef.current) {
          handleCancelEditing();
        }
      }, 150);
    }
  };

  const handleCancelEditing = () => {
    setMessage('');
    onCancelEditing?.();
  };

  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      <div className="max-w-full mx-auto px-6 py-4">
        {/* 主输入区域 */}
        <div className="relative rounded-3xl border border-border/50 bg-muted/30 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/40 focus-within:bg-background">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={disabled ? '请先选择或创建一个对话...' : isEditing ? '编辑消息...' : '和AI聊点什么'}
            disabled={disabled || isGenerating}
            className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent px-6 py-4 text-base placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          
          {/* 底部工具栏 */}
          <div className="flex items-center justify-between px-4 pb-3">
            {/* 左侧功能按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfigModal(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                title="模型配置"
              >
                <Settings size={18} />
              </button>
            </div>

            {/* 右侧发送/中断按钮 */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
                <Plus size={18} />
              </button>
              {isGenerating ? (
                <Button
                  onClick={onStop}
                  size="icon"
                  variant="destructive"
                  className="h-9 w-9 rounded-xl"
                  title="中断生成"
                >
                  <Square size={16} />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!message.trim() || disabled}
                  size="icon"
                  className="h-9 w-9 rounded-xl transition-all duration-200 disabled:opacity-40"
                >
                  <Send size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 模型配置弹框 */}
      <ModelConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </div>
  );
};
