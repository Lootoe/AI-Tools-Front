// 资产类型定义

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
