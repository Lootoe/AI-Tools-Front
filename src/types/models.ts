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
    topP: number;             // 0-1, 核采样
    frequencyPenalty: number; // -2 to 2, 频率惩罚
    presencePenalty: number;  // -2 to 2, 存在惩罚
}

// 预设模型列表
export const AVAILABLE_MODELS: AIModel[] = [
    {
        id: 'gpt-5.1-thinking',
        name: 'GPT-5.1 Thinking',
        provider: 'openai',
        description: 'GPT-5.1 推理模型',
        maxTokens: 128000,
    },
];

// 默认参数
export const DEFAULT_PARAMETERS: ModelParameters = {
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
};
