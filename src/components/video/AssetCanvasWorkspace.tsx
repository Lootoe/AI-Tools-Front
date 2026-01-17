/**
 * AssetCanvasWorkspace - 资产画布工作区
 * 
 * 整合 InfiniteCanvas、节点、连接组件
 * 实现画布加载和初始化
 * 实现自动保存逻辑（防抖）
 * 
 * Requirements: 1.1, 8.1, 8.2
 */
import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useToast } from '@/components/ui/Toast';
import { InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  InfiniteCanvas,
  CanvasToolbar,
  CanvasTabs,
  GeneratorNode,
  InputNode,
  CanvasEdge,
  CanvasEdgeDefs,
  ContextMenu,
  useContextMenu,
  SaveAssetDialog,
  NODE_WIDTH,
  PORT_OFFSET,
} from '@/components/canvas';
import { Position, Viewport } from '@/types/canvas';
import { uploadImage } from '@/services/api';
import { generateAssetDesign } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { IMAGE_MODELS } from '@/components/canvas/GeneratorNode';

interface AssetCanvasWorkspaceProps {
  scriptId: string;
}

// 防抖延迟时间（毫秒）
const DEBOUNCE_DELAY = 500;

// 静态计算端口位置（用于临时连线）
// 端口固定在节点头部位置（距离顶部22px）
function getOutputPortPositionStatic(nodeX: number, nodeY: number, _nodeHeight: number): Position {
  return {
    x: nodeX + NODE_WIDTH + PORT_OFFSET,
    y: nodeY + 22, // 微调位置
  };
}

// 节点高度常量（备用）
const NODE_HEIGHT_INPUT = 292;
const NODE_HEIGHT_GENERATOR = 620; // 头部40 + 图片278 + 配置面板302

function getNodeHeight(nodeType?: string): number {
  return nodeType === 'input' ? NODE_HEIGHT_INPUT : NODE_HEIGHT_GENERATOR;
}

export const AssetCanvasWorkspace: React.FC<AssetCanvasWorkspaceProps> = ({
  scriptId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast, ToastContainer } = useToast();
  const { updateBalance } = useAuthStore();

  // Canvas store
  const {
    canvases,
    currentCanvasId,
    viewport,
    nodes,
    edges,
    selectedNodeId,
    isLoading,
    error,
    loadCanvases,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    switchCanvas,
    setViewport,
    resetViewport,
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    addEdge,
    deleteEdge,
    getConnectedInputUrls,
  } = useCanvasStore();

  // Repository store (for save asset dialog)
  const {
    categories,
    loadCategories,
    createCategory,
    saveAsset,
  } = useRepositoryStore();

  // Context menu state
  const contextMenu = useContextMenu();

  // Connection drag state
  const [connectionDrag, setConnectionDrag] = useState<{
    isActive: boolean;
    sourceNodeId: string | null;
    sourceNodeType: string | null;
    sourcePosition: Position | null;
    currentPosition: Position | null;
  }>({
    isActive: false,
    sourceNodeId: null,
    sourceNodeType: null,
    sourcePosition: null,
    currentPosition: null,
  });

  // Save asset dialog state
  const [saveDialog, setSaveDialog] = useState<{
    isOpen: boolean;
    imageUrl: string;
    nodeId: string | null;
  }>({
    isOpen: false,
    imageUrl: '',
    nodeId: null,
  });

  // Selected edge for deletion
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Delete node confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    nodeId: string | null;
  }>({
    isOpen: false,
    nodeId: null,
  });

  // Delete canvas confirmation dialog state
  const [deleteCanvasConfirm, setDeleteCanvasConfirm] = useState<{
    isOpen: boolean;
    canvasId: string | null;
  }>({
    isOpen: false,
    canvasId: null,
  });

  // Debounce timer ref for viewport changes
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Load canvas data on mount
  useEffect(() => {
    if (scriptId) {
      loadCanvases(scriptId);
      loadCategories(scriptId);
    }
  }, [scriptId, loadCanvases, loadCategories]);

  // Show error toast
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  // Debounced viewport change handler
  const handleViewportChange = useCallback((newViewport: Viewport) => {
    // Clear existing debounce timer
    if (viewportDebounceRef.current) {
      clearTimeout(viewportDebounceRef.current);
    }

    // Set new debounce timer
    viewportDebounceRef.current = setTimeout(() => {
      setViewport(newViewport);
    }, DEBOUNCE_DELAY);

    // Update local state immediately for smooth interaction
    useCanvasStore.setState({ viewport: newViewport });
  }, [setViewport]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
    };
  }, []);

  // Handle create canvas
  const handleCreateCanvas = useCallback(async () => {
    try {
      await createCanvas(scriptId);
      showToast('画布已创建', 'success');
    } catch {
      showToast('创建画布失败', 'error');
    }
  }, [scriptId, createCanvas, showToast]);

  // Handle delete canvas - show confirmation dialog
  const handleDeleteCanvas = useCallback((canvasId: string) => {
    setDeleteCanvasConfirm({
      isOpen: true,
      canvasId,
    });
  }, []);

  // Confirm canvas deletion
  const confirmCanvasDelete = useCallback(async () => {
    if (!deleteCanvasConfirm.canvasId) return;

    try {
      await deleteCanvas(scriptId, deleteCanvasConfirm.canvasId);
      showToast('画布已删除', 'success');
    } catch (err) {
      const error = err as Error;
      showToast(error.message || '删除画布失败', 'error');
    } finally {
      setDeleteCanvasConfirm({ isOpen: false, canvasId: null });
    }
  }, [deleteCanvasConfirm.canvasId, scriptId, deleteCanvas, showToast]);

  // Handle rename canvas
  const handleRenameCanvas = useCallback(async (canvasId: string, name: string) => {
    try {
      await renameCanvas(scriptId, canvasId, name);
      showToast('画布已重命名', 'success');
    } catch {
      showToast('重命名失败', 'error');
    }
  }, [scriptId, renameCanvas, showToast]);

  // Handle context menu open
  const handleContextMenu = useCallback((canvasPosition: Position) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenPosition: Position = {
      x: canvasPosition.x * viewport.zoom + viewport.x + rect.left,
      y: canvasPosition.y * viewport.zoom + viewport.y + rect.top,
    };
    contextMenu.open(canvasPosition, screenPosition);
  }, [viewport, contextMenu]);

  // Handle create generator node
  const handleCreateGeneratorNode = useCallback(async () => {
    if (!contextMenu.state.canvasPosition) return;
    try {
      await addNode('generator', contextMenu.state.canvasPosition.x, contextMenu.state.canvasPosition.y);
      showToast('生成节点已创建', 'success');
    } catch {
      showToast('创建节点失败', 'error');
    }
  }, [contextMenu.state.canvasPosition, addNode, showToast]);

  // Handle create input node
  const handleCreateInputNode = useCallback(async () => {
    if (!contextMenu.state.canvasPosition) return;
    try {
      await addNode('input', contextMenu.state.canvasPosition.x, contextMenu.state.canvasPosition.y);
      showToast('输入节点已创建', 'success');
    } catch {
      showToast('创建节点失败', 'error');
    }
  }, [contextMenu.state.canvasPosition, addNode, showToast]);

  // Handle node move (local state only, no API call)
  const handleNodeMoveLocal = useCallback((nodeId: string, position: Position) => {
    // 仅更新本地状态，不触发 API 请求
    useCanvasStore.setState((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, positionX: position.x, positionY: position.y } : node
      ),
    }));
  }, []);

  // Handle node move end (trigger API save)
  const handleNodeMoveEnd = useCallback(async (nodeId: string, position: Position) => {
    await updateNode(nodeId, { positionX: position.x, positionY: position.y });
  }, [updateNode]);

  // Handle node delete - show confirmation dialog
  const handleNodeDelete = useCallback((nodeId: string) => {
    setDeleteConfirm({
      isOpen: true,
      nodeId,
    });
  }, []);

  // Confirm node deletion
  const confirmNodeDelete = useCallback(async () => {
    if (!deleteConfirm.nodeId) return;

    try {
      await deleteNode(deleteConfirm.nodeId);
      showToast('节点已删除', 'success');
    } catch {
      showToast('删除节点失败', 'error');
    } finally {
      setDeleteConfirm({ isOpen: false, nodeId: null });
    }
  }, [deleteConfirm.nodeId, deleteNode, showToast]);

  // Handle node duplicate
  const handleNodeDuplicate = useCallback(async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    try {
      // 在原节点旁边创建新节点（位置偏移 50px）
      const newNodeId = await addNode(
        node.type,
        node.positionX + 50,
        node.positionY + 50,
        node.label ? `${node.label} (副本)` : undefined
      );

      // 复制节点的其他属性
      const updates: any = {};
      if (node.prompt) updates.prompt = node.prompt;
      if (node.model) updates.model = node.model;
      if (node.aspectRatio) updates.aspectRatio = node.aspectRatio;
      if (node.imageSize) updates.imageSize = node.imageSize;
      if (node.imageUrl) updates.imageUrl = node.imageUrl;

      if (Object.keys(updates).length > 0) {
        await updateNode(newNodeId, updates);
      }

      // 选中新创建的节点，使其显示在最上层
      selectNode(newNodeId);

      showToast('节点已复制', 'success');
    } catch {
      showToast('复制节点失败', 'error');
    }
  }, [nodes, addNode, updateNode, selectNode, showToast]);

  // Handle start connection drag
  const handleStartConnect = useCallback((nodeId: string, _portType: 'output') => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // 动态获取输出端口的实际位置
    let outputPortPos: Position;
    const portElement = document.querySelector(
      `.node-port[data-node-id="${nodeId}"][data-port-type="output"]`
    ) as HTMLElement;

    if (portElement && containerRef.current) {
      const portRect = portElement.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // 转换为画布坐标
      outputPortPos = {
        x: (portRect.left + portRect.width / 2 - containerRect.left - viewport.x) / viewport.zoom,
        y: (portRect.top + portRect.height / 2 - containerRect.top - viewport.y) / viewport.zoom,
      };
    } else {
      // 降级：使用旧的计算方法
      const nodeHeight = getNodeHeight(node.type);
      outputPortPos = getOutputPortPositionStatic(node.positionX, node.positionY, nodeHeight);
    }

    setConnectionDrag({
      isActive: true,
      sourceNodeId: nodeId,
      sourceNodeType: node.type,
      sourcePosition: { x: node.positionX, y: node.positionY },
      currentPosition: outputPortPos,
    });
  }, [nodes, viewport]);

  // Handle end connection drag - 当拖到目标节点上时触发
  const handleEndConnect = useCallback(async (targetNodeId: string, _portType: 'input') => {
    if (!connectionDrag.isActive || !connectionDrag.sourceNodeId) return;
    if (connectionDrag.sourceNodeId === targetNodeId) {
      setConnectionDrag({ isActive: false, sourceNodeId: null, sourceNodeType: null, sourcePosition: null, currentPosition: null });
      return;
    }

    try {
      await addEdge(connectionDrag.sourceNodeId, targetNodeId);
      showToast('连接已创建', 'success');
    } catch {
      showToast('创建连接失败', 'error');
    }

    setConnectionDrag({ isActive: false, sourceNodeId: null, sourceNodeType: null, sourcePosition: null, currentPosition: null });
  }, [connectionDrag, addEdge, showToast]);

  // 检测鼠标释放时是否在某个节点上（用于连线）
  const findNodeAtPosition = useCallback((canvasPos: Position): string | null => {
    // 遍历所有节点，检查位置是否在节点范围内
    for (const node of nodes) {
      const nodeHeight = getNodeHeight(node.type);
      const nodeLeft = node.positionX;
      const nodeRight = node.positionX + NODE_WIDTH;
      const nodeTop = node.positionY;
      const nodeBottom = node.positionY + nodeHeight;

      if (canvasPos.x >= nodeLeft && canvasPos.x <= nodeRight &&
        canvasPos.y >= nodeTop && canvasPos.y <= nodeBottom) {
        return node.id;
      }
    }
    return null;
  }, [nodes]);


  // Handle mouse move for connection drag
  useEffect(() => {
    if (!connectionDrag.isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const canvasPos: Position = {
        x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
        y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
      };
      setConnectionDrag((prev) => ({ ...prev, currentPosition: canvasPos }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!containerRef.current) {
        setConnectionDrag({ isActive: false, sourceNodeId: null, sourceNodeType: null, sourcePosition: null, currentPosition: null });
        return;
      }

      // 计算鼠标释放位置对应的画布坐标
      const rect = containerRef.current.getBoundingClientRect();
      const canvasPos: Position = {
        x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
        y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
      };

      // 检查是否在某个节点上释放
      const targetNodeId = findNodeAtPosition(canvasPos);
      if (targetNodeId && targetNodeId !== connectionDrag.sourceNodeId) {
        // 检查目标节点是否是输入节点（输入节点不能接收连线）
        const targetNode = nodes.find((n) => n.id === targetNodeId);
        if (targetNode?.type === 'input') {
          showToast('输入节点不能接收连线', 'error');
          setConnectionDrag({ isActive: false, sourceNodeId: null, sourceNodeType: null, sourcePosition: null, currentPosition: null });
          return;
        }
        // 在目标节点上释放，创建连接
        handleEndConnect(targetNodeId, 'input');
      } else {
        // 不在节点上释放，取消连接
        setConnectionDrag({ isActive: false, sourceNodeId: null, sourceNodeType: null, sourcePosition: null, currentPosition: null });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [connectionDrag.isActive, connectionDrag.sourceNodeId, viewport, findNodeAtPosition, handleEndConnect]);

  // Handle edge delete
  const handleEdgeDelete = useCallback(async (edgeId: string) => {
    try {
      await deleteEdge(edgeId);
      setSelectedEdgeId(null);
      showToast('连接已删除', 'success');
    } catch {
      showToast('删除连接失败', 'error');
    }
  }, [deleteEdge, showToast]);

  // Handle image upload for input node
  const handleUploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const result = await uploadImage(file);
      if (result.success && result.url) {
        return result.url;
      }
      showToast('上传失败', 'error');
      return null;
    } catch {
      showToast('上传失败', 'error');
      return null;
    }
  }, [showToast]);

  // Handle generate for generator node
  const handleGenerate = useCallback(async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !node.prompt?.trim()) return;

    const model = node.model || 'nano-banana-2';
    const modelInfo = IMAGE_MODELS.find((m) => m.value === model) || IMAGE_MODELS[0];
    const tokenCost = modelInfo.cost;

    // Deduct balance optimistically
    updateBalance((prev) => prev - tokenCost);

    // Update node status to generating
    await updateNode(nodeId, { status: 'generating', progress: '0%' });

    try {
      const connectedUrls = getConnectedInputUrls(nodeId);
      const aspectRatio = (node.aspectRatio || '1:1') as '1:1' | '4:3' | '16:9';
      const imageSize = (node.imageSize || '1K') as '1K' | '2K';
      const response = await generateAssetDesign(
        nodeId,
        scriptId,
        node.prompt,
        model,
        connectedUrls,
        aspectRatio,
        imageSize
      );

      if (response.success && response.images?.[0]?.url) {
        await updateNode(nodeId, {
          status: 'completed',
          imageUrl: response.images[0].url,
          progress: undefined,
        });
        showToast('生成成功', 'success');
      } else {
        await updateNode(nodeId, {
          status: 'failed',
          failReason: '生成失败',
          progress: undefined,
        });
        showToast('生成失败', 'error');
      }

      if (response.balance !== undefined) {
        updateBalance(response.balance);
      }
    } catch (err) {
      await updateNode(nodeId, {
        status: 'failed',
        failReason: (err as Error).message || '生成失败',
        progress: undefined,
      });
      showToast('生成失败', 'error');
    }
  }, [nodes, scriptId, updateNode, getConnectedInputUrls, updateBalance, showToast]);

  // Handle save asset
  const handleOpenSaveDialog = useCallback((nodeId: string, imageUrl: string) => {
    setSaveDialog({ isOpen: true, imageUrl, nodeId });
  }, []);

  const handleSaveAsset = useCallback(async (categoryId: string, name?: string) => {
    if (!saveDialog.imageUrl) return;
    try {
      await saveAsset(categoryId, saveDialog.imageUrl, name, saveDialog.nodeId || undefined);
      showToast('资产已保存', 'success');
      setSaveDialog({ isOpen: false, imageUrl: '', nodeId: null });
    } catch {
      showToast('保存失败', 'error');
    }
  }, [saveDialog, saveAsset, showToast]);

  const handleCreateCategory = useCallback(async (name: string): Promise<string> => {
    return await createCategory(name);
  }, [createCategory]);


  // Calculate temp connection path for drag
  // Calculate temp connection path for drag
  const tempConnectionPath = useMemo(() => {
    if (!connectionDrag.isActive || !connectionDrag.sourcePosition || !connectionDrag.currentPosition) {
      return null;
    }

    // 动态获取源节点输出端口的实际位置
    let sourcePort: Position;
    if (connectionDrag.sourceNodeId) {
      const portElement = document.querySelector(
        `.node-port[data-node-id="${connectionDrag.sourceNodeId}"][data-port-type="output"]`
      ) as HTMLElement;

      if (portElement && containerRef.current) {
        const portRect = portElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // 转换为画布坐标
        sourcePort = {
          x: (portRect.left + portRect.width / 2 - containerRect.left - viewport.x) / viewport.zoom,
          y: (portRect.top + portRect.height / 2 - containerRect.top - viewport.y) / viewport.zoom,
        };
      } else {
        // 降级：使用旧的计算方法
        const sourceHeight = getNodeHeight(connectionDrag.sourceNodeType || undefined);
        sourcePort = getOutputPortPositionStatic(connectionDrag.sourcePosition.x, connectionDrag.sourcePosition.y, sourceHeight);
      }
    } else {
      // 降级：使用旧的计算方法
      const sourceHeight = getNodeHeight(connectionDrag.sourceNodeType || undefined);
      sourcePort = getOutputPortPositionStatic(connectionDrag.sourcePosition.x, connectionDrag.sourcePosition.y, sourceHeight);
    }

    const dx = Math.abs(connectionDrag.currentPosition.x - sourcePort.x);
    const controlOffset = Math.max(50, dx * 0.4);
    const cp1x = sourcePort.x + controlOffset;
    const cp1y = sourcePort.y;
    const cp2x = connectionDrag.currentPosition.x - controlOffset;
    const cp2y = connectionDrag.currentPosition.y;
    return `M ${sourcePort.x} ${sourcePort.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${connectionDrag.currentPosition.x} ${connectionDrag.currentPosition.y}`;
  }, [connectionDrag, viewport]);

  // Handle keyboard events for node deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框中，不处理删除
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); // 防止浏览器后退
        if (selectedNodeId) {
          handleNodeDelete(selectedNodeId);
        } else if (selectedEdgeId) {
          handleEdgeDelete(selectedEdgeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, handleNodeDelete, handleEdgeDelete]);

  // Loading state
  if (isLoading && nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <InlineLoading size={24} color="#00f5ff" />
        <span className="ml-2 text-sm" style={{ color: '#9ca3af' }}>加载画布...</span>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />

      {/* Save Asset Dialog */}
      <SaveAssetDialog
        isOpen={saveDialog.isOpen}
        imageUrl={saveDialog.imageUrl}
        categories={categories}
        onSave={handleSaveAsset}
        onCreateCategory={handleCreateCategory}
        onClose={() => setSaveDialog({ isOpen: false, imageUrl: '', nodeId: null })}
      />

      {/* Delete Node Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="删除节点"
        message="确定要删除这个节点吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmNodeDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, nodeId: null })}
      />

      {/* Delete Canvas Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteCanvasConfirm.isOpen}
        title="删除画布"
        message="确定要删除这个画布吗？画布中的所有节点和连线都将被删除，此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmCanvasDelete}
        onCancel={() => setDeleteCanvasConfirm({ isOpen: false, canvasId: null })}
      />

      {/* Context Menu */}
      {contextMenu.state.isOpen && contextMenu.state.canvasPosition && contextMenu.state.screenPosition && (
        <ContextMenu
          position={contextMenu.state.canvasPosition}
          screenPosition={contextMenu.state.screenPosition}
          onCreateGeneratorNode={handleCreateGeneratorNode}
          onCreateInputNode={handleCreateInputNode}
          onClose={contextMenu.close}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
        {/* Canvas Tabs */}
        <CanvasTabs
          canvases={canvases}
          currentCanvasId={currentCanvasId}
          onSwitch={switchCanvas}
          onCreate={handleCreateCanvas}
          onDelete={handleDeleteCanvas}
          onRename={handleRenameCanvas}
        />

        {/* Toolbar */}
        <CanvasToolbar
          viewport={viewport}
          onViewportChange={handleViewportChange}
          onResetView={resetViewport}
        />

        {/* Canvas Container */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <InfiniteCanvas
            viewport={viewport}
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onViewportChange={handleViewportChange}
            onNodeSelect={(nodeId) => {
              selectNode(nodeId);
              // 同时取消选中连线
              setSelectedEdgeId(null);
            }}
            onNodeMove={handleNodeMoveLocal}
            onContextMenu={handleContextMenu}
          >
            {/* SVG Layer for Edges */}
            <svg
              className="absolute inset-0"
              style={{ overflow: 'visible', pointerEvents: 'none' }}
            >
              <CanvasEdgeDefs />

              {/* Render edges */}
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
                const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
                if (!sourceNode || !targetNode) return null;

                return (
                  <CanvasEdge
                    key={edge.id}
                    id={edge.id}
                    sourceNodeId={edge.sourceNodeId}
                    sourcePosition={{ x: sourceNode.positionX, y: sourceNode.positionY }}
                    sourceType={sourceNode.type}
                    targetNodeId={edge.targetNodeId}
                    targetPosition={{ x: targetNode.positionX, y: targetNode.positionY }}
                    targetType={targetNode.type}
                    isSelected={selectedEdgeId === edge.id}
                    onSelect={() => {
                      setSelectedEdgeId(edge.id);
                      selectNode(null);
                    }}
                    onDelete={() => handleEdgeDelete(edge.id)}
                  />
                );
              })}

              {/* Temp connection line during drag */}
              {tempConnectionPath && (
                <>
                  <path
                    d={tempConnectionPath}
                    fill="none"
                    stroke="rgba(0, 245, 255, 0.3)"
                    strokeWidth={6}
                    strokeLinecap="round"
                    style={{ filter: 'blur(4px)' }}
                  />
                  <path
                    d={tempConnectionPath}
                    fill="none"
                    stroke="#00f5ff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="8 4"
                  />
                  {connectionDrag.currentPosition && (
                    <circle
                      cx={connectionDrag.currentPosition.x}
                      cy={connectionDrag.currentPosition.y}
                      r={6}
                      fill="rgba(0, 245, 255, 0.3)"
                      stroke="#00f5ff"
                      strokeWidth={2}
                    />
                  )}
                </>
              )}
            </svg>


            {/* Render Nodes */}
            {nodes.filter(node => node && node.type).map((node) => {
              if (node.type === 'generator') {
                return (
                  <GeneratorNode
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    connectedInputUrls={getConnectedInputUrls(node.id)}
                    zoom={viewport.zoom}
                    onSelect={() => {
                      selectNode(node.id);
                      setSelectedEdgeId(null);
                    }}
                    onDelete={() => handleNodeDelete(node.id)}
                    onMove={(pos) => handleNodeMoveLocal(node.id, pos)}
                    onMoveEnd={(pos) => handleNodeMoveEnd(node.id, pos)}
                    onUpdate={(updates) => updateNode(node.id, updates)}
                    onGenerate={() => handleGenerate(node.id)}
                    onSave={node.imageUrl ? () => handleOpenSaveDialog(node.id, node.imageUrl!) : undefined}
                    onDuplicate={() => handleNodeDuplicate(node.id)}
                    onStartConnect={(nodeId, portType) => handleStartConnect(nodeId, portType)}
                    onEndConnect={(nodeId, portType) => handleEndConnect(nodeId, portType)}
                  />
                );
              }

              if (node.type === 'input') {
                return (
                  <InputNode
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    zoom={viewport.zoom}
                    onSelect={() => {
                      selectNode(node.id);
                      setSelectedEdgeId(null);
                    }}
                    onDelete={() => handleNodeDelete(node.id)}
                    onMove={(pos) => handleNodeMoveLocal(node.id, pos)}
                    onMoveEnd={(pos) => handleNodeMoveEnd(node.id, pos)}
                    onUpdate={(updates) => updateNode(node.id, updates)}
                    onUpload={handleUploadImage}
                    onSave={node.imageUrl ? () => handleOpenSaveDialog(node.id, node.imageUrl!) : undefined}
                    onDuplicate={() => handleNodeDuplicate(node.id)}
                    onStartConnect={(nodeId, portType) => handleStartConnect(nodeId, portType)}
                    onEndConnect={(nodeId, portType) => handleEndConnect(nodeId, portType)}
                  />
                );
              }

              return null;
            })}
          </InfiniteCanvas>
        </div>
      </div>
    </>
  );
};

export default AssetCanvasWorkspace;
