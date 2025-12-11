import { MessageErrorType } from '@/types/message';

export interface ErrorResult {
    errorType: MessageErrorType;
    errorMessage: string;
}

/**
 * 统一错误处理：根据错误对象判断错误类型和消息
 */
export function parseError(error: unknown): ErrorResult {
    if (!(error instanceof Error)) {
        return {
            errorType: 'unknown_error',
            errorMessage: '未知错误',
        };
    }

    const message = error.message.toLowerCase();

    if (error.name === 'AbortError') {
        return {
            errorType: 'interrupted',
            errorMessage: '生成已中断',
        };
    }

    if (message.includes('timeout')) {
        return {
            errorType: 'timeout_error',
            errorMessage: 'AI回复超时，请重试',
        };
    }

    if (message.includes('network') || message.includes('fetch')) {
        return {
            errorType: 'network_error',
            errorMessage: '网络连接失败',
        };
    }

    if (message.includes('rate limit')) {
        return {
            errorType: 'rate_limit_error',
            errorMessage: '请求过于频繁，请稍后再试',
        };
    }

    return {
        errorType: 'api_error',
        errorMessage: error.message,
    };
}

/**
 * 根据错误类型获取消息状态
 */
export function getStatusFromErrorType(errorType: MessageErrorType): 'failed' | 'timeout' | 'interrupted' {
    switch (errorType) {
        case 'timeout_error':
            return 'timeout';
        case 'interrupted':
            return 'interrupted';
        default:
            return 'failed';
    }
}
