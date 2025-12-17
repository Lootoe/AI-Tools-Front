import { AIModel, ModelParameters } from '@/types/models';

// 后端API地址
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// 图片上传响应
export interface ImageUploadResponse {
    success: boolean;
    url: string;
}

// 上传图片到图床（使用 File 对象）
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
    const token = getAuthToken();

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`图片上传失败: ${error.error || error.message || response.statusText}`);
    }

    return response.json();
}

// 获取存储的 token (移到前面以便 uploadImage 使用)
function getAuthToken(): string | null {
    return localStorage.getItem('token');
}

// 获取模型列表
export async function fetchModels(): Promise<AIModel[]> {
    const response = await fetch(`${BACKEND_URL}/api/models`);
    if (!response.ok) {
        throw new Error('获取模型列表失败');
    }
    return response.json();
}

// API请求接口
export interface ChatRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    parameters: ModelParameters;
    stream?: boolean;
    signal?: AbortSignal;
}

// API响应接口
export interface ChatResponse {
    id: string;
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

// 统一的AI服务调用接口（非流式）
export async function callAIService(request: ChatRequest): Promise<ChatResponse> {
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages,
                parameters: {
                    temperature: request.parameters.temperature,
                    topP: request.parameters.topP,
                    presencePenalty: request.parameters.presencePenalty,
                    frequencyPenalty: request.parameters.frequencyPenalty,
                },
            }),
            signal: request.signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`API调用失败: ${error.error || error.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            id: data.id,
            content: data.content,
            model: data.model,
            usage: data.usage,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`API调用失败: ${error.message}`);
        }
        throw error;
    }
}

// 流式AI服务调用接口
export async function* callAIServiceStream(
    request: ChatRequest
): AsyncGenerator<string, ChatResponse, unknown> {
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat/completions/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages,
                parameters: {
                    temperature: request.parameters.temperature,
                    topP: request.parameters.topP,
                    presencePenalty: request.parameters.presencePenalty,
                    frequencyPenalty: request.parameters.frequencyPenalty,
                },
            }),
            signal: request.signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`API调用失败: ${error.error || error.message || response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let responseId = '';
        let responseModel = request.model;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
                    
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);
                            
                            if (data.type === 'chunk' && data.content) {
                                fullContent += data.content;
                                yield data.content;
                            } else if (data.type === 'done') {
                                responseId = data.id || responseId;
                            } else if (data.type === 'error') {
                                throw new Error(data.message || '生成失败');
                            }
                        } catch (e) {
                            if (e instanceof Error && e.message !== '生成失败') {
                                console.error('解析流式数据失败:', e, trimmedLine);
                            } else {
                                throw e;
                            }
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return {
            id: responseId,
            content: fullContent,
            model: responseModel,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError' || error.message.includes('aborted')) {
                throw error;
            }
            throw new Error(`流式API调用失败: ${error.message}`);
        }
        throw error;
    }
}
