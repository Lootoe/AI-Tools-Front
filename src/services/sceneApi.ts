// 场景相关 API 服务
import { api } from '@/lib/apiClient';
import { Scene } from '@/types/video';

// ============ 场景 API ============

export async function fetchScenes(scriptId: string): Promise<Scene[]> {
    return api.get<Scene[]>(`/api/scripts/${scriptId}/scenes`);
}

export async function createScene(
    scriptId: string,
    data: { name: string; description: string }
): Promise<Scene> {
    return api.post<Scene>(`/api/scripts/${scriptId}/scenes`, data);
}

export async function updateScene(
    scriptId: string,
    sceneId: string,
    data: Partial<Scene>
): Promise<Scene> {
    return api.put<Scene>(`/api/scripts/${scriptId}/scenes/${sceneId}`, data);
}

export async function deleteScene(scriptId: string, sceneId: string): Promise<void> {
    await api.delete<void>(`/api/scripts/${scriptId}/scenes/${sceneId}`);
}
