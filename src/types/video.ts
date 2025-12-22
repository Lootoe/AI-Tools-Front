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
  createdAt: number;
}

// 分镜
export interface Storyboard {
  id: string;
  episodeId: string;
  sceneNumber: number;
  description: string;
  characterIds: string[];  // 参与的角色ID
  videoUrl?: string;       // sora2 生成的视频
  thumbnailUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: number;
}

// 剧集
export interface Episode {
  id: string;
  scriptId: string;
  episodeNumber: number;
  title: string;
  content: string;         // 剧集内容
  storyboards: Storyboard[];
  createdAt: number;
  updatedAt: number;
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
  createdAt: number;
  updatedAt: number;
}

// 视频生成阶段
export type VideoPhase = 'storyboard' | 'video';

// 资源面板 Tab
export type ResourceTab = 'episodes' | 'characters';
