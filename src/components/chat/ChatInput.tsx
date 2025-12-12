import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Settings, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '../ui/Textarea';
import { ModelConfigModal } from './ModelConfigModal';
import { useModelStore } from '@/stores/modelStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
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
  const { currentModel } = useModelStore();

  useEffect(() => {
    if (editingMessageId && editingContent) {
      setMessage(editingContent);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [editingMessageId, editingContent]);

  const handleSubmit = () => {
    if (message.trim() && !isGenerating && !disabled) {
      if (isEditing && onConfirmEdit && editingMessageId) {
        onConfirmEdit(editingMessageId, message.trim());
      } else {
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
    if (e.key === 'Escape' && isEditing) {
      handleCancelEditing();
    }
  };

  const handleBlur = () => {
    if (isEditing) {
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="relative px-4 pb-4 pt-2">
      {/* Gradient fade effect at top */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-t from-[#f7f7f7]/80 via-[#f7f7f7]/50 to-transparent dark:from-[#1c1c1c]/80 dark:via-[#1c1c1c]/50 dark:to-transparent pointer-events-none -translate-y-full" />
      
      <div className="max-w-4xl mx-auto">
        {/* Input Container - Floating card style */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          
          <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 group-focus-within:border-purple-300/80 dark:group-focus-within:border-purple-600/50 group-focus-within:shadow-xl group-focus-within:shadow-purple-500/10 transition-all duration-300">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={disabled ? '请先选择或创建一个对话...' : isEditing ? '编辑消息...' : '输入消息，开始对话...'}
              disabled={disabled || isGenerating}
              className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent px-6 py-3 text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
              rows={1}
            />
            
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 pb-3">
              {/* Left Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="p-2.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200"
                  title="模型配置"
                >
                  <Settings size={18} />
                </button>
                <button
                  className="p-2.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200"
                  title="添加附件"
                >
                  <Paperclip size={18} />
                </button>
                {/* Current Model Display */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {currentModel.name}
                  </span>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <button
                    onClick={onStop}
                    className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:via-rose-600 hover:to-pink-600 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 overflow-hidden"
                    title="停止生成"
                  >
                    {/* Animated background pulse */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" />
                    
                    {/* Rotating border effect */}
                    <div className="absolute inset-0 rounded-xl opacity-75">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                    
                    {/* Icon */}
                    <StopCircle size={18} className="relative text-white animate-pulse" />
                  </button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!message.trim() || disabled}
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/25 disabled:opacity-40 disabled:shadow-none transition-all duration-200"
                  >
                    <Send size={16} className="text-white" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>

      <ModelConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </div>
  );
};
