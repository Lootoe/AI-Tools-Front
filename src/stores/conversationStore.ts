import { create } from 'zustand';
import { Conversation } from '@/types/conversation';
import { Message } from '@/types/message';
import { generateId, generateConversationTitle } from '@/utils/formatters';
import {
    saveConversation,
    getConversation,
    getAllConversations,
    deleteConversation as deleteConversationStorage,
} from '@/utils/storage';

interface ConversationState {
    conversations: Conversation[];
    currentConversationId: string | null;
    isLoading: boolean;

    // 操作
    loadConversations: () => Promise<void>;
    createConversation: (modelId: string) => Promise<string>;
    selectConversation: (id: string) => void;
    deleteConversation: (id: string) => Promise<void>;
    updateConversationTitle: (id: string, title: string) => Promise<void>;

    // 消息操作
    addMessage: (conversationId: string, message: Message) => Promise<void>;
    updateMessage: (conversationId: string, messageId: string, content: string) => Promise<void>;
    deleteMessage: (conversationId: string, messageId: string) => Promise<void>;

    // 获取当前对话
    getCurrentConversation: () => Conversation | null;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
    conversations: [],
    currentConversationId: null,
    isLoading: false,

    loadConversations: async () => {
        set({ isLoading: true });
        try {
            const conversations = await getAllConversations();
            set({ conversations, isLoading: false });
        } catch (error) {
            console.error('加载对话列表失败:', error);
            set({ isLoading: false });
        }
    },

    createConversation: async (modelId: string) => {
        const newConversation: Conversation = {
            id: generateId(),
            title: '新对话',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            modelId,
            messages: [],
        };

        await saveConversation(newConversation);
        set((state) => ({
            conversations: [newConversation, ...state.conversations],
            currentConversationId: newConversation.id,
        }));

        return newConversation.id;
    },

    selectConversation: (id: string) => {
        set({ currentConversationId: id });
    },

    deleteConversation: async (id: string) => {
        await deleteConversationStorage(id);
        set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== id),
            currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
    },

    updateConversationTitle: async (id: string, title: string) => {
        const conversation = await getConversation(id);
        if (!conversation) return;

        const updated = { ...conversation, title, updatedAt: Date.now() };
        await saveConversation(updated);

        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === id ? updated : c
            ),
        }));
    },

    addMessage: async (conversationId: string, message: Message) => {
        const conversation = await getConversation(conversationId);
        if (!conversation) return;

        const updatedMessages = [...conversation.messages, message];
        const updated = {
            ...conversation,
            messages: updatedMessages,
            updatedAt: Date.now(),
            // 如果是第一条用户消息，自动生成标题
            title: conversation.messages.length === 0 && message.role === 'user'
                ? generateConversationTitle(message.content)
                : conversation.title,
        };

        await saveConversation(updated);

        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? updated : c
            ),
        }));
    },

    updateMessage: async (conversationId: string, messageId: string, content: string) => {
        const conversation = await getConversation(conversationId);
        if (!conversation) return;

        const updated = {
            ...conversation,
            messages: conversation.messages.map((m) =>
                m.id === messageId ? { ...m, content } : m
            ),
            updatedAt: Date.now(),
        };

        await saveConversation(updated);

        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? updated : c
            ),
        }));
    },

    deleteMessage: async (conversationId: string, messageId: string) => {
        const conversation = await getConversation(conversationId);
        if (!conversation) return;

        const updated = {
            ...conversation,
            messages: conversation.messages.filter((m) => m.id !== messageId),
            updatedAt: Date.now(),
        };

        await saveConversation(updated);

        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? updated : c
            ),
        }));
    },

    getCurrentConversation: () => {
        const { conversations, currentConversationId } = get();
        return conversations.find((c) => c.id === currentConversationId) || null;
    },
}));
