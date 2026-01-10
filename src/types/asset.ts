// 资产类型定义

// 资产类型枚举
export type AssetType = 'character' | 'scene' | 'prop';

// 统一的资产接口
export interface Asset {
    id: string;
    scriptId: string;
    type: AssetType;              // 资产类型
    name: string;
    description: string;           // 资产设定/信息
    designImageUrl?: string;       // 设计稿图片URL
    thumbnailUrl?: string;         // 缩略图
    referenceImageUrls: string[];  // 参考图URL数组
    status: 'pending' | 'generating' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}

// 资产类型配置
export interface AssetTypeConfig {
    type: AssetType;
    label: string;
    icon: string;
    poolTitle: string;
    editorTitle: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
    designTitle: string;
    emptyTitle: string;
    emptyDescription: string;
    newButtonText: string;
    saveButtonText: string;
    deleteTitle: string;
    deleteMessage: (name: string) => string;
    generateHint: string;
}

// 资产类型配置映射
export const ASSET_TYPE_CONFIGS: Record<AssetType, AssetTypeConfig> = {
    character: {
        type: 'character',
        label: '角色',
        icon: 'Users',
        poolTitle: '资产池',
        editorTitle: '资产编辑器',
        namePlaceholder: '输入资产名称...',
        descriptionPlaceholder: '描述角色的外观、服装、风格等信息...',
        designTitle: '资产设计稿',
        emptyTitle: '选择或创建资产',
        emptyDescription: '从左侧资产池选择一个资产进行编辑，或点击"新建"创建新资产',
        newButtonText: '新建资产',
        saveButtonText: '保存资产信息',
        deleteTitle: '删除资产',
        deleteMessage: (name: string) => `确定要删除资产「${name}」吗？此操作无法撤销。`,
        generateHint: 'AI生成将包含多角度、多表情、多穿搭的设计参考图',
    },
    scene: {
        type: 'scene',
        label: '场景',
        icon: 'Mountain',
        poolTitle: '资产池',
        editorTitle: '资产编辑器',
        namePlaceholder: '输入资产名称...',
        descriptionPlaceholder: '描述场景的类型、氛围、色调、细节元素等信息...',
        designTitle: '资产设计稿',
        emptyTitle: '选择或创建资产',
        emptyDescription: '从左侧资产池选择一个资产进行编辑，或点击"新建"创建新资产',
        newButtonText: '新建资产',
        saveButtonText: '保存资产信息',
        deleteTitle: '删除资产',
        deleteMessage: (name: string) => `确定要删除资产「${name}」吗？此操作无法撤销。`,
        generateHint: 'AI生成将包含多视角、场景细节元素的设计参考图',
    },
    prop: {
        type: 'prop',
        label: '物品',
        icon: 'Box',
        poolTitle: '资产池',
        editorTitle: '资产编辑器',
        namePlaceholder: '输入资产名称...',
        descriptionPlaceholder: '描述物品的材质、色调、细节、关联角色/场景等信息...',
        designTitle: '资产设计稿',
        emptyTitle: '选择或创建资产',
        emptyDescription: '从左侧资产池选择一个资产进行编辑，或点击"新建"创建新资产',
        newButtonText: '新建资产',
        saveButtonText: '保存资产信息',
        deleteTitle: '删除资产',
        deleteMessage: (name: string) => `确定要删除资产「${name}」吗？此操作无法撤销。`,
        generateHint: 'AI生成将包含多视角、材质细节的设计参考图',
    },
};
