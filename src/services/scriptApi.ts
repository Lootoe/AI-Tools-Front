// 剧本相关 API 服务
import { Script, Episode, Storyboard, StoryboardVariant, StoryboardImage, ImageVariant, VideoPhase } from '@/types/video';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || response.statusText);
  }

  const result = await response.json();
  return result.data;
}

// ============ 剧本 API ============

export async function fetchScripts(): Promise<Script[]> {
  return request<Script[]>('/api/scripts');
}

export async function fetchScript(id: string): Promise<Script> {
  return request<Script>(`/api/scripts/${id}`);
}

export async function createScript(title?: string): Promise<Script> {
  return request<Script>('/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ title: title || '新剧本' }),
  });
}

export async function updateScript(id: string, data: {
  title?: string;
  prompt?: string;
  content?: string;
  currentPhase?: VideoPhase;
}): Promise<Script> {
  return request<Script>(`/api/scripts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteScript(id: string): Promise<void> {
  await request<void>(`/api/scripts/${id}`, { method: 'DELETE' });
}

export async function deleteScripts(ids: string[]): Promise<void> {
  await request<void>('/api/scripts/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}


// ============ 剧集 API ============

export async function createEpisode(
  scriptId: string,
  data: Omit<Episode, 'id' | 'scriptId' | 'storyboards' | 'storyboardImages' | 'createdAt' | 'updatedAt'>
): Promise<Episode> {
  return request<Episode>(`/api/scripts/${scriptId}/episodes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEpisode(
  scriptId: string,
  episodeId: string,
  data: Partial<Episode>
): Promise<Episode> {
  return request<Episode>(`/api/scripts/${scriptId}/episodes/${episodeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEpisode(scriptId: string, episodeId: string): Promise<void> {
  await request<void>(`/api/scripts/${scriptId}/episodes/${episodeId}`, { method: 'DELETE' });
}

// ============ 分镜 API ============

export async function createStoryboard(
  scriptId: string,
  episodeId: string,
  data: Omit<Storyboard, 'id' | 'episodeId' | 'status' | 'createdAt' | 'variants'>
): Promise<Storyboard> {
  return request<Storyboard>(`/api/scripts/${scriptId}/episodes/${episodeId}/storyboards`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStoryboard(
  scriptId: string,
  episodeId: string,
  storyboardId: string,
  data: Partial<Storyboard>
): Promise<Storyboard> {
  return request<Storyboard>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboards/${storyboardId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteStoryboard(
  scriptId: string,
  episodeId: string,
  storyboardId: string
): Promise<void> {
  await request<void>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboards/${storyboardId}`,
    { method: 'DELETE' }
  );
}

export async function clearStoryboards(scriptId: string, episodeId: string): Promise<void> {
  await request<void>(`/api/scripts/${scriptId}/episodes/${episodeId}/storyboards`, {
    method: 'DELETE',
  });
}

export async function reorderStoryboards(
  scriptId: string,
  episodeId: string,
  storyboardIds: string[]
): Promise<void> {
  await request<void>(`/api/scripts/${scriptId}/episodes/${episodeId}/storyboards-reorder`, {
    method: 'PUT',
    body: JSON.stringify({ storyboardIds }),
  });
}


// ============ 分镜副本 API ============

export async function fetchVariant(
  scriptId: string,
  episodeId: string,
  storyboardId: string,
  variantId: string
): Promise<StoryboardVariant> {
  return request<StoryboardVariant>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboards/${storyboardId}/variants/${variantId}`,
    { method: 'GET' }
  );
}

export async function createVariant(
  scriptId: string,
  episodeId: string,
  storyboardId: string,
  data?: Partial<StoryboardVariant>
): Promise<StoryboardVariant> {
  return request<StoryboardVariant>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboards/${storyboardId}/variants`,
    {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }
  );
}

export async function updateVariant(
  scriptId: string,
  episodeId: string,
  storyboardId: string,
  variantId: string,
  data: Partial<StoryboardVariant>
): Promise<StoryboardVariant> {
  return request<StoryboardVariant>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboards/${storyboardId}/variants/${variantId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteVariant(
  scriptId: string,
  episodeId: string,
  storyboardId: string,
  variantId: string
): Promise<void> {
  await request<void>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboards/${storyboardId}/variants/${variantId}`,
    { method: 'DELETE' }
  );
}

export async function setActiveVariant(
  scriptId: string,
  episodeId: string,
  storyboardId: string,
  variantId: string
): Promise<void> {
  await request<void>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboards/${storyboardId}/active-variant`,
    {
      method: 'PUT',
      body: JSON.stringify({ variantId }),
    }
  );
}


// ============ 分镜图 API ============

export async function createStoryboardImage(
  scriptId: string,
  episodeId: string,
  data: Omit<StoryboardImage, 'id' | 'episodeId' | 'status' | 'createdAt' | 'imageVariants'>
): Promise<StoryboardImage> {
  return request<StoryboardImage>(`/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStoryboardImage(
  scriptId: string,
  episodeId: string,
  storyboardImageId: string,
  data: Partial<StoryboardImage>
): Promise<StoryboardImage> {
  return request<StoryboardImage>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images/${storyboardImageId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteStoryboardImage(
  scriptId: string,
  episodeId: string,
  storyboardImageId: string
): Promise<void> {
  await request<void>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images/${storyboardImageId}`,
    { method: 'DELETE' }
  );
}

export async function clearStoryboardImages(scriptId: string, episodeId: string): Promise<void> {
  await request<void>(`/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images`, {
    method: 'DELETE',
  });
}

export async function reorderStoryboardImages(
  scriptId: string,
  episodeId: string,
  storyboardImageIds: string[]
): Promise<void> {
  await request<void>(`/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images-reorder`, {
    method: 'PUT',
    body: JSON.stringify({ storyboardImageIds }),
  });
}


// ============ 分镜图副本 API ============

export async function fetchImageVariant(
  scriptId: string,
  episodeId: string,
  storyboardImageId: string,
  variantId: string
): Promise<ImageVariant> {
  return request<ImageVariant>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images/${storyboardImageId}/variants/${variantId}`,
    { method: 'GET' }
  );
}

export async function createImageVariant(
  scriptId: string,
  episodeId: string,
  storyboardImageId: string,
  data?: Partial<ImageVariant>
): Promise<ImageVariant> {
  return request<ImageVariant>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images/${storyboardImageId}/variants`,
    {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }
  );
}

export async function updateImageVariant(
  scriptId: string,
  episodeId: string,
  storyboardImageId: string,
  variantId: string,
  data: Partial<ImageVariant>
): Promise<ImageVariant> {
  return request<ImageVariant>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images/${storyboardImageId}/variants/${variantId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteImageVariant(
  scriptId: string,
  episodeId: string,
  storyboardImageId: string,
  variantId: string
): Promise<void> {
  await request<void>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images/${storyboardImageId}/variants/${variantId}`,
    { method: 'DELETE' }
  );
}

export async function setActiveImageVariant(
  scriptId: string,
  episodeId: string,
  storyboardImageId: string,
  variantId: string
): Promise<void> {
  await request<void>(
    `/api/scripts/${scriptId}/episodes/${episodeId}/storyboard-images/${storyboardImageId}/active-variant`,
    {
      method: 'PUT',
      body: JSON.stringify({ variantId }),
    }
  );
}
