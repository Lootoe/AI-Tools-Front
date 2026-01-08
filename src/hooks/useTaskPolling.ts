import { useRef, useCallback, useEffect } from 'react';
import { getVideoStatus } from '@/services/api';

// 轮询间隔（毫秒）
const DEFAULT_POLL_INTERVAL = 10000;

// 任务状态
export type TaskStatus = 'pending' | 'queued' | 'generating' | 'completed' | 'failed';

// 轮询结果
export interface PollResult {
  status: TaskStatus;
  progress?: string;
  videoUrl?: string;
  error?: string;
}

// 轮询回调
export interface TaskPollingCallbacks {
  onStatusChange: (taskId: string, result: PollResult) => void;
  onComplete?: (taskId: string, videoUrl: string) => void;
  onError?: (taskId: string, error: string) => void;
}

/**
 * 通用任务轮询 Hook
 * 用于轮询视频生成任务状态
 */
export function useTaskPolling(
  callbacks: TaskPollingCallbacks,
  pollInterval: number = DEFAULT_POLL_INTERVAL
) {
  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const taskIdsRef = useRef<Set<string>>(new Set());
  // 使用 ref 存储 callbacks，避免依赖变化导致重复轮询
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // 解析任务状态
  const parseTaskStatus = useCallback((responseData: {
    status?: string;
    progress?: string | number;
    data?: {
      output?: string;
      video_url?: string;
      status?: string;
    };
    output?: { url?: string };
    fail_reason?: string;
  }): PollResult => {
    const outerStatus = responseData.status;
    const innerStatus = responseData.data?.status;
    const progress = responseData.progress;
    const videoUrl = responseData.data?.video_url || responseData.data?.output || responseData.output?.url;

    // 判断状态
    const isQueued = outerStatus === 'NOT_START' || innerStatus === 'queued';
    const isSuccess = outerStatus === 'SUCCESS' || outerStatus === 'completed' || innerStatus === 'completed';
    const isFailed = outerStatus === 'FAILURE' || outerStatus === 'failed' || innerStatus === 'failed';
    const isInProgress = outerStatus === 'IN_PROGRESS' || innerStatus === 'pending';

    if (isSuccess) {
      return { status: 'completed', progress: '100', videoUrl };
    }
    if (isFailed) {
      return { status: 'failed', error: responseData.fail_reason || '生成失败' };
    }
    if (isQueued) {
      return { status: 'queued', progress: '0' };
    }
    if (isInProgress) {
      const progressValue = typeof progress === 'number' ? String(progress) : (progress || '0');
      return { status: 'generating', progress: progressValue };
    }

    // 默认生成中
    const progressValue = typeof progress === 'number' ? String(progress) : (progress || '0');
    return { status: 'generating', progress: progressValue };
  }, []);

  // 停止轮询
  const stopPolling = useCallback((taskId: string) => {
    const timer = timersRef.current.get(taskId);
    if (timer) {
      clearInterval(timer);
      timersRef.current.delete(taskId);
    }
    taskIdsRef.current.delete(taskId);
  }, []);

  // 执行单次轮询
  const doPoll = useCallback(async (taskId: string) => {
    try {
      const response = await getVideoStatus(taskId);
      const result = parseTaskStatus(response.data);

      callbacksRef.current.onStatusChange(taskId, result);

      if (result.status === 'completed') {
        stopPolling(taskId);
        callbacksRef.current.onComplete?.(taskId, result.videoUrl || '');
      } else if (result.status === 'failed') {
        stopPolling(taskId);
        callbacksRef.current.onError?.(taskId, result.error || '生成失败');
      }

      return result;
    } catch (error) {
      console.error('轮询任务状态失败:', error);
      // 网络错误不停止轮询，继续尝试
      return null;
    }
  }, [parseTaskStatus, stopPolling]);

  // 开始轮询
  const startPolling = useCallback((taskId: string) => {
    // 如果已经在轮询，跳过
    if (taskIdsRef.current.has(taskId)) {
      return;
    }

    taskIdsRef.current.add(taskId);

    // 立即执行一次
    doPoll(taskId);

    // 设置定时轮询
    const timer = setInterval(() => {
      // 检查任务是否还在跟踪列表中
      if (!taskIdsRef.current.has(taskId)) {
        clearInterval(timer);
        timersRef.current.delete(taskId);
        return;
      }
      doPoll(taskId);
    }, pollInterval);

    timersRef.current.set(taskId, timer);
  }, [doPoll, pollInterval]);

  // 停止所有轮询
  const stopAllPolling = useCallback(() => {
    timersRef.current.forEach((timer) => clearInterval(timer));
    timersRef.current.clear();
    taskIdsRef.current.clear();
  }, []);

  // 检查是否正在轮询
  const isPolling = useCallback((taskId: string) => {
    return taskIdsRef.current.has(taskId);
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopAllPolling();
    };
  }, [stopAllPolling]);

  return {
    startPolling,
    stopPolling,
    stopAllPolling,
    isPolling,
  };
}
