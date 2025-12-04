import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useConversationStore } from '@/stores/conversationStore';

export function useChat(conversationId: string | null) {
    const { sendMessage, regenerateMessage, isGenerating, stopGenerating } = useChatStore();
    const { getCurrentConversation, addMessage, updateMessage, deleteMessage } = useConversationStore();

    const conversation = getCurrentConversation();
    const messages = conversation?.messages || [];

    const handleSendMessage = async (content: string) => {
        if (!conversationId || !content.trim()) return;
        try {
            await sendMessage(conversationId, content.trim());
        } catch (error) {
            console.error('发送消息失败:', error);
        }
    };

    const handleRegenerateMessage = async (messageId: string) => {
        if (!conversationId) return;
        try {
            await regenerateMessage(conversationId, messageId);
        } catch (error) {
            console.error('重新生成失败:', error);
        }
    };

    const handleEditMessage = async (messageId: string, newContent: string) => {
        if (!conversationId) return;
        try {
            await updateMessage(conversationId, messageId, newContent);
        } catch (error) {
            console.error('编辑消息失败:', error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!conversationId) return;
        try {
            await deleteMessage(conversationId, messageId);
        } catch (error) {
            console.error('删除消息失败:', error);
        }
    };

    return {
        messages,
        isGenerating,
        sendMessage: handleSendMessage,
        regenerateMessage: handleRegenerateMessage,
        editMessage: handleEditMessage,
        deleteMessage: handleDeleteMessage,
        stopGenerating,
    };
}
