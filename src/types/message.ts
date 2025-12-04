// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 消息状态
export type MessageStatus = 'sending' | 'success' | 'error';

// 消息接口
export interface Message {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    timestamp: number;
    status?: MessageStatus;
    error?: string;
}

// 创建消息的参数
export interface CreateMessageParams {
    conversationId: string;
    role: MessageRole;
    content: string;
}
