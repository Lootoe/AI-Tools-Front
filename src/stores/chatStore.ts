import { create } from 'zustand';
import { Message } from '@/types/message';
import { callAIService } from '@/services/api';
import { generateId } from '@/utils/formatters';
import { useModelStore } from './modelStore';
import { useConversationStore } from './conversationStore';

interface ChatState {
    isGenerating: boolean;
    currentStreamingMessage: string;

    sendMessage: (conversationId: string, content: string) => Promise<void>;
    regenerateMessage: (conversationId: string, messageId: string) => Promise<void>;
    stopGenerating: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    isGenerating: false,
    currentStreamingMessage: '',

    sendMessage: async (conversationId: string, content: string) => {
        const { currentModel, parameters } = useModelStore.getState();
        const { addMessage, getCurrentConversation } = useConversationStore.getState();

        // 创建用户消息
        const userMessage: Message = {
            id: generateId(),
            conversationId,
            role: 'user',
            content,
            timestamp: Date.now(),
            status: 'success',
        };

        await addMessage(conversationId, userMessage);

        // 创建助手消息占位符
        const assistantMessage: Message = {
            id: generateId(),
            conversationId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            status: 'sending',
        };

        await addMessage(conversationId, assistantMessage);

        set({ isGenerating: true, currentStreamingMessage: '' });

        try {
            const conversation = getCurrentConversation();
            if (!conversation) {
                throw new Error('对话不存在');
            }

            // 构建消息历史
            const messages = conversation.messages
                .filter(m => m.status === 'success')
                .map(m => ({
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content,
                }));

            // 调用AI服务
            const response = await callAIService({
                model: currentModel.id,
                messages,
                parameters,
            });

            // 更新助手消息
            const updatedMessage: Message = {
                ...assistantMessage,
                content: response.content,
                status: 'success',
            };

            const { updateMessage } = useConversationStore.getState();
            await updateMessage(conversationId, assistantMessage.id, response.content);

            set({ isGenerating: false, currentStreamingMessage: '' });
        } catch (error) {
            // 更新消息为错误状态
            const { updateMessage } = useConversationStore.getState();
            await updateMessage(
                conversationId,
                assistantMessage.id,
                `错误: ${error instanceof Error ? error.message : '未知错误'}`
            );

            set({ isGenerating: false, currentStreamingMessage: '' });
            throw error;
        }
    },

    regenerateMessage: async (conversationId: string, messageId: string) => {
        const { getCurrentConversation, deleteMessage } = useConversationStore.getState();
        const conversation = getCurrentConversation();

        if (!conversation) return;

        // 找到要重新生成的消息
        const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        // 删除该消息及之后的所有消息
        const messagesToDelete = conversation.messages.slice(messageIndex);
        for (const msg of messagesToDelete) {
            await deleteMessage(conversationId, msg.id);
        }

        // 重新发送前一条用户消息
        const previousUserMessage = conversation.messages
            .slice(0, messageIndex)
            .reverse()
            .find(m => m.role === 'user');

        if (previousUserMessage) {
            await get().sendMessage(conversationId, previousUserMessage.content);
        }
    },

    stopGenerating: () => {
        set({ isGenerating: false, currentStreamingMessage: '' });
    },
}));
