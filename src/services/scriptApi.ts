// 剧本相关 API 服务
import { Script, Character, Episode, Storyboard, VideoPhase } from '@/types/video';

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


// ============ 角色 API ============

export async function createCharacter(
  scriptId: string,
  data: Omit<Character, 'id' | 'status' | 'createdAt'>
): Promise<Character> {
  return request<Character>(`/api/scripts/${scriptId}/characters`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCharacter(
  scriptId: string,
  characterId: string,
  data: Partial<Character>
): Promise<Character> {
  return request<Character>(`/api/scripts/${scriptId}/characters/${characterId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCharacter(scriptId: string, characterId: string): Promise<void> {
  await request<void>(`/api/scripts/${scriptId}/characters/${characterId}`, { method: 'DELETE' });
}

// ============ 剧集 API ============

export async function createEpisode(
  scriptId: string,
  data: Omit<Episode, 'id' | 'scriptId' | 'storyboards' | 'createdAt' | 'updatedAt'>
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
  data: Omit<Storyboard, 'id' | 'episodeId' | 'status' | 'createdAt'>
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
