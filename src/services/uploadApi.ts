import * as qiniu from 'qiniu-js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
    return localStorage.getItem('token');
}

// 上传凭证响应
interface UploadTokenResponse {
    success: boolean;
    token: string;
    domain: string;
    bucket?: string;
    key?: string;
}

// 上传结果
export interface UploadResult {
    success: boolean;
    url: string;
    key: string;
    hash?: string;
}

// 上传进度回调
export type UploadProgressCallback = (percent: number) => void;

/**
 * 获取七牛云上传凭证
 */
export async function getUploadToken(filename?: string, prefix?: string): Promise<UploadTokenResponse> {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (filename) params.append('filename', filename);
    if (prefix) params.append('prefix', prefix);

    const response = await fetch(`${BACKEND_URL}/api/upload/token?${params}`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || '获取上传凭证失败');
    }

    return response.json();
}

/**
 * 前端直传文件到七牛云
 */
export function uploadToQiniu(
    file: File,
    prefix: string = 'uploads',
    onProgress?: UploadProgressCallback
): Promise<UploadResult> {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. 获取上传凭证
            const { token, domain, key } = await getUploadToken(file.name, prefix);

            if (!key) {
                throw new Error('未获取到文件 key');
            }

            // 2. 配置上传参数
            const config = {
                useCdnDomain: true,
                region: undefined, // 自动检测区域
            };

            const putExtra = {
                fname: file.name,
                mimeType: file.type,
            };

            // 3. 创建上传任务
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const observable = qiniu.upload(file, key, token, putExtra as any, config as any);

            // 4. 订阅上传事件
            observable.subscribe({
                next: (res) => {
                    // 上传进度
                    const percent = Math.round(res.total.percent);
                    onProgress?.(percent);
                },
                error: (err) => {
                    console.error('七牛云上传失败:', err);
                    reject(new Error(err.message || '上传失败'));
                },
                complete: (res) => {
                    // 上传完成
                    resolve({
                        success: true,
                        url: `${domain}/${res.key}`,
                        key: res.key,
                        hash: res.hash,
                    });
                },
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 通过后端上传文件（备用方案）
 */
export async function uploadViaBackend(
    file: File,
    prefix: string = 'uploads'
): Promise<UploadResult> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('prefix', prefix);

    const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || '上传失败');
    }

    return response.json();
}

/**
 * 将远程 URL 图片保存到七牛云
 */
export async function fetchToQiniu(
    url: string,
    prefix: string = 'ai-generated'
): Promise<UploadResult> {
    const token = getAuthToken();

    const response = await fetch(`${BACKEND_URL}/api/upload/fetch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, prefix }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || '保存图片失败');
    }

    return response.json();
}
