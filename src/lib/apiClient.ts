// 全局 API 客户端 - 统一处理请求和错误提示
import { getGlobalShowToast } from '@/components/ui/Toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// 显示错误 toast
function showErrorToast(message: string) {
  const showToast = getGlobalShowToast();
  if (showToast) {
    showToast(message, 'error');
  }
}

// 获取 token
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 请求配置
interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: unknown;
  showErrorToast?: boolean; // 是否显示错误 toast，默认 true
}

// 统一请求方法
export async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { body, showErrorToast: shouldShowToast = true, ...fetchConfig } = config;
  const token = getAuthToken();

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...fetchConfig,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchConfig.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // 网络错误（断网、服务不可用等）
    const errorMessage = '请求失败，请稍后重试';
    if (shouldShowToast) {
      showErrorToast(errorMessage);
    }
    throw new Error(errorMessage);
  }

  const result = await response.json().catch(() => ({
    success: false,
    error: response.statusText || '请求失败',
  }));

  if (!response.ok || result.success === false) {
    const errorMessage = result.error || result.message || '请求失败';
    if (shouldShowToast) {
      showErrorToast(errorMessage);
    }
    throw new Error(errorMessage);
  }

  return result.data;
}

// 便捷方法
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'PUT', body }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),
};
