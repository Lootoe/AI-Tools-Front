// 后端API地址
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// ============ Sora2 视频生成相关 ============

// Sora2 视频生成请求
export interface Sora2VideoRequest {
  prompt: string;
  model?: 'sora-2';
  aspect_ratio?: '16:9' | '9:16';
  duration?: '10' | '15';
  private?: boolean;
  reference_image?: string; // 参考图 URL
}

// Sora2 视频生成响应
export interface Sora2VideoResponse {
  success: boolean;
  data: {
    task_id?: string;
    status?: 'NOT_START' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE';
    fail_reason?: string;
    progress?: string;
    data?: {
      output?: string; // 视频URL
    };
    [key: string]: unknown;
  };
}

// 生成 Sora2 视频
export async function generateSora2Video(request: Sora2VideoRequest): Promise<Sora2VideoResponse> {
  const token = getAuthToken();

  const response = await fetch(`${BACKEND_URL}/api/videos/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      prompt: request.prompt,
      model: request.model || 'sora-2',
      aspect_ratio: request.aspect_ratio || '9:16',
      duration: request.duration || '10',
      private: request.private ?? false,
      ...(request.reference_image ? { reference_image: request.reference_image } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`视频生成失败: ${error.error || error.message || response.statusText}`);
  }

  return response.json();
}

// 查询视频生成状态
export async function getVideoStatus(taskId: string): Promise<Sora2VideoResponse> {
  const token = getAuthToken();

  const response = await fetch(`${BACKEND_URL}/api/videos/generations/${taskId}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`查询状态失败: ${error.error || error.message || response.statusText}`);
  }

  return response.json();
}

// 分镜生成视频请求
export interface StoryboardToVideoRequest {
  prompt: string;
  model?: 'sora-2';
  aspect_ratio?: '16:9' | '9:16';
  duration?: '10' | '15';
  private?: boolean;
  referenceImageUrls?: string[]; // 参考图URL数组
}

// 分镜生成视频
export async function generateStoryboardVideo(request: StoryboardToVideoRequest): Promise<Sora2VideoResponse> {
  const token = getAuthToken();

  const response = await fetch(`${BACKEND_URL}/api/videos/storyboard-to-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      prompt: request.prompt,
      model: request.model || 'sora-2',
      aspect_ratio: request.aspect_ratio || '9:16',
      duration: request.duration || '15',
      private: request.private ?? false,
      ...(request.referenceImageUrls?.length ? { reference_images: request.referenceImageUrls } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`分镜视频生成失败: ${error.error || error.message || response.statusText}`);
  }

  return response.json();
}

// ============ 图片上传相关 ============

// 图片上传响应
export interface ImageUploadResponse {
  success: boolean;
  url: string;
}

// 上传图片到图床（使用 File 对象）
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const token = getAuthToken();

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`图片上传失败: ${error.error || error.message || response.statusText}`);
  }

  return response.json();
}

// 将 base64 转换为 File 对象
function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// 上传 base64 图片到图床
export async function uploadBase64Image(base64: string): Promise<ImageUploadResponse> {
  const file = base64ToFile(base64, `image_${Date.now()}.png`);
  return uploadImage(file);
}

// ============ 角色设计稿生成 ============

// 角色设计稿生成响应
export interface CharacterDesignResponse {
  success: boolean;
  images: Array<{
    url: string;
    revisedPrompt?: string;
  }>;
}

// 生成角色设计稿（提示词模板在后端，前端只传角色描述）
export async function generateCharacterDesign(description: string, model?: string): Promise<CharacterDesignResponse> {
  const token = getAuthToken();

  const response = await fetch(`${BACKEND_URL}/api/images/character-design`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ description, model }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '生成失败');
  }

  return response.json();
}

// 场景设计稿生成响应
export interface SceneDesignResponse {
  success: boolean;
  images: Array<{
    url: string;
    revisedPrompt?: string;
  }>;
}

// 生成场景设计稿（提示词模板在后端，前端只传场景描述）
export async function generateSceneDesign(description: string, model?: string): Promise<SceneDesignResponse> {
  const token = getAuthToken();

  const response = await fetch(`${BACKEND_URL}/api/images/scene-design`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ description, model }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '生成失败');
  }

  return response.json();
}

// 物品设计稿生成响应
export interface PropDesignResponse {
  success: boolean;
  images: Array<{
    url: string;
    revisedPrompt?: string;
  }>;
}

// 生成物品设计稿（提示词模板在后端，前端只传物品描述）
export async function generatePropDesign(description: string, model?: string): Promise<PropDesignResponse> {
  const token = getAuthToken();

  const response = await fetch(`${BACKEND_URL}/api/images/prop-design`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ description, model }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '生成失败');
  }

  return response.json();
}

// 获取存储的 token (移到前面以便 uploadImage 使用)
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}
