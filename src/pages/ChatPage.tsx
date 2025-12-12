import React, { useEffect, useRef } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { useConversationStore } from '@/stores/conversationStore';
import { useChat } from '@/hooks/useChat';
import { Sparkles, MessageCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { currentConversationId, loadConversations } = useConversationStore();
  const {
    messages,
    isGenerating,
    sendMessage,
    regenerateMessage,
    retryMessage,
    deleteMessage,
    stopGenerating,
    editingMessageId,
    editingContent,
    startEditing,
    cancelEditing,
    editAndResend,
  } = useChat(currentConversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f0f4f8] dark:bg-[#1a1d24]">
        {/* Messages */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin transition-all duration-300 ${editingMessageId ? 'blur-sm pointer-events-none' : ''}`}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <Sparkles size={36} className="text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-30" />
              </div>
              <h2 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
                开始与AI对话
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {currentConversationId
                  ? '在下方输入框中输入消息，开启智能对话'
                  : '请先创建或选择一个对话'}
              </p>
              {!currentConversationId && (
                <div className="mt-6 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <MessageCircle size={16} />
                  <span>点击左侧 + 按钮创建新对话</span>
                </div>
              )}
            </div>
          ) : (
            <div className="px-8 w-full py-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onStartEditing={startEditing}
                  onDelete={deleteMessage}
                  onRegenerate={regenerateMessage}
                  onRetry={retryMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          onStop={stopGenerating}
          isGenerating={isGenerating}
          disabled={!currentConversationId}
          editingMessageId={editingMessageId}
          editingContent={editingContent}
          onCancelEditing={cancelEditing}
          onConfirmEdit={editAndResend}
        />
      </main>

      {/* Settings Panel */}
      <SettingsPanel />
    </div>
  );
};
