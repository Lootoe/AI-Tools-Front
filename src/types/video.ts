// 视频生成相关类型定义

// 分镜副本（分镜池中的单个视频）
export interface StoryboardVariant {
  id: string;
  storyboardId: string;
  videoUrl?: string;       // sora2 生成的视频
  thumbnailUrl?: string;
  taskId?: string;         // sora2 任务ID，用于恢复轮询
  progress?: string;       // 生成进度百分比
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  createdAt: string;
}

// 分镜
export interface Storyboard {
  id: string;
  episodeId: string;
  sceneNumber: number;
  description: string;
  referenceImageUrls?: string[]; // 参考图URL数组（支持多张）
  aspectRatio?: '16:9' | '9:16'; // 视频比例
  duration?: '10' | '15';  // 视频时长（秒）
  createdAt: string;
  // 分镜池相关
  variants: StoryboardVariant[];  // 分镜副本列表
  activeVariantId?: string;       // 当前选中的副本ID
  // 兼容旧数据（将迁移到variants）
  videoUrl?: string;
  thumbnailUrl?: string;
  taskId?: string;
  progress?: string;
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
}

// 剧集
export interface Episode {
  id: string;
  scriptId: string;
  episodeNumber: number;
  title: string;
  content: string;         // 剧集内容
  storyboards: Storyboard[];
  createdAt: string;
  updatedAt: string;
}

// 剧本
export interface Script {
  id: string;
  title: string;
  prompt?: string;         // 生成剧本的提示词
  content?: string;        // 剧本内容
  episodes: Episode[];
  currentPhase: VideoPhase;
  createdAt: string;
  updatedAt: string;
}

// 视频生成阶段
export type VideoPhase = 'storyboard' | 'video';

// 资产 Tab 类型
export type AssetTabType = 'storyboard' | 'character' | 'scene' | 'props';

// 角色资产
export interface Character {
  id: string;
  scriptId: string;
  name: string;
  description: string;           // 角色设定/信息
  designImageUrl?: string;       // 角色设计稿图片URL
  thumbnailUrl?: string;         // 缩略图
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// 场景资产
export interface Scene {
  id: string;
  scriptId: string;
  name: string;
  description: string;           // 场景设定/信息
  designImageUrl?: string;       // 场景设计稿图片URL
  thumbnailUrl?: string;         // 缩略图
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// 物品资产
export interface Prop {
  id: string;
  scriptId: string;
  name: string;
  description: string;           // 物品设定/信息
  designImageUrl?: string;       // 物品设计稿图片URL
  thumbnailUrl?: string;         // 缩略图
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
