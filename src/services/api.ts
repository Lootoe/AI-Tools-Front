import axios from 'axios';
import { ModelParameters } from '@/types/models';

// API请求接口
export interface ChatRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    parameters: ModelParameters;
    stream?: boolean;
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

// OpenAI API调用
export async function callOpenAI(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: request.model,
            messages: request.messages,
            temperature: request.parameters.temperature,
            max_tokens: request.parameters.maxTokens,
            top_p: request.parameters.topP,
            frequency_penalty: request.parameters.frequencyPenalty,
            presence_penalty: request.parameters.presencePenalty,
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return {
        id: response.data.id,
        content: response.data.choices[0].message.content,
        model: response.data.model,
        usage: {
            promptTokens: response.data.usage.prompt_tokens,
            completionTokens: response.data.usage.completion_tokens,
            totalTokens: response.data.usage.total_tokens,
        },
    };
}

// Anthropic API调用
export async function callAnthropic(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    // 转换消息格式
    const systemMessage = request.messages.find(m => m.role === 'system');
    const messages = request.messages.filter(m => m.role !== 'system');

    const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
            model: request.model,
            messages: messages,
            system: systemMessage?.content,
            max_tokens: request.parameters.maxTokens,
            temperature: request.parameters.temperature,
            top_p: request.parameters.topP,
        },
        {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
        }
    );

    return {
        id: response.data.id,
        content: response.data.content[0].text,
        model: response.data.model,
        usage: {
            promptTokens: response.data.usage.input_tokens,
            completionTokens: response.data.usage.output_tokens,
            totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
        },
    };
}

// 通义千问API调用
export async function callQwen(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = import.meta.env.VITE_QWEN_API_KEY;

    const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        {
            model: request.model,
            input: {
                messages: request.messages,
            },
            parameters: {
                temperature: request.parameters.temperature,
                top_p: request.parameters.topP,
                max_tokens: request.parameters.maxTokens,
            },
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return {
        id: response.data.request_id,
        content: response.data.output.text,
        model: request.model,
        usage: {
            promptTokens: response.data.usage.input_tokens,
            completionTokens: response.data.usage.output_tokens,
            totalTokens: response.data.usage.total_tokens,
        },
    };
}

// 统一的AI服务调用接口
export async function callAIService(request: ChatRequest): Promise<ChatResponse> {
    const provider = request.model.split('-')[0];

    try {
        switch (provider) {
            case 'gpt':
                return await callOpenAI(request);
            case 'claude':
                return await callAnthropic(request);
            case 'qwen':
                return await callQwen(request);
            default:
                throw new Error(`不支持的模型提供商: ${provider}`);
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`API调用失败: ${error.response?.data?.error?.message || error.message}`);
        }
        throw error;
    }
}
