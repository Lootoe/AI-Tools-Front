// 角色相关 API 服务
import { Character } from '@/types/video';

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

// ============ 角色 API ============

export async function fetchCharacters(scriptId: string): Promise<Character[]> {
  return request<Character[]>(`/api/scripts/${scriptId}/characters`);
}

export async function createCharacter(
  scriptId: string,
  data: { name: string; description: string }
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
  await request<void>(`/api/scripts/${scriptId}/characters/${characterId}`, {
    method: 'DELETE',
  });
}
