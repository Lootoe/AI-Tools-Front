// 资产类型定义

// 提示词模板类型
export type PromptTemplateType = 'none' | 'character' | 'scene' | 'prop';

// 统一的资产接口
export interface Asset {
    id: string;
    scriptId: string;
    name: string;
    description: string;           // 资产设定/信息
    designImageUrl?: string;       // 设计稿图片URL
    thumbnailUrl?: string;         // 缩略图
    referenceImageUrls: string[];  // 参考图URL数组
    status: 'pending' | 'generating' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}

// 提示词模板配置
export interface PromptTemplateConfig {
    type: PromptTemplateType;
    label: string;
    description: string;
}

// 提示词模板选项
export const PROMPT_TEMPLATES: PromptTemplateConfig[] = [
    { type: 'none', label: '无模板', description: '直接使用资产设定作为提示词' },
    { type: 'character', label: '通用角色提示词', description: '生成多角度、多表情、多姿势的角色设计图' },
    { type: 'scene', label: '通用场景提示词', description: '生成多视角、场景细节元素的设计图' },
    { type: 'prop', label: '通用物品提示词', description: '生成多视角、材质细节的物品设计图' },
];
