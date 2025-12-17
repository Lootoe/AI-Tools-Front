import { useCallback, useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useEditingStore } from '@/stores/editingStore';
import { usePromptStore } from '@/stores/promptStore';
import { ImageAttachment } from '@/types/message';
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
    const { selectedPromptId, getPromptById } = usePromptStore();

    const conversation = getCurrentConversation();
    const messages = conversation?.messages || [];
    
    // 获取当前选中的提示词内容
    const systemPrompt = selectedPromptId ? getPromptById(selectedPromptId)?.content : undefined;

    // 创建 service 回调
    const callbacks = useMemo(() => ({
        onGeneratingChange: setIsGenerating,
        setAbortController,
    }), [setIsGenerating, setAbortController]);

    const handleSendMessage = useCallback(async (content: string, images?: ImageAttachment[]) => {
        if (!conversationId || (!content.trim() && (!images || images.length === 0))) return;
        try {
            await chatService.sendMessage(conversationId, content.trim(), callbacks, systemPrompt, images);
        } catch (error) {
            console.error('发送消息失败:', error);
        }
    }, [conversationId, callbacks, systemPrompt]);

    const handleRegenerateMessage = useCallback(async (messageId: string) => {
        if (!conversationId) return;
        try {
            await chatService.regenerateMessage(conversationId, messageId, callbacks, systemPrompt);
        } catch (error) {
            console.error('重新生成失败:', error);
        }
    }, [conversationId, callbacks, systemPrompt]);

    const handleRetryMessage = useCallback(async (messageId: string) => {
        if (!conversationId) return;
        try {
            await chatService.retryMessage(conversationId, messageId, callbacks, systemPrompt);
        } catch (error) {
            console.error('重试失败:', error);
        }
    }, [conversationId, callbacks, systemPrompt]);

    const handleEditAndResend = useCallback(async (messageId: string, newContent: string) => {
        if (!conversationId) return;
        try {
            clearEditing();
            await chatService.editAndResend(conversationId, messageId, newContent, callbacks, systemPrompt);
        } catch (error) {
            console.error('编辑并重新发送失败:', error);
        }
    }, [conversationId, callbacks, clearEditing, systemPrompt]);

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
