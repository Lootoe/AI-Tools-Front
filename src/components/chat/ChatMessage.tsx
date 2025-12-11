import React, { useState } from 'react';
import { Message } from '@/types/message';
import { cn } from '@/utils/cn';
import { Bot, User, Edit2, Trash2, RotateCw, Loader2, AlertCircle, Clock, StopCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // 获取错误提示文本
  const getErrorText = () => {
    if (message.status === 'timeout') return 'AI回复超时';
    if (message.status === 'interrupted') return '生成已中断';
    if (message.errorMessage) return message.errorMessage;
    return '发送失败';
  };

  // 获取状态图标
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
        'group flex gap-3 py-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        'flex gap-3 max-w-[60%]',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* 头像 */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            )}
          >
            {isUser ? <User size={18} /> : <Bot size={18} />}
          </div>
        </div>

        {/* 消息气泡 */}
        <div className={cn(
          'flex-1 space-y-2',
          isUser ? 'items-end' : 'items-start'
        )}>
          <div className="relative group/message">
            <div
              className={cn(
                'rounded-2xl px-4 py-2.5 shadow-sm',
                isUser
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-muted/50 rounded-tl-sm',
                (hasError || isInterrupted) && 'border border-destructive/30'
              )}
            >
              {/* Loading状态 */}
              {isLoading && !message.content && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  <span>{message.status === 'loading' ? '正在思考...' : '正在生成...'}</span>
                </div>
              )}

              {/* 消息内容 */}
              {message.content && (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message.content}
                </p>
              )}

              {/* 失败状态显示在气泡内 */}
              {(hasError || isInterrupted) && (
                <div className={cn(
                  "flex items-center gap-1.5 text-xs mt-2 pt-2 border-t",
                  isUser ? "border-primary-foreground/20 text-primary-foreground/80" : "border-destructive/20 text-destructive"
                )}>
                  {getStatusIcon()}
                  <span>{getErrorText()}</span>
                </div>
              )}
            </div>
            
            {/* 操作按钮 */}
            {isHovered && !isLoading && (
              <div className={cn(
                'absolute top-0 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity',
                isUser ? 'right-full mr-2' : 'left-full ml-2'
              )}>
                {/* 复制按钮 - 所有消息都有 */}
                {message.content && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-7 w-7 bg-background/80 backdrop-blur"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </Button>
                )}
                {/* 编辑按钮 - 用户消息成功或失败都可以编辑 */}
                {isUser && onStartEditing && (message.status === 'success' || hasError || isInterrupted) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStartEditing(message.id, message.content)}
                    className="h-7 w-7 bg-background/80 backdrop-blur"
                  >
                    <Edit2 size={14} />
                  </Button>
                )}
                {/* 重新生成按钮 - AI消息成功时 */}
                {!isUser && onRegenerate && message.status === 'success' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRegenerate(message.id)}
                    className="h-7 w-7 bg-background/80 backdrop-blur"
                  >
                    <RotateCw size={14} />
                  </Button>
                )}
                {/* 重试按钮 - 失败或中断时显示图标 */}
                {(hasError || isInterrupted) && onRetry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRetry(message.id)}
                    className="h-7 w-7 bg-background/80 backdrop-blur text-amber-500 hover:text-amber-600"
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
                    className="h-7 w-7 text-destructive hover:text-destructive bg-background/80 backdrop-blur"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* 发送中状态提示 */}
          {isPending && (
            <div className="flex items-center gap-2 px-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {getStatusIcon()}
                <span>发送中...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
