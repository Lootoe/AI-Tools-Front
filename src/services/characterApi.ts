// 角色相关 API 服务
import { api } from '@/lib/apiClient';
import { Character } from '@/types/video';

// ============ 角色 API ============

export async function fetchCharacters(scriptId: string): Promise<Character[]> {
  return api.get<Character[]>(`/api/scripts/${scriptId}/characters`);
}

export async function createCharacter(
  scriptId: string,
  data: { name: string; description: string }
): Promise<Character> {
  return api.post<Character>(`/api/scripts/${scriptId}/characters`, data);
}

export async function updateCharacter(
  scriptId: string,
  characterId: string,
  data: Partial<Character>
): Promise<Character> {
  return api.put<Character>(`/api/scripts/${scriptId}/characters/${characterId}`, data);
}

export async function deleteCharacter(scriptId: string, characterId: string): Promise<void> {
  await api.delete<void>(`/api/scripts/${scriptId}/characters/${characterId}`);
}
