// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 消息状态
export type MessageStatus = 
    | 'pending'      // 用户消息发送中
    | 'success'      // 发送/回复成功
    | 'failed'       // 发送/回复失败
    | 'loading'      // AI等待响应
    | 'streaming'    // AI流式输出中
    | 'timeout'      // AI回复超时
    | 'interrupted'; // 用户中断生成

// 错误类型
export type MessageErrorType = 
    | 'network_error'     // 网络错误
    | 'timeout_error'     // 超时错误
    | 'api_error'         // API错误
    | 'rate_limit_error'  // 频率限制
    | 'interrupted'       // 用户中断
    | 'unknown_error';    // 未知错误

// 图片附件
export interface ImageAttachment {
    url: string;
    previewUrl?: string; // 本地预览用
}

// 消息接口
export interface Message {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    images?: ImageAttachment[]; // 图片附件
    timestamp: number;
    status: MessageStatus;
    errorType?: MessageErrorType;
    errorMessage?: string;
}

// 创建消息的参数
export interface CreateMessageParams {
    conversationId: string;
    role: MessageRole;
    content: string;
}
