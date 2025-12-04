// AI模型提供商类型
export type ModelProvider = 'openai' | 'anthropic' | 'qwen' | 'custom';

// AI模型配置
export interface AIModel {
    id: string;
    name: string;
    provider: ModelProvider;
    description?: string;
    maxTokens?: number;
}

// 模型参数配置
export interface ModelParameters {
    temperature: number;      // 0-2, 控制随机性
    maxTokens: number;        // 最大生成token数
    topP: number;             // 0-1, 核采样
    frequencyPenalty: number; // -2 to 2, 频率惩罚
    presencePenalty: number;  // -2 to 2, 存在惩罚
}

// 预设模型列表
export const AVAILABLE_MODELS: AIModel[] = [
    {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        description: 'OpenAI最强大的模型',
        maxTokens: 128000,
    },
    {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        description: '快速且经济的模型',
        maxTokens: 16385,
    },
    {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        description: 'Anthropic最强大的模型',
        maxTokens: 200000,
    },
    {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        description: '平衡性能和速度',
        maxTokens: 200000,
    },
    {
        id: 'qwen-turbo',
        name: '通义千问 Turbo',
        provider: 'qwen',
        description: '阿里云通义千问',
        maxTokens: 8192,
    },
];

// 默认参数
export const DEFAULT_PARAMETERS: ModelParameters = {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
};
