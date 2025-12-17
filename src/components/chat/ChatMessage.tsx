import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '@/types/message';
import { cn } from '@/utils/cn';
import { User, Edit2, Trash2, RotateCw, Loader2, AlertCircle, Clock, StopCircle, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import 'highlight.js/styles/atom-one-dark.css';

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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const handleCodeCopy = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('复制代码失败:', error);
    }
  };

  // 递归提取 React 元素中的文本内容
  const extractTextFromChildren = (children: any): string => {
    if (typeof children === 'string') {
      return children;
    }
    if (Array.isArray(children)) {
      return children.map(extractTextFromChildren).join('');
    }
    if (children?.props?.children) {
      return extractTextFromChildren(children.props.children);
    }
    return '';
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

              {/* 图片显示 */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.images.map((img, index) => (
                    <a 
                      key={index} 
                      href={img.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img 
                        src={img.url} 
                        alt={`图片 ${index + 1}`}
                        className="max-w-[200px] max-h-[200px] rounded-lg object-cover hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* Message Content */}
              {message.content && (
                <div className={cn(
                  'prose prose-sm max-w-none',
                  isUser 
                    ? 'prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-code:text-white prose-pre:bg-white/10' 
                    : 'prose-gray dark:prose-invert'
                )}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed m-0">
                      {message.content}
                    </p>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code: ({ inline, className, children, ...props }: any) => {
                          return !inline ? (
                            <code className={cn('block', className)} {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children, ...props }: any) => {
                          const codeContent = extractTextFromChildren(children);
                          const codeId = `code-${message.id}-${Math.random().toString(36).substring(2, 11)}`;
                          const isCopied = copiedCode === codeId;
                          
                          return (
                            <div className="relative group/code my-3">
                              <pre className="rounded-lg overflow-x-auto bg-gray-900 dark:bg-gray-950" {...props}>
                                {children}
                              </pre>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCodeCopy(codeContent, codeId)}
                                className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm opacity-0 group-hover/code:opacity-100 transition-opacity"
                                title="复制代码"
                              >
                                {isCopied ? (
                                  <Check size={14} className="text-green-400" />
                                ) : (
                                  <Copy size={14} className="text-gray-300" />
                                )}
                              </Button>
                            </div>
                          );
                        },
                        p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }: any) => <ul className="my-2 ml-6 list-disc space-y-1">{children}</ul>,
                        ol: ({ children }: any) => <ol className="my-2 ml-6 list-decimal space-y-1">{children}</ol>,
                        li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
                        h1: ({ children }: any) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
                        h2: ({ children }: any) => <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h2>,
                        h3: ({ children }: any) => <h3 className="text-base font-bold mt-2 mb-1 first:mt-0">{children}</h3>,
                        h4: ({ children }: any) => <h4 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h4>,
                        blockquote: ({ children }: any) => (
                          <blockquote className="border-l-4 border-purple-500 dark:border-purple-600 pl-4 my-3 italic text-gray-700 dark:text-gray-300">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }: any) => (
                          <div className="overflow-x-auto my-3 rounded-lg border border-gray-300 dark:border-gray-600">
                            <table className="min-w-full border-collapse">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }: any) => (
                          <thead className="bg-gray-100 dark:bg-gray-800">
                            {children}
                          </thead>
                        ),
                        th: ({ children }: any) => (
                          <th className="border-b border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }: any) => (
                          <td className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                            {children}
                          </td>
                        ),
                        a: ({ children, href }: any) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            {children}
                          </a>
                        ),
                        hr: () => <hr className="my-4 border-gray-300 dark:border-gray-600" />,
                        strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }: any) => <em className="italic">{children}</em>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
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
