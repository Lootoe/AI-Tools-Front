import { useCallback, useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useEditingStore } from '@/stores/editingStore';
import * as chatService from '@/services/chatService';

export function useChat(conversationId: string | null) {
    const { isGenerating, setIsGenerating, setAbortController, stopGenerating } = useChatStore();
    const { getCurrentConversation, deleteMessage } = useConversationStore();
    const { 
        editingMessageId, 
        editingContent, 
        startEditing, 
        cancelEditing, 
        clearEditing 
    } = useEditingStore();

    const conversation = getCurrentConversation();
    const messages = conversation?.messages || [];

    // 创建 service 回调
    const callbacks = useMemo(() => ({
        onGeneratingChange: setIsGenerating,
        setAbortController,
    }), [setIsGenerating, setAbortController]);

    const handleSendMessage = useCallback(async (content: string) => {
        if (!conversationId || !content.trim()) return;
        try {
            await chatService.sendMessage(conversationId, content.trim(), callbacks);
        } catch (error) {
            console.error('发送消息失败:', error);
        }
    }, [conversationId, callbacks]);

    const handleRegenerateMessage = useCallback(async (messageId: string) => {
        if (!conversationId) return;
        try {
            await chatService.regenerateMessage(conversationId, messageId, callbacks);
        } catch (error) {
            console.error('重新生成失败:', error);
        }
    }, [conversationId, callbacks]);

    const handleRetryMessage = useCallback(async (messageId: string) => {
        if (!conversationId) return;
        try {
            await chatService.retryMessage(conversationId, messageId, callbacks);
        } catch (error) {
            console.error('重试失败:', error);
        }
    }, [conversationId, callbacks]);

    const handleEditAndResend = useCallback(async (messageId: string, newContent: string) => {
        if (!conversationId) return;
        try {
            clearEditing();
            await chatService.editAndResend(conversationId, messageId, newContent, callbacks);
        } catch (error) {
            console.error('编辑并重新发送失败:', error);
        }
    }, [conversationId, callbacks, clearEditing]);

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!conversationId) return;
        try {
            await deleteMessage(conversationId, messageId);
        } catch (error) {
            console.error('删除消息失败:', error);
        }
    }, [conversationId, deleteMessage]);

    return {
        messages,
        isGenerating,
        sendMessage: handleSendMessage,
        regenerateMessage: handleRegenerateMessage,
        retryMessage: handleRetryMessage,
        deleteMessage: handleDeleteMessage,
        stopGenerating,
        // 编辑模式
        editingMessageId,
        editingContent,
        startEditing,
        cancelEditing,
        editAndResend: handleEditAndResend,
    };
}
