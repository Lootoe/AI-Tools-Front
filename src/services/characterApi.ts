import { Character } from '@/types/video';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
    return localStorage.getItem('token');
}

// 获取剧本下所有角色
export async function fetchCharacters(scriptId: string): Promise<{ success: boolean; data: Character[] }> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/characters`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) throw new Error('获取角色列表失败');
    return response.json();
}

// 创建角色
export async function createCharacter(scriptId: string, name: string, description: string = ''): Promise<{ success: boolean; data: Character }> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/characters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error('创建角色失败');
    return response.json();
}

// 更新角色
export async function updateCharacter(scriptId: string, characterId: string, data: Partial<Character>): Promise<{ success: boolean; data: Character }> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/characters/${characterId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('更新角色失败');
    return response.json();
}

// 删除角色
export async function deleteCharacter(scriptId: string, characterId: string): Promise<{ success: boolean }> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/characters/${characterId}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) throw new Error('删除角色失败');
    return response.json();
}

// 角色视频生成请求
export interface CharacterToVideoRequest {
    prompt: string;
    aspect_ratio?: '16:9' | '9:16';
    duration?: '10' | '15';
    referenceImageUrl?: string;
    characterId: string;
}

// 生成角色视频
export async function generateCharacterVideo(request: CharacterToVideoRequest): Promise<{ success: boolean; data: { task_id?: string }; balance?: number }> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/videos/character-to-video`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            prompt: request.prompt,
            model: 'sora-2',
            aspect_ratio: request.aspect_ratio || '9:16',
            duration: request.duration || '15',
            referenceImageUrl: request.referenceImageUrl,
            characterId: request.characterId,
        }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || '角色视频生成失败');
    }
    return response.json();
}

// 注册 Sora2 角色（用于多视频角色一致性）
export async function registerSoraCharacter(characterId: string, timestamps: string): Promise<{ success: boolean; data: Character }> {
    const token = getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/videos/register-sora-character`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ characterId, timestamps }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || '角色注册失败');
    }
    return response.json();
}
