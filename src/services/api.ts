import { AIModel, ModelParameters } from '@/types/models';

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

// ============ 图片生成相关 ============

// 图片生成请求
export interface ImageGenerationRequest {
    model?: string;
    prompt: string;           // 用户输入的提示词
    positiveTags?: string[];  // 正面标签数组
    negativeTags?: string[];  // 负面标签数组
    aspect_ratio?: string;    // 宽高比：4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 1:1, 4:5, 5:4, 21:9
    image_size?: string;      // 清晰度：1K, 2K, 4K（仅 nano-banana-2 系列支持）
    referenceImages?: string[]; // 参考图数组（URL 或 base64），有值时走图生图
}

// 图片生成响应
export interface ImageGenerationResponse {
    success: boolean;
    images: Array<{
        url: string;
        revisedPrompt?: string;
    }>;
}

// 生成图片（自动判断文生图/图生图）
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const token = getAuthToken();
    
    // 根据是否有参考图选择接口
    const hasReferenceImages = request.referenceImages && request.referenceImages.length > 0;
    const endpoint = hasReferenceImages
        ? `${BACKEND_URL}/api/images/edits`
        : `${BACKEND_URL}/api/images/generations`;
    
    const baseBody: Record<string, unknown> = {
        model: request.model || 'nano-banana-2-4k',
        prompt: request.prompt,
        positiveTags: request.positiveTags || [],
        negativeTags: request.negativeTags || [],
        aspect_ratio: request.aspect_ratio || '1:1',
        response_format: 'url',
    };

    // 仅 nano-banana-2 系列支持 image_size
    if (request.image_size && request.model?.includes('nano-banana-2')) {
        baseBody.image_size = request.image_size;
    }

    const body = hasReferenceImages
        ? { ...baseBody, image: request.referenceImages }
        : baseBody;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`图片生成失败: ${error.error || error.message || response.statusText}`);
    }

    return response.json();
}

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
export async function generateCharacterDesign(description: string): Promise<CharacterDesignResponse> {
    const token = getAuthToken();

    const response = await fetch(`${BACKEND_URL}/api/images/character-design`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ description }),
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

// 获取模型列表
export async function fetchModels(): Promise<AIModel[]> {
    const response = await fetch(`${BACKEND_URL}/api/models`);
    if (!response.ok) {
        throw new Error('获取模型列表失败');
    }
    return response.json();
}

// 消息中的图片
export interface ChatMessageImage {
    url: string;
}

// API请求接口
export interface ChatRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
        images?: ChatMessageImage[];
    }>;
    parameters: ModelParameters;
    stream?: boolean;
    signal?: AbortSignal;
}

// API响应接口
export interface ChatResponse {
    id: string;
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

// 统一的AI服务调用接口（非流式）
export async function callAIService(request: ChatRequest): Promise<ChatResponse> {
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages,
                parameters: {
                    temperature: request.parameters.temperature,
                    topP: request.parameters.topP,
                    presencePenalty: request.parameters.presencePenalty,
                    frequencyPenalty: request.parameters.frequencyPenalty,
                },
            }),
            signal: request.signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`API调用失败: ${error.error || error.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            id: data.id,
            content: data.content,
            model: data.model,
            usage: data.usage,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`API调用失败: ${error.message}`);
        }
        throw error;
    }
}

// 流式AI服务调用接口
export async function* callAIServiceStream(
    request: ChatRequest
): AsyncGenerator<string, ChatResponse, unknown> {
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat/completions/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages,
                parameters: {
                    temperature: request.parameters.temperature,
                    topP: request.parameters.topP,
                    presencePenalty: request.parameters.presencePenalty,
                    frequencyPenalty: request.parameters.frequencyPenalty,
                },
            }),
            signal: request.signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`API调用失败: ${error.error || error.message || response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let responseId = '';
        let responseModel = request.model;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
                    
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);
                            
                            if (data.type === 'chunk' && data.content) {
                                fullContent += data.content;
                                yield data.content;
                            } else if (data.type === 'done') {
                                responseId = data.id || responseId;
                            } else if (data.type === 'error') {
                                throw new Error(data.message || '生成失败');
                            }
                        } catch (e) {
                            if (e instanceof Error && e.message !== '生成失败') {
                                console.error('解析流式数据失败:', e, trimmedLine);
                            } else {
                                throw e;
                            }
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return {
            id: responseId,
            content: fullContent,
            model: responseModel,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError' || error.message.includes('aborted')) {
                throw error;
            }
            throw new Error(`流式API调用失败: ${error.message}`);
        }
        throw error;
    }
}
