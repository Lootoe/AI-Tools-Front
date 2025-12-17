import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, StopCircle, X, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '../ui/Textarea';
import { ModelConfigModal } from './ModelConfigModal';
import { useModelStore } from '@/stores/modelStore';
import { usePromptStore } from '@/stores/promptStore';
import { uploadImage } from '@/services/api';
import { ImageAttachment } from '@/types/message';

interface ChatInputProps {
  onSend: (message: string, images?: ImageAttachment[]) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  editingMessageId?: string | null;
  editingContent?: string;
  onCancelEditing?: () => void;
  onConfirmEdit?: (messageId: string, content: string) => void;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  uploading: boolean;
  error?: string;
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
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!editingMessageId;
  const { currentModel } = useModelStore();
  const { selectedPromptId, getPromptById, selectPrompt } = usePromptStore();
  const selectedPrompt = selectedPromptId ? getPromptById(selectedPromptId) : null;

  // 处理图片选择
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: PendingImage[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const previewUrl = URL.createObjectURL(file);

      newImages.push({
        id,
        file,
        previewUrl,
        uploading: true,
      });
    }

    setPendingImages((prev) => [...prev, ...newImages]);

    // 上传图片（直接上传 File）
    for (const img of newImages) {
      try {
        const result = await uploadImage(img.file);

        setPendingImages((prev) =>
          prev.map((p) => (p.id === img.id ? { ...p, uploadedUrl: result.url, uploading: false } : p))
        );
      } catch (error) {
        setPendingImages((prev) =>
          prev.map((p) =>
            p.id === img.id
              ? { ...p, uploading: false, error: error instanceof Error ? error.message : '上传失败' }
              : p
          )
        );
      }
    }

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 移除待上传图片
  const removeImage = (id: string) => {
    setPendingImages((prev) => {
      const img = prev.find((p) => p.id === id);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  useEffect(() => {
    if (editingMessageId && editingContent) {
      setMessage(editingContent);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [editingMessageId, editingContent]);

  const handleSubmit = () => {
    const hasContent = message.trim() || pendingImages.some(img => img.uploadedUrl);
    const hasUploadingImages = pendingImages.some(img => img.uploading);
    
    if (hasContent && !isGenerating && !disabled && !hasUploadingImages) {
      if (isEditing && onConfirmEdit && editingMessageId) {
        onConfirmEdit(editingMessageId, message.trim());
      } else {
        // 收集已上传的图片
        const images: ImageAttachment[] = pendingImages
          .filter(img => img.uploadedUrl)
          .map(img => ({
            url: img.uploadedUrl!,
            previewUrl: img.previewUrl,
          }));
        
        onSend(message.trim(), images.length > 0 ? images : undefined);
        
        // 清理预览 URL
        pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        setPendingImages([]);
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
            {/* 图片预览区域 */}
            {pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {pendingImages.map(img => (
                  <div key={img.id} className="relative group/img">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                      <img 
                        src={img.previewUrl} 
                        alt="预览" 
                        className="w-full h-full object-cover"
                      />
                      {img.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 size={20} className="text-white animate-spin" />
                        </div>
                      )}
                      {img.error && (
                        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                          <span className="text-white text-xs text-center px-1">失败</span>
                        </div>
                      )}
                      {img.uploadedUrl && !img.uploading && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
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
            
            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
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
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200"
                  title="添加图片"
                  disabled={disabled || isGenerating}
                >
                  <Image size={18} />
                </button>
                {/* Current Model Display */}
                {currentModel && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                      {currentModel.name}
                    </span>
                  </div>
                )}
                {/* Selected Prompt Display */}
                {selectedPrompt && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      {selectedPrompt.name}
                    </span>
                    <button
                      onClick={() => selectPrompt(null)}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                      title="取消使用提示词"
                    >
                      ×
                    </button>
                  </div>
                )}
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
                    disabled={(!message.trim() && !pendingImages.some(img => img.uploadedUrl)) || disabled || pendingImages.some(img => img.uploading)}
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
