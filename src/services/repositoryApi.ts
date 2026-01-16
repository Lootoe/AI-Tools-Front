import { AssetCategory, SavedAsset } from '@/types/canvas';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// 获取分类列表
export async function fetchCategories(scriptId: string): Promise<AssetCategory[]> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/asset-categories`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '获取分类列表失败');
  }

  const result = await response.json();
  return result.data?.categories || [];
}

// 创建分类
export async function createCategory(scriptId: string, name: string): Promise<AssetCategory> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/asset-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '创建分类失败');
  }

  const result = await response.json();
  return result.data;
}

// 删除分类
export async function deleteCategory(scriptId: string, categoryId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(
    `${BACKEND_URL}/api/scripts/${scriptId}/asset-categories/${categoryId}`,
    {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '删除分类失败');
  }
}


// 获取分类下的资产
export async function fetchAssets(scriptId: string, categoryId: string): Promise<SavedAsset[]> {
  const token = getAuthToken();
  const response = await fetch(
    `${BACKEND_URL}/api/scripts/${scriptId}/asset-categories/${categoryId}/assets`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '获取资产列表失败');
  }

  const result = await response.json();
  return result.data?.assets || [];
}

// 保存资产请求参数
export interface SaveAssetRequest {
  imageUrl: string;
  thumbnailUrl?: string;
  name?: string;
  sourceNodeId?: string;
}

// 保存资产到分类
export async function saveAsset(
  scriptId: string,
  categoryId: string,
  data: SaveAssetRequest
): Promise<SavedAsset> {
  const token = getAuthToken();
  const response = await fetch(
    `${BACKEND_URL}/api/scripts/${scriptId}/asset-categories/${categoryId}/assets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '保存资产失败');
  }

  const result = await response.json();
  return result.data;
}

// 删除已保存资产
export async function deleteAsset(scriptId: string, assetId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/saved-assets/${assetId}`, {
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
