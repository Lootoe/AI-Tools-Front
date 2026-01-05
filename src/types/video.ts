// 视频生成相关类型定义

// 角色
export interface Character {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;       // sora2 生成的角色视频
  thumbnailUrl?: string;   // 缩略图
  taskId?: string;         // sora2 任务ID，用于恢复轮询
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  // Sora2 角色信息
  characterId?: string;    // Sora2 角色ID（例如 ch_xxx）
  username?: string;       // Sora2 角色用户名
  permalink?: string;      // Sora2 角色主页链接
  profilePictureUrl?: string; // Sora2 角色头像URL
  isCreatingCharacter?: boolean; // 是否正在创建角色（确认形象中）
}

// 分镜
export interface Storyboard {
  id: string;
  episodeId: string;
  sceneNumber: number;
  description: string;
  characterIds: string[];  // 参与的角色ID
  referenceImageUrls?: string[]; // 参考图URL数组（支持多张）
  videoUrl?: string;       // sora2 生成的视频
  thumbnailUrl?: string;
  taskId?: string;         // sora2 任务ID，用于恢复轮询
  progress?: string;       // 生成进度百分比
  aspectRatio?: '16:9' | '9:16'; // 视频比例
  duration?: '10' | '15';  // 视频时长（秒）
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  createdAt: string;
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
  characters: Character[];
  episodes: Episode[];
  currentPhase: VideoPhase;
  createdAt: string;
  updatedAt: string;
}

// 视频生成阶段
export type VideoPhase = 'storyboard' | 'video';

// 资源面板 Tab
export type ResourceTab = 'episodes' | 'characters';
