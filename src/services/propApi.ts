// 物品相关 API 服务
import { api } from '@/lib/apiClient';
import { Prop } from '@/types/video';

// ============ 物品 API ============

export async function fetchProps(scriptId: string): Promise<Prop[]> {
    return api.get<Prop[]>(`/api/scripts/${scriptId}/props`);
}

export async function createProp(
    scriptId: string,
    data: { name: string; description: string }
): Promise<Prop> {
    return api.post<Prop>(`/api/scripts/${scriptId}/props`, data);
}

export async function updateProp(
    scriptId: string,
    propId: string,
    data: Partial<Prop>
): Promise<Prop> {
    return api.put<Prop>(`/api/scripts/${scriptId}/props/${propId}`, data);
}

export async function deleteProp(scriptId: string, propId: string): Promise<void> {
    await api.delete<void>(`/api/scripts/${scriptId}/props/${propId}`);
}
