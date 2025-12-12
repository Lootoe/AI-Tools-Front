import React, { useState } from 'react';
import { Message } from '@/types/message';
import { cn } from '@/utils/cn';
import { User, Edit2, Trash2, RotateCw, Loader2, AlertCircle, Clock, StopCircle, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatMessageProps {
  message: Message;
  onStartEditing?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onStartEditing,
  onDelete,
  onRegenerate,
  onRetry,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const isLoading = message.status === 'loading' || message.status === 'streaming';
  const hasError = message.status === 'failed' || message.status === 'timeout';
  const isInterrupted = message.status === 'interrupted';
  const isPending = message.status === 'pending';

  const getErrorText = () => {
    if (message.status === 'timeout') return 'AI回复超时';
    if (message.status === 'interrupted') return '生成已中断';
    if (message.errorMessage) return message.errorMessage;
    return '发送失败';
  };

  const getStatusIcon = () => {
    if (isPending) return <Loader2 size={14} className="animate-spin" />;
    if (isLoading) return <Loader2 size={14} className="animate-spin" />;
    if (message.status === 'timeout') return <Clock size={14} />;
    if (message.status === 'interrupted') return <StopCircle size={14} />;
    if (hasError) return <AlertCircle size={14} />;
    return null;
  };

  return (
    <div
      className={cn(
        'group flex gap-4 py-4 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        'flex gap-4 max-w-[70%]',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center',
              isUser 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            {isUser ? <User size={16} /> : <Sparkles size={16} />}
          </div>
        </div>

        {/* Message Bubble */}
        <div className={cn(
          'flex-1 space-y-2',
          isUser ? 'items-end' : 'items-start'
        )}>
          <div className="relative group/message">
            <div
              className={cn(
                'rounded-2xl px-4 py-3 shadow-sm',
                isUser
                  ? 'bg-blue-500 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm',
                (hasError || isInterrupted) && !isUser && '!bg-orange-100 dark:!bg-orange-900/30'
              )}
            >
              {/* Loading State */}
              {isLoading && !message.content && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full typing-dot" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full typing-dot" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full typing-dot" />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {message.status === 'loading' ? '正在思考...' : '正在生成...'}
                  </span>
                </div>
              )}

              {/* Message Content */}
              {message.content && (
                <p className={cn(
                  'whitespace-pre-wrap break-words text-sm leading-relaxed',
                  isUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                )}>
                  {message.content}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            {isHovered && !isLoading && (
              <div className={cn(
                'absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-all duration-200',
                isUser ? 'right-full mr-2' : 'left-full ml-2'
              )}>
                {message.content && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-8 w-8 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </Button>
                )}
                {isUser && onStartEditing && (message.status === 'success' || hasError || isInterrupted) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStartEditing(message.id, message.content)}
                    className="h-8 w-8 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                  >
                    <Edit2 size={14} />
                  </Button>
                )}
                {!isUser && onRegenerate && message.status === 'success' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRegenerate(message.id)}
                    className="h-8 w-8 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                  >
                    <RotateCw size={14} />
                  </Button>
                )}
                {(hasError || isInterrupted) && onRetry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRetry(message.id)}
                    className="h-8 w-8 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md text-amber-500 hover:text-amber-600 transition-all"
                    title="重试"
                  >
                    <RotateCw size={14} />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(message.id)}
                    className="h-8 w-8 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md text-red-500 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pending State */}
          {isPending && (
            <div className="flex items-center gap-2 px-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {getStatusIcon()}
                <span>发送中...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {(hasError || isInterrupted) && (
            <div className="flex items-center gap-2 px-2">
              <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                {getStatusIcon()}
                <span>{getErrorText()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
