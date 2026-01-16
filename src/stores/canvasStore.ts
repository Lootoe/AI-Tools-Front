import { create } from 'zustand';
import { Viewport, CanvasNode, CanvasEdge, NodeType, Canvas } from '@/types/canvas';
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
  canvases: Canvas[];
  currentCanvasId: string | null;
  viewport: Viewport;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
  currentScriptId: string | null;

  // 画布管理
  loadCanvases: (scriptId: string) => Promise<void>;
  createCanvas: (scriptId: string, name?: string) => Promise<string>;
  deleteCanvas: (scriptId: string, canvasId: string) => Promise<void>;
  renameCanvas: (scriptId: string, canvasId: string, name: string) => Promise<void>;
  switchCanvas: (canvasId: string) => void;

  // 画布操作
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
  getCurrentCanvas: () => Canvas | null;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // 初始状态
  canvases: [],
  currentCanvasId: null,
  viewport: { ...DEFAULT_VIEWPORT },
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,
  error: null,
  currentScriptId: null,

  // 加载所有画布
  loadCanvases: async (scriptId: string) => {
    set({ isLoading: true, error: null, currentScriptId: scriptId });
    try {
      const canvases = await canvasApi.fetchCanvases(scriptId);

      // 如果没有画布，创建默认画布
      if (canvases.length === 0) {
        const newCanvas = await canvasApi.createCanvas(scriptId, '画布 1');
        set({
          canvases: [newCanvas],
          currentCanvasId: newCanvas.id,
          viewport: newCanvas.viewport || { ...DEFAULT_VIEWPORT },
          nodes: newCanvas.nodes || [],
          edges: newCanvas.edges || [],
          isLoading: false,
        });
      } else {
        // 选择第一个画布
        const firstCanvas = canvases[0];
        set({
          canvases,
          currentCanvasId: firstCanvas.id,
          viewport: firstCanvas.viewport || { ...DEFAULT_VIEWPORT },
          nodes: firstCanvas.nodes || [],
          edges: firstCanvas.edges || [],
          isLoading: false,
        });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 创建画布
  createCanvas: async (scriptId: string, name?: string) => {
    const { canvases } = get();
    const canvasName = name || `画布 ${canvases.length + 1}`;

    try {
      const newCanvas = await canvasApi.createCanvas(scriptId, canvasName);
      set((state) => ({
        canvases: [...state.canvases, newCanvas],
        currentCanvasId: newCanvas.id,
        viewport: newCanvas.viewport || { ...DEFAULT_VIEWPORT },
        nodes: newCanvas.nodes || [],
        edges: newCanvas.edges || [],
      }));
      return newCanvas.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 删除画布
  deleteCanvas: async (scriptId: string, canvasId: string) => {
    const { canvases, currentCanvasId } = get();

    // 至少保留一个画布
    if (canvases.length <= 1) {
      set({ error: '至少需要保留一个画布' });
      return;
    }

    try {
      await canvasApi.deleteCanvas(scriptId, canvasId);

      const newCanvases = canvases.filter((c) => c.id !== canvasId);

      // 如果删除的是当前画布，切换到第一个画布
      if (currentCanvasId === canvasId) {
        const firstCanvas = newCanvases[0];
        set({
          canvases: newCanvases,
          currentCanvasId: firstCanvas.id,
          viewport: firstCanvas.viewport || { ...DEFAULT_VIEWPORT },
          nodes: firstCanvas.nodes || [],
          edges: firstCanvas.edges || [],
        });
      } else {
        set({ canvases: newCanvases });
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 重命名画布
  renameCanvas: async (scriptId: string, canvasId: string, name: string) => {
    try {
      await canvasApi.renameCanvas(scriptId, canvasId, name);
      set((state) => ({
        canvases: state.canvases.map((c) =>
          c.id === canvasId ? { ...c, name } : c
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 切换画布
  switchCanvas: (canvasId: string) => {
    const { canvases } = get();
    const canvas = canvases.find((c) => c.id === canvasId);
    if (canvas) {
      set({
        currentCanvasId: canvas.id,
        viewport: canvas.viewport || { ...DEFAULT_VIEWPORT },
        nodes: canvas.nodes || [],
        edges: canvas.edges || [],
        selectedNodeId: null,
      });
    }
  },

  // 设置视口（带缩放范围限制）
  setViewport: async (viewport: Viewport) => {
    const { currentScriptId, currentCanvasId } = get();
    if (!currentScriptId || !currentCanvasId) return;

    // 限制缩放范围
    const clampedViewport: Viewport = {
      x: viewport.x,
      y: viewport.y,
      zoom: clampZoom(viewport.zoom),
    };

    // 乐观更新
    set({ viewport: clampedViewport });

    // 同时更新 canvases 数组中的数据
    set((state) => ({
      canvases: state.canvases.map((c) =>
        c.id === currentCanvasId ? { ...c, viewport: clampedViewport } : c
      ),
    }));

    try {
      await canvasApi.updateViewport(currentScriptId, currentCanvasId, clampedViewport);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // 重置视口到默认状态
  resetViewport: async () => {
    const { currentScriptId, currentCanvasId } = get();
    if (!currentScriptId || !currentCanvasId) return;

    const defaultViewport = { ...DEFAULT_VIEWPORT };
    set({ viewport: defaultViewport });

    // 同时更新 canvases 数组中的数据
    set((state) => ({
      canvases: state.canvases.map((c) =>
        c.id === currentCanvasId ? { ...c, viewport: defaultViewport } : c
      ),
    }));

    try {
      await canvasApi.updateViewport(currentScriptId, currentCanvasId, defaultViewport);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // 添加节点
  addNode: async (type: NodeType, positionX: number, positionY: number, label?: string) => {
    const { currentScriptId, currentCanvasId } = get();
    if (!currentScriptId || !currentCanvasId) throw new Error('未选择画布');

    try {
      const newNode = await canvasApi.createNode(currentScriptId, currentCanvasId, {
        type,
        positionX,
        positionY,
        label,
      });
      set((state) => ({
        nodes: [...state.nodes, newNode],
        canvases: state.canvases.map((c) =>
          c.id === currentCanvasId ? { ...c, nodes: [...c.nodes, newNode] } : c
        ),
      }));
      return newNode.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 更新节点
  updateNode: async (nodeId: string, updates: canvasApi.UpdateNodeRequest) => {
    const { currentScriptId, currentCanvasId } = get();
    if (!currentScriptId || !currentCanvasId) return;

    // 乐观更新
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      canvases: state.canvases.map((c) =>
        c.id === currentCanvasId
          ? { ...c, nodes: c.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)) }
          : c
      ),
    }));

    try {
      await canvasApi.updateNode(currentScriptId, currentCanvasId, nodeId, updates);
    } catch (error) {
      // 回滚：重新加载画布
      await get().loadCanvases(currentScriptId);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 删除节点（级联删除关联边）
  deleteNode: async (nodeId: string) => {
    const { currentScriptId, currentCanvasId } = get();
    if (!currentScriptId || !currentCanvasId) return;

    // 乐观更新：删除节点和关联边
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      canvases: state.canvases.map((c) =>
        c.id === currentCanvasId
          ? {
            ...c,
            nodes: c.nodes.filter((node) => node.id !== nodeId),
            edges: c.edges.filter(
              (edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
            ),
          }
          : c
      ),
    }));

    try {
      // 后端会级联删除关联边，只需删除节点
      await canvasApi.deleteNode(currentScriptId, currentCanvasId, nodeId);
    } catch (error) {
      // 回滚：重新加载画布
      await get().loadCanvases(currentScriptId);
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
    const { currentScriptId, currentCanvasId, edges } = get();
    if (!currentScriptId || !currentCanvasId) throw new Error('未选择画布');

    // 检查是否已存在相同连接
    const existingEdge = edges.find(
      (edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId
    );
    if (existingEdge) {
      return existingEdge.id;
    }

    try {
      const newEdge = await canvasApi.createEdge(currentScriptId, currentCanvasId, {
        sourceNodeId,
        targetNodeId,
      });
      set((state) => ({
        edges: [...state.edges, newEdge],
        canvases: state.canvases.map((c) =>
          c.id === currentCanvasId ? { ...c, edges: [...c.edges, newEdge] } : c
        ),
      }));
      return newEdge.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 删除连接
  deleteEdge: async (edgeId: string) => {
    const { currentScriptId, currentCanvasId } = get();
    if (!currentScriptId || !currentCanvasId) return;

    // 乐观更新
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
      canvases: state.canvases.map((c) =>
        c.id === currentCanvasId
          ? { ...c, edges: c.edges.filter((edge) => edge.id !== edgeId) }
          : c
      ),
    }));

    try {
      await canvasApi.deleteEdge(currentScriptId, currentCanvasId, edgeId);
    } catch (error) {
      // 回滚：重新加载画布
      await get().loadCanvases(currentScriptId);
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

  // 获取当前画布
  getCurrentCanvas: () => {
    const { canvases, currentCanvasId } = get();
    return canvases.find((c) => c.id === currentCanvasId) || null;
  },

  // 清空画布状态
  clearCanvas: () => {
    set({
      canvases: [],
      currentCanvasId: null,
      viewport: { ...DEFAULT_VIEWPORT },
      nodes: [],
      edges: [],
      selectedNodeId: null,
      currentScriptId: null,
      error: null,
    });
  },
}));
