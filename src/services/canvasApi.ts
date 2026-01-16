import { Canvas, Viewport, CanvasNode, CanvasEdge, NodeType, NodeStatus } from '@/types/canvas';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// 获取画布数据
export async function fetchCanvas(scriptId: string): Promise<Canvas> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvas`, {
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

// 更新画布视口
export async function updateViewport(scriptId: string, viewport: Viewport): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvas/viewport`, {
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
export async function createNode(scriptId: string, data: CreateNodeRequest): Promise<CanvasNode> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvas/nodes`, {
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
  nodeId: string,
  updates: UpdateNodeRequest
): Promise<CanvasNode> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvas/nodes/${nodeId}`, {
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
export async function deleteNode(scriptId: string, nodeId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvas/nodes/${nodeId}`, {
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
export async function createEdge(scriptId: string, data: CreateEdgeRequest): Promise<CanvasEdge> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvas/edges`, {
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
export async function deleteEdge(scriptId: string, edgeId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${BACKEND_URL}/api/scripts/${scriptId}/canvas/edges/${edgeId}`, {
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
