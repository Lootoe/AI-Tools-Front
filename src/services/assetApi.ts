import { Asset, AssetType } from '@/types/asset';

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
    data: { name: string; description: string; type: AssetType }
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

// 生成资产设计稿（统一接口，根据类型使用不同的提示词模板）
export async function generateAssetDesign(
    assetId: string,
    scriptId: string,
    description: string,
    type: AssetType,
    model?: string,
    referenceImageUrls?: string[]
): Promise<AssetDesignResponse> {
    const token = getAuthToken();

    const response = await fetch(`${BACKEND_URL}/api/images/asset-design`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assetId, scriptId, description, type, model, referenceImageUrls }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || '生成失败');
    }

    return response.json();
}
