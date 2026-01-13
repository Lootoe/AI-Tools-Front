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
  referenceImageUrl?: string;    // 参考图URL（单张）
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
  storyboardImages: StoryboardImage[]; // 分镜图列表（用于图片生成）
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
export type AssetTabType = 'storyboard' | 'storyboardImage' | 'asset' | 'character';

// Sora2角色
export interface Character {
  id: string;
  scriptId: string;
  name: string;
  description: string;
  referenceImageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  taskId?: string;
  progress?: string;
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  // Sora2 角色注册信息（用于多视频角色一致性）
  soraCharacterId?: string;       // Sora2 角色ID (ch_xxx)
  soraUsername?: string;          // Sora2 用户名
  soraPermalink?: string;         // Sora2 角色主页链接
  soraProfilePictureUrl?: string; // Sora2 角色头像URL
  createdAt: string;
  updatedAt: string;
}

// 分镜图副本（分镜图池中的单个图片）
export interface ImageVariant {
  id: string;
  storyboardId: string;
  imageUrl?: string;       // 生成的图片URL
  thumbnailUrl?: string;
  taskId?: string;         // 任务ID
  progress?: string;       // 生成进度百分比
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  createdAt: string;
}

// 分镜图（用于图片生成）
export interface StoryboardImage {
  id: string;
  episodeId: string;
  sceneNumber: number;
  description: string;
  referenceImageUrls?: string[]; // 参考图URL数组（支持多张）
  aspectRatio?: '16:9' | '1:1' | '4:3'; // 图片比例
  createdAt: string;
  // 分镜图池相关
  imageVariants: ImageVariant[];  // 分镜图副本列表
  activeImageVariantId?: string;  // 当前选中的副本ID
  // 兼容旧数据
  imageUrl?: string;
  thumbnailUrl?: string;
  taskId?: string;
  progress?: string;
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
}
