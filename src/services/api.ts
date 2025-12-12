import axios from 'axios';
import { ModelParameters } from '@/types/models';

// 统一的API配置
const API_BASE_URL = 'https://ai.t8star.cn';
const API_TOKEN = 'Bearer sk-JDKZ6bDbIHoy2GpMfmBryoKKVKEomW2R18s5naNk3qLwrGrN';

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
    try {
        const requestBody: any = {
            model: request.model,
            messages: request.messages,
            temperature: request.parameters.temperature,
            top_p: request.parameters.topP,
            presence_penalty: request.parameters.presencePenalty,
            frequency_penalty: request.parameters.frequencyPenalty,
            stream: false,
        };

        const response = await axios.post(
            `${API_BASE_URL}/v1/chat/completions`,
            requestBody,
            {
                headers: {
                    'Authorization': API_TOKEN,
                    'Content-Type': 'application/json',
                },
                signal: request.signal,
            }
        );

        return {
            id: response.data.id,
            content: response.data.choices[0].message.content,
            model: response.data.model,
            usage: response.data.usage ? {
                promptTokens: response.data.usage.prompt_tokens,
                completionTokens: response.data.usage.completion_tokens,
                totalTokens: response.data.usage.total_tokens,
            } : undefined,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`API调用失败: ${error.response?.data?.error?.message || error.message}`);
        }
        throw error;
    }
}

// 流式AI服务调用接口
export async function* callAIServiceStream(
    request: ChatRequest
): AsyncGenerator<string, ChatResponse, unknown> {
    try {
        const requestBody: any = {
            model: request.model,
            messages: request.messages,
            temperature: request.parameters.temperature,
            top_p: request.parameters.topP,
            presence_penalty: request.parameters.presencePenalty,
            frequency_penalty: request.parameters.frequencyPenalty,
            stream: true,
        };

        const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': API_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: request.signal,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`API调用失败: ${error.error?.message || response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let responseId = '';
        let responseModel = '';

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
                            
                            if (data.id) responseId = data.id;
                            if (data.model) responseModel = data.model;
                            
                            const content = data.choices?.[0]?.delta?.content;
                            if (content) {
                                fullContent += content;
                                yield content;
                            }
                        } catch (e) {
                            console.error('解析流式数据失败:', e, trimmedLine);
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
            // 用户主动中断请求，不抛出错误
            if (error.name === 'AbortError' || error.message.includes('aborted')) {
                throw error;
            }
            throw new Error(`流式API调用失败: ${error.message}`);
        }
        throw error;
    }
}
