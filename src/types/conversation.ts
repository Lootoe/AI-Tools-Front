import { Message } from './message';

// 对话接口
export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    modelId: string;
    messages: Message[];
}

// 创建对话的参数
export interface CreateConversationParams {
    title?: string;
    modelId: string;
}
