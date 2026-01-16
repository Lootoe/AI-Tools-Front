// 画布相关类型定义

// 视口状态
export interface Viewport {
  x: number;      // 画布偏移 X
  y: number;      // 画布偏移 Y
  zoom: number;   // 缩放比例 0.1 - 3.0
}

// 位置坐标
export interface Position {
  x: number;
  y: number;
}

// 节点类型
export type NodeType = 'generator' | 'input';

// 节点状态
export type NodeStatus = 'idle' | 'generating' | 'completed' | 'failed';

// 画布节点
export interface CanvasNode {
  id: string;
  canvasId: string;
  type: NodeType;
  positionX: number;
  positionY: number;
  label?: string;
  // 生成节点专用
  model?: string;
  prompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  // 通用
  imageUrl?: string;
  status: NodeStatus;
  progress?: string;
  failReason?: string;
  createdAt: string;
  updatedAt: string;
}

// 画布连接
export interface CanvasEdge {
  id: string;
  canvasId: string;
  sourceNodeId: string;
  targetNodeId: string;
  createdAt: string;
}

// 画布
export interface Canvas {
  id: string;
  scriptId: string;
  name: string;           // 画布名称
  viewport: Viewport | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  createdAt: string;
  updatedAt: string;
}

// 资产分类
export interface AssetCategory {
  id: string;
  scriptId: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 已保存资产
export interface SavedAsset {
  id: string;
  categoryId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  name?: string;
  sourceNodeId?: string;
  createdAt: string;
}
