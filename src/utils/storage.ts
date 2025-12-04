import localforage from 'localforage';
import { Conversation } from '@/types/conversation';

// 配置localforage
const conversationStore = localforage.createInstance({
    name: 'ai-agent',
    storeName: 'conversations',
});

// 存储对话
export async function saveConversation(conversation: Conversation): Promise<void> {
    await conversationStore.setItem(conversation.id, conversation);
}

// 获取单个对话
export async function getConversation(id: string): Promise<Conversation | null> {
    return await conversationStore.getItem<Conversation>(id);
}

// 获取所有对话
export async function getAllConversations(): Promise<Conversation[]> {
    const conversations: Conversation[] = [];
    await conversationStore.iterate<Conversation, void>((value) => {
        conversations.push(value);
    });
    // 按更新时间倒序排序
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
}

// 删除对话
export async function deleteConversation(id: string): Promise<void> {
    await conversationStore.removeItem(id);
}

// 清空所有对话
export async function clearAllConversations(): Promise<void> {
    await conversationStore.clear();
}
