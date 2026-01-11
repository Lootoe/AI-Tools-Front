import { Asset, PromptTemplateType } from '@/types/asset';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
    return localStorage.getItem('token');
}

// 获取剧本下的所有资产
export async function fetchAssets(scriptId: string): Promise<Asset[]> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/assets`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || '获取资产列表失败');
    }

    const data = await response.json();
    return data.assets || [];
}

// 创建资产
export async function createAsset(
    scriptId: string,
    data: { name: string; description: string }
): Promise<Asset> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/assets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || '创建资产失败');
    }

    const result = await response.json();
    return result.asset;
}

// 更新资产
export async function updateAsset(
    scriptId: string,
    assetId: string,
    updates: Partial<Asset>
): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/assets/${assetId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || '更新资产失败');
    }
}

// 删除资产
export async function deleteAsset(scriptId: string, assetId: string): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || '删除资产失败');
    }
}

// 资产设计稿生成响应
export interface AssetDesignResponse {
    success: boolean;
    images: Array<{
        url: string;
        revisedPrompt?: string;
    }>;
    balance?: number;
}

// 生成资产设计稿
export async function generateAssetDesign(
    assetId: string,
    scriptId: string,
    description: string,
    promptTemplate: PromptTemplateType,
    model?: string,
    referenceImageUrls?: string[],
    aspectRatio?: '1:1' | '4:3' | '16:9'
): Promise<AssetDesignResponse> {
    const token = getAuthToken();

    const response = await fetch(`${BACKEND_URL}/api/images/asset-design`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assetId, scriptId, description, promptTemplate, model, referenceImageUrls, aspectRatio }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || '生成失败');
    }

    return response.json();
}


// 图片编辑响应
export interface ImageEditResponse {
    success: boolean;
    images: Array<{
        url: string;
        revisedPrompt?: string;
    }>;
    balance?: number;
}

// 编辑图片 - 基于现有图片进行编辑生成新图
export async function editImage(
    imageFile: File,
    prompt: string,
    model: string = 'nano-banana-2'
): Promise<ImageEditResponse> {
    const token = getAuthToken();

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    formData.append('model', model);

    const response = await fetch(`${BACKEND_URL}/api/images/edits`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || '图片编辑失败');
    }

    return response.json();
}


// 分镜图生成响应
export interface StoryboardImageResponse {
    success: boolean;
    images: Array<{
        url: string;
        revisedPrompt?: string;
    }>;
    balance?: number;
}

// 生成分镜图
export async function generateStoryboardImage(
    variantId: string,
    scriptId: string,
    description: string,
    model: string,
    referenceImageUrls?: string[],
    aspectRatio?: '9:16' | '16:9' | '1:1'
): Promise<StoryboardImageResponse> {
    const token = getAuthToken();

    const response = await fetch(`${BACKEND_URL}/api/images/storyboard-image`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            variantId,
            scriptId,
            description,
            model,
            referenceImageUrls,
            aspectRatio,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || '生成失败');
    }

    return response.json();
}
