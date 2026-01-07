// 视频生成相关配置

// 轮询间隔（毫秒）
export const POLL_INTERVAL = 10000;

// 默认视频设置
export const DEFAULT_VIDEO_SETTINGS = {
  aspectRatio: '9:16' as const,
  duration: '15' as const,
  style: '日漫风格',
};

// 视频比例选项
export const ASPECT_RATIO_OPTIONS = [
  { value: '9:16', label: '9:16 (竖屏)' },
  { value: '16:9', label: '16:9 (横屏)' },
] as const;

// 视频时长选项
export const DURATION_OPTIONS = [
  { value: '10', label: '10秒' },
  { value: '15', label: '15秒' },
] as const;
