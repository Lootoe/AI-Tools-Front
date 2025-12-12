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

// 统一的AI服务调用接口
export async function callAIService(request: ChatRequest): Promise<ChatResponse> {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/v1/chat/completions`,
            {
                model: request.model,
                messages: request.messages,
                temperature: request.parameters.temperature,
                top_p: request.parameters.topP,
                max_tokens: request.parameters.maxTokens,
                presence_penalty: request.parameters.presencePenalty,
                frequency_penalty: request.parameters.frequencyPenalty,
                stream: request.stream || false,
            },
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
