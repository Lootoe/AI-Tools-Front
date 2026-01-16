import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, X, Calendar, Link2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { SavedAsset } from '@/types/canvas';

export interface AssetGridProps {
  scriptId: string;
  categoryId: string;
}

// 资产卡片组件
const AssetCard: React.FC<{
  asset: SavedAsset;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ asset, onSelect, onDelete }) => {
  return (
    <div
      onClick={onSelect}
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: 'rgba(18,18,26,0.9)',
        border: '1px solid rgba(30,30,46,0.8)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* 图片区域 */}
      <div
        className="aspect-square relative overflow-hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        {asset.thumbnailUrl || asset.imageUrl ? (
          <img
            src={asset.thumbnailUrl || asset.imageUrl}
            alt={asset.name || '资产'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={24} style={{ color: 'rgba(107,114,128,0.4)' }} />
          </div>
        )}

        {/* 删除按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}
        >
          <Trash2 size={10} className="text-white" />
        </button>
      </div>

      {/* 名称区域 */}
      <div className="px-2 py-1.5 text-center">
        <span
          className="text-[10px] font-medium truncate block"
          style={{ color: '#d1d5db' }}
        >
          {asset.name || '未命名'}
        </span>
      </div>
    </div>
  );
};

// 资产详情弹窗组件
const AssetDetailModal: React.FC<{
  asset: SavedAsset | null;
  onClose: () => void;
  onDelete: () => void;
}> = ({ asset, onClose, onDelete }) => {
  if (!asset) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-[600px] max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'rgba(18,18,26,0.98)',
          border: '1px solid rgba(0,245,255,0.3)',
          boxShadow: '0 0 40px rgba(0,245,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid #1e1e2e' }}
        >
          <div className="flex items-center gap-2">
            <ImageIcon size={16} style={{ color: '#00f5ff' }} />
            <span className="text-sm font-medium text-white">
              {asset.name || '资产详情'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 图片预览 */}
          <div
            className="rounded-lg overflow-hidden mb-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <img
              src={asset.imageUrl}
              alt={asset.name || '资产'}
              className="w-full max-h-[400px] object-contain"
            />
          </div>

          {/* 详情信息 */}
          <div className="space-y-3">
            {/* 名称 */}
            {asset.name && (
              <div className="flex items-start gap-3">
                <span
                  className="text-xs flex-shrink-0 w-20"
                  style={{ color: '#6b7280' }}
                >
                  名称
                </span>
                <span className="text-sm text-white">{asset.name}</span>
              </div>
            )}

            {/* 创建时间 */}
            <div className="flex items-start gap-3">
              <span
                className="text-xs flex-shrink-0 w-20 flex items-center gap-1"
                style={{ color: '#6b7280' }}
              >
                <Calendar size={12} />
                创建时间
              </span>
              <span className="text-sm text-white">
                {formatDate(asset.createdAt)}
              </span>
            </div>

            {/* 源节点 */}
            {asset.sourceNodeId && (
              <div className="flex items-start gap-3">
                <span
                  className="text-xs flex-shrink-0 w-20 flex items-center gap-1"
                  style={{ color: '#6b7280' }}
                >
                  <Link2 size={12} />
                  源节点
                </span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(107,114,128,0.1)',
                    color: '#9ca3af',
                  }}
                >
                  {asset.sourceNodeId}
                </span>
              </div>
            )}

            {/* 图片 URL */}
            <div className="flex items-start gap-3">
              <span
                className="text-xs flex-shrink-0 w-20"
                style={{ color: '#6b7280' }}
              >
                图片地址
              </span>
              <a
                href={asset.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs break-all hover:underline"
                style={{ color: '#00f5ff' }}
              >
                {asset.imageUrl}
              </a>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div
          className="px-4 py-3 flex items-center justify-end gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid #1e1e2e' }}
        >
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:brightness-110"
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
            }}
          >
            <Trash2 size={12} />
            删除资产
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs"
            style={{
              backgroundColor: 'rgba(107,114,128,0.1)',
              border: '1px solid rgba(107,114,128,0.3)',
              color: '#9ca3af',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export const AssetGrid: React.FC<AssetGridProps> = ({ categoryId }) => {
  const { assets, isLoading, loadAssets, deleteAsset } = useRepositoryStore();
  const { showToast, ToastContainer } = useToast();

  // 本地状态
  const [selectedAsset, setSelectedAsset] = useState<SavedAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    assetId: string | null;
    assetName: string;
  }>({ isOpen: false, assetId: null, assetName: '' });

  // 加载资产列表
  useEffect(() => {
    if (categoryId) {
      loadAssets(categoryId);
    }
  }, [categoryId, loadAssets]);

  // 删除资产确认
  const handleDeleteClick = (asset: SavedAsset) => {
    setDeleteConfirm({
      isOpen: true,
      assetId: asset.id,
      assetName: asset.name || '未命名资产',
    });
  };

  // 确认删除资产
  const handleConfirmDelete = async () => {
    if (deleteConfirm.assetId) {
      try {
        await deleteAsset(deleteConfirm.assetId);
        showToast('资产已删除', 'success');
        // 如果删除的是当前选中的资产，关闭详情弹窗
        if (selectedAsset?.id === deleteConfirm.assetId) {
          setSelectedAsset(null);
        }
      } catch (error) {
        showToast('删除资产失败', 'error');
      }
    }
    setDeleteConfirm({ isOpen: false, assetId: null, assetName: '' });
  };

  // 从详情弹窗删除
  const handleDeleteFromDetail = () => {
    if (selectedAsset) {
      handleDeleteClick(selectedAsset);
    }
  };

  return (
    <>
      <ToastContainer />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="删除资产"
        message={`确定要删除资产「${deleteConfirm.assetName}」吗？此操作不可撤销。`}
        type="danger"
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, assetId: null, assetName: '' })
        }
      />

      {/* 资产详情弹窗 */}
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onDelete={handleDeleteFromDetail}
      />

      {/* 资产网格 */}
      <div className="h-full overflow-y-auto p-3 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <InlineLoading size={24} color="#00f5ff" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon size={48} style={{ color: 'rgba(107,114,128,0.3)' }} />
            <p className="mt-3 text-sm" style={{ color: '#6b7280' }}>
              该分类下暂无资产
            </p>
            <p className="text-xs" style={{ color: '#4b5563' }}>
              在画布中生成图片后可保存到此分类
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onSelect={() => setSelectedAsset(asset)}
                onDelete={() => handleDeleteClick(asset)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
