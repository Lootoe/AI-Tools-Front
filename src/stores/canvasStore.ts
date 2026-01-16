import { create } from 'zustand';
import { Viewport, CanvasNode, CanvasEdge, NodeType } from '@/types/canvas';
import * as canvasApi from '@/services/canvasApi';

// 默认视口状态
const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

// 缩放范围常量
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3.0;

// 辅助函数：限制缩放范围
export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

interface CanvasState {
  // 状态
  viewport: Viewport;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
  currentScriptId: string | null;

  // 画布操作
  loadCanvas: (scriptId: string) => Promise<void>;
  setViewport: (viewport: Viewport) => Promise<void>;
  resetViewport: () => Promise<void>;

  // 节点操作
  addNode: (type: NodeType, positionX: number, positionY: number, label?: string) => Promise<string>;
  updateNode: (nodeId: string, updates: canvasApi.UpdateNodeRequest) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  selectNode: (nodeId: string | null) => void;

  // 连接操作
  addEdge: (sourceNodeId: string, targetNodeId: string) => Promise<string>;
  deleteEdge: (edgeId: string) => Promise<void>;

  // 辅助方法
  getConnectedInputUrls: (nodeId: string) => string[];
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // 初始状态
  viewport: { ...DEFAULT_VIEWPORT },
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,
  error: null,
  currentScriptId: null,

  // 加载画布数据
  loadCanvas: async (scriptId: string) => {
    set({ isLoading: true, error: null, currentScriptId: scriptId });
    try {
      const canvas = await canvasApi.fetchCanvas(scriptId);
      set({
        viewport: canvas.viewport || { ...DEFAULT_VIEWPORT },
        nodes: canvas.nodes || [],
        edges: canvas.edges || [],
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 设置视口（带缩放范围限制）
  setViewport: async (viewport: Viewport) => {
    const { currentScriptId } = get();
    if (!currentScriptId) return;

    // 限制缩放范围
    const clampedViewport: Viewport = {
      x: viewport.x,
      y: viewport.y,
      zoom: clampZoom(viewport.zoom),
    };

    // 乐观更新
    set({ viewport: clampedViewport });

    try {
      await canvasApi.updateViewport(currentScriptId, clampedViewport);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // 重置视口到默认状态
  resetViewport: async () => {
    const { currentScriptId } = get();
    if (!currentScriptId) return;

    const defaultViewport = { ...DEFAULT_VIEWPORT };
    set({ viewport: defaultViewport });

    try {
      await canvasApi.updateViewport(currentScriptId, defaultViewport);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // 添加节点
  addNode: async (type: NodeType, positionX: number, positionY: number, label?: string) => {
    const { currentScriptId } = get();
    if (!currentScriptId) throw new Error('未选择脚本');

    try {
      const newNode = await canvasApi.createNode(currentScriptId, {
        type,
        positionX,
        positionY,
        label,
      });
      set((state) => ({ nodes: [...state.nodes, newNode] }));
      return newNode.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 更新节点
  updateNode: async (nodeId: string, updates: canvasApi.UpdateNodeRequest) => {
    const { currentScriptId } = get();
    if (!currentScriptId) return;

    // 乐观更新
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));

    try {
      await canvasApi.updateNode(currentScriptId, nodeId, updates);
    } catch (error) {
      // 回滚：重新加载画布
      await get().loadCanvas(currentScriptId);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 删除节点（级联删除关联边）
  deleteNode: async (nodeId: string) => {
    const { currentScriptId } = get();
    if (!currentScriptId) return;

    // 乐观更新：删除节点和关联边
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));

    try {
      // 后端会级联删除关联边，只需删除节点
      await canvasApi.deleteNode(currentScriptId, nodeId);
    } catch (error) {
      // 回滚：重新加载画布
      await get().loadCanvas(currentScriptId);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 选择节点
  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  // 添加连接
  addEdge: async (sourceNodeId: string, targetNodeId: string) => {
    const { currentScriptId, edges } = get();
    if (!currentScriptId) throw new Error('未选择脚本');

    // 检查是否已存在相同连接
    const existingEdge = edges.find(
      (edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId
    );
    if (existingEdge) {
      return existingEdge.id;
    }

    try {
      const newEdge = await canvasApi.createEdge(currentScriptId, {
        sourceNodeId,
        targetNodeId,
      });
      set((state) => ({ edges: [...state.edges, newEdge] }));
      return newEdge.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 删除连接
  deleteEdge: async (edgeId: string) => {
    const { currentScriptId } = get();
    if (!currentScriptId) return;

    // 乐观更新
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));

    try {
      await canvasApi.deleteEdge(currentScriptId, edgeId);
    } catch (error) {
      // 回滚：重新加载画布
      await get().loadCanvas(currentScriptId);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 获取连接到指定节点的所有上游节点的图片 URL
  getConnectedInputUrls: (nodeId: string) => {
    const { nodes, edges } = get();
    
    // 找出所有指向该节点的边
    const incomingEdges = edges.filter((edge) => edge.targetNodeId === nodeId);
    
    // 获取上游节点的图片 URL
    const urls: string[] = [];
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((node) => node.id === edge.sourceNodeId);
      if (sourceNode?.imageUrl) {
        urls.push(sourceNode.imageUrl);
      }
    }
    
    return urls;
  },

  // 清空画布状态
  clearCanvas: () => {
    set({
      viewport: { ...DEFAULT_VIEWPORT },
      nodes: [],
      edges: [],
      selectedNodeId: null,
      currentScriptId: null,
      error: null,
    });
  },
}));
