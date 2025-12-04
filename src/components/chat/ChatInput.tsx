import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating?: boolean;
  onStop?: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isGenerating = false,
  onStop,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isGenerating && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-4xl mx-auto flex gap-4 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '请先选择或创建一个对话...' : '输入消息... (Shift+Enter换行)'}
          disabled={disabled || isGenerating}
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={1}
        />
        {isGenerating ? (
          <Button
            onClick={onStop}
            variant="destructive"
            size="icon"
            className="flex-shrink-0"
          >
            <Square size={20} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            size="icon"
            className="flex-shrink-0"
          >
            <Send size={20} />
          </Button>
        )}
      </div>
    </div>
  );
};
