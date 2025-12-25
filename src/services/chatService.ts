import { Message, ImageAttachment } from '@/types/message';
import { callAIServiceStream } from './api';
import { generateId } from '@/utils/formatters';
import { parseError, getStatusFromErrorType } from '@/utils/errorHandler';
import { useModelStore } from '@/stores/modelStore';
import { useConversationStore } from '@/stores/conversationStore';

// 单次数据块超时时间（如果超过这个时间没收到新数据，才认为超时）
const CHUNK_TIMEOUT = 180000; // 3分钟

export interface ChatServiceCallbacks {
    onGeneratingChange: (isGenerating: boolean) => void;
    setAbortController: (controller: AbortController | null) => void;
}

/**
 * 创建用户消息
 */
export function createUserMessage(conversationId: string, content: string, images?: ImageAttachment[]): Message {
    return {
        id: generateId(),
        conversationId,
        role: 'user',
        content,
        images,
        timestamp: Date.now(),
        status: 'pending',
    };
}

/**
 * 创建助手消息占位符
 */
export function createAssistantMessage(conversationId: string): Message {
    return {
        id: generateId(),
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'loading',
    };
}

/**
 * 构建发送给 AI 的消息历史
 * 图片作为独立字段传递，不混入 content
 */
export function buildMessageHistory(messages: Message[], systemPrompt?: string) {
    const history = messages
        .filter(m => m.status === 'success')
        .map(m => {
            const result: {
                role: 'user' | 'assistant' | 'system';
                content: string;
                images?: { url: string }[];
            } = {
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
            };
            
            // 图片作为独立字段
            if (m.images && m.images.length > 0) {
                result.images = m.images.map(img => ({ url: img.url }));
            }
            
            return result;
        });
    
    // 如果有系统提示词，添加到消息历史的开头
    if (systemPrompt) {
        return [
            { role: 'system' as const, content: systemPrompt },
            ...history
        ];
    }
    
    return history;
}

/**
 * 发送用户消息并获取 AI 回复
 */
export async function sendMessage(
    conversationId: string,
    content: string,
    callbacks: ChatServiceCallbacks,
    systemPrompt?: string,
    images?: ImageAttachment[]
): Promise<void> {
    const { addMessage, updateMessageStatus } = useConversationStore.getState();

    const userMessage = createUserMessage(conversationId, content, images);
    await addMessage(conversationId, userMessage);

    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        await updateMessageStatus(conversationId, userMessage.id, 'success');
        await generateAIResponse(conversationId, callbacks, systemPrompt);
    } catch (error) {
        const { errorType, errorMessage } = parseError(error);
        await updateMessageStatus(conversationId, userMessage.id, 'failed', errorType, errorMessage);
        throw error;
    }
}

/**
 * 生成 AI 回复（流式）
 */
export async function generateAIResponse(
    conversationId: string,
    callbacks: ChatServiceCallbacks,
    systemPrompt?: string
): Promise<void> {
    const { currentModel, parameters } = useModelStore.getState();
    const { addMessage, getCurrentConversation, updateMessageStatus, updateMessage } = useConversationStore.getState();

    const conversation = getCurrentConversation();
    if (!conversation) {
        throw new Error('对话不存在');
    }

    if (!currentModel) {
        throw new Error('请先选择模型');
    }

    const assistantMessage = createAssistantMessage(conversationId);
    await addMessage(conversationId, assistantMessage);

    const abortController = new AbortController();
    callbacks.setAbortController(abortController);
    callbacks.onGeneratingChange(true);

    try {
        const messages = buildMessageHistory(conversation.messages, systemPrompt);
        await updateMessageStatus(conversationId, assistantMessage.id, 'streaming');

        // 使用可重置的超时机制：每次收到数据时重置计时器
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        
        const resetTimeout = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                abortController.abort();
            }, CHUNK_TIMEOUT);
        };
        
        // 初始化超时
        resetTimeout();

        let fullContent = '';
        const stream = callAIServiceStream({
            model: currentModel.id,
            messages,
            parameters,
            signal: abortController.signal,
        });

        for await (const chunk of stream) {
            // 每次收到数据时重置超时计时器
            resetTimeout();
            fullContent += chunk;
            await updateMessage(conversationId, assistantMessage.id, fullContent);
        }

        if (timeoutId) clearTimeout(timeoutId);
        await updateMessageStatus(conversationId, assistantMessage.id, 'success');
    } catch (error) {
        const { errorType, errorMessage } = parseError(error);
        
        // 用户主动中断，静默处理，不显示错误
        if (errorType === 'interrupted') {
            await updateMessageStatus(conversationId, assistantMessage.id, 'interrupted');
            return; // 不抛出错误
        }
        
        const status = getStatusFromErrorType(errorType);
        await updateMessageStatus(conversationId, assistantMessage.id, status, errorType, errorMessage);
        throw error;
    } finally {
        callbacks.onGeneratingChange(false);
        callbacks.setAbortController(null);
    }
}

/**
 * 重新生成 AI 回复（删除指定消息及之后的消息）
 */
export async function regenerateMessage(
    conversationId: string,
    messageId: string,
    callbacks: ChatServiceCallbacks,
    systemPrompt?: string
): Promise<void> {
    const { getCurrentConversation, deleteMessage } = useConversationStore.getState();
    const conversation = getCurrentConversation();

    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const messagesToDelete = conversation.messages.slice(messageIndex);
    for (const msg of messagesToDelete) {
        await deleteMessage(conversationId, msg.id);
    }

    await generateAIResponse(conversationId, callbacks, systemPrompt);
}

/**
 * 重试失败的消息
 */
export async function retryMessage(
    conversationId: string,
    messageId: string,
    callbacks: ChatServiceCallbacks,
    systemPrompt?: string
): Promise<void> {
    const { getCurrentConversation, deleteMessage } = useConversationStore.getState();
    const conversation = getCurrentConversation();

    if (!conversation) return;

    const message = conversation.messages.find(m => m.id === messageId);
    if (!message) return;

    if (message.role === 'user') {
        await deleteMessage(conversationId, messageId);
        await sendMessage(conversationId, message.content, callbacks, systemPrompt);
    } else if (message.role === 'assistant') {
        await deleteMessage(conversationId, messageId);
        await generateAIResponse(conversationId, callbacks, systemPrompt);
    }
}

/**
 * 编辑消息并重新发送
 */
export async function editAndResend(
    conversationId: string,
    messageId: string,
    newContent: string,
    callbacks: ChatServiceCallbacks,
    systemPrompt?: string
): Promise<void> {
    const { getCurrentConversation, deleteMessage, updateMessage } = useConversationStore.getState();
    const conversation = getCurrentConversation();

    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    await updateMessage(conversationId, messageId, newContent);

    const messagesToDelete = conversation.messages.slice(messageIndex + 1);
    for (const msg of messagesToDelete) {
        await deleteMessage(conversationId, msg.id);
    }

    await generateAIResponse(conversationId, callbacks, systemPrompt);
}
