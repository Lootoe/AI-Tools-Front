import { Message } from '@/types/message';
import { callAIService } from './api';
import { generateId } from '@/utils/formatters';
import { parseError, getStatusFromErrorType } from '@/utils/errorHandler';
import { useModelStore } from '@/stores/modelStore';
import { useConversationStore } from '@/stores/conversationStore';

const AI_RESPONSE_TIMEOUT = 30000;

export interface ChatServiceCallbacks {
    onGeneratingChange: (isGenerating: boolean) => void;
    setAbortController: (controller: AbortController | null) => void;
}

/**
 * 创建用户消息
 */
export function createUserMessage(conversationId: string, content: string): Message {
    return {
        id: generateId(),
        conversationId,
        role: 'user',
        content,
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
 */
export function buildMessageHistory(messages: Message[]) {
    return messages
        .filter(m => m.status === 'success')
        .map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
        }));
}

/**
 * 发送用户消息并获取 AI 回复
 */
export async function sendMessage(
    conversationId: string,
    content: string,
    callbacks: ChatServiceCallbacks
): Promise<void> {
    const { addMessage, updateMessageStatus } = useConversationStore.getState();

    const userMessage = createUserMessage(conversationId, content);
    await addMessage(conversationId, userMessage);

    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        await updateMessageStatus(conversationId, userMessage.id, 'success');
        await generateAIResponse(conversationId, callbacks);
    } catch (error) {
        const { errorType, errorMessage } = parseError(error);
        await updateMessageStatus(conversationId, userMessage.id, 'failed', errorType, errorMessage);
        throw error;
    }
}

/**
 * 生成 AI 回复
 */
export async function generateAIResponse(
    conversationId: string,
    callbacks: ChatServiceCallbacks
): Promise<void> {
    const { currentModel, parameters } = useModelStore.getState();
    const { addMessage, getCurrentConversation, updateMessageStatus, updateMessage } = useConversationStore.getState();

    const conversation = getCurrentConversation();
    if (!conversation) {
        throw new Error('对话不存在');
    }

    const assistantMessage = createAssistantMessage(conversationId);
    await addMessage(conversationId, assistantMessage);

    const abortController = new AbortController();
    callbacks.setAbortController(abortController);
    callbacks.onGeneratingChange(true);

    try {
        const messages = buildMessageHistory(conversation.messages);
        await updateMessageStatus(conversationId, assistantMessage.id, 'streaming');

        const timeoutId = setTimeout(() => abortController.abort(), AI_RESPONSE_TIMEOUT);

        const response = await callAIService({
            model: currentModel.id,
            messages,
            parameters,
            signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        await updateMessage(conversationId, assistantMessage.id, response.content);
        await updateMessageStatus(conversationId, assistantMessage.id, 'success');
    } catch (error) {
        const { errorType, errorMessage } = parseError(error);
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
    callbacks: ChatServiceCallbacks
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

    await generateAIResponse(conversationId, callbacks);
}

/**
 * 重试失败的消息
 */
export async function retryMessage(
    conversationId: string,
    messageId: string,
    callbacks: ChatServiceCallbacks
): Promise<void> {
    const { getCurrentConversation, deleteMessage } = useConversationStore.getState();
    const conversation = getCurrentConversation();

    if (!conversation) return;

    const message = conversation.messages.find(m => m.id === messageId);
    if (!message) return;

    if (message.role === 'user') {
        await deleteMessage(conversationId, messageId);
        await sendMessage(conversationId, message.content, callbacks);
    } else if (message.role === 'assistant') {
        await deleteMessage(conversationId, messageId);
        await generateAIResponse(conversationId, callbacks);
    }
}

/**
 * 编辑消息并重新发送
 */
export async function editAndResend(
    conversationId: string,
    messageId: string,
    newContent: string,
    callbacks: ChatServiceCallbacks
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

    await generateAIResponse(conversationId, callbacks);
}
