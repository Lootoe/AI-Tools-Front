import { Canvas, Viewport, CanvasNode, CanvasEdge, NodeType, NodeStatus } from '@/types/canvas';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// 获取所有画布
export async function fetchCanvases(scriptId: string): Promise<Canvas[]> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '获取画布列表失败');
  }

  const result = await response.json();
  return result.data.canvases;
}

// 获取单个画布数据
export async function fetchCanvas(scriptId: string, canvasId: string): Promise<Canvas> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '获取画布数据失败');
  }

  const result = await response.json();
  return result.data.canvas;
}

// 创建画布
export async function createCanvas(scriptId: string, name: string): Promise<Canvas> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '创建画布失败');
  }

  const result = await response.json();
  return result.data.canvas;
}

// 重命名画布
export async function renameCanvas(scriptId: string, canvasId: string, name: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '重命名画布失败');
  }
}

// 删除画布
export async function deleteCanvas(scriptId: string, canvasId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '删除画布失败');
  }
}

// 更新画布视口
export async function updateViewport(scriptId: string, canvasId: string, viewport: Viewport): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}/viewport`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ viewport }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '更新视口失败');
  }
}

// 创建节点请求参数
export interface CreateNodeRequest {
  type: NodeType;
  positionX: number;
  positionY: number;
  label?: string;
}

// 创建节点
export async function createNode(scriptId: string, canvasId: string, data: CreateNodeRequest): Promise<CanvasNode> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}/nodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '创建节点失败');
  }

  const result = await response.json();
  return result.data;
}


// 更新节点请求参数
export interface UpdateNodeRequest {
  positionX?: number;
  positionY?: number;
  label?: string;
  model?: string;
  prompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  imageUrl?: string;
  status?: NodeStatus;
  progress?: string;
  failReason?: string;
}

// 更新节点
export async function updateNode(
  scriptId: string,
  canvasId: string,
  nodeId: string,
  updates: UpdateNodeRequest
): Promise<CanvasNode> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}/nodes/${nodeId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '更新节点失败');
  }

  const result = await response.json();
  return result.data;
}

// 删除节点
export async function deleteNode(scriptId: string, canvasId: string, nodeId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}/nodes/${nodeId}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '删除节点失败');
  }
}

// 创建连接请求参数
export interface CreateEdgeRequest {
  sourceNodeId: string;
  targetNodeId: string;
}

// 创建连接
export async function createEdge(scriptId: string, canvasId: string, data: CreateEdgeRequest): Promise<CanvasEdge> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}/edges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '创建连接失败');
  }

  const result = await response.json();
  return result.data;
}

// 删除连接
export async function deleteEdge(scriptId: string, canvasId: string, edgeId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvases/${canvasId}/edges/${edgeId}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || '删除连接失败');
  }
}
