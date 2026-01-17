import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, Package } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { AssetCategory } from '@/types/canvas';
import { AssetGrid } from '@/components/canvas/AssetGrid';

interface AssetRepositoryWorkspaceProps {
  scriptId: string;
}

// 分类列表项组件
const CategoryItem: React.FC<{
  category: AssetCategory;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ category, isSelected, onSelect, onDelete }) => {
  return (
    <div
      className="group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all"
      style={{
        backgroundColor: isSelected ? 'rgba(0,245,255,0.1)' : 'transparent',
        border: '1px solid',
        borderColor: isSelected ? 'rgba(0,245,255,0.3)' : 'transparent',
      }}
      onClick={onSelect}
    >
      {/* 文件夹图标 */}
      <FolderOpen
        size={16}
        style={{ color: isSelected ? '#00f5ff' : '#6b7280' }}
      />

      {/* 分类名称 */}
      <span
        className="flex-1 text-sm truncate"
        style={{ color: isSelected ? '#00f5ff' : '#d1d5db' }}
      >
        {category.name}
      </span>

      {/* 默认标记 */}
      {category.isDefault && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'rgba(0,245,255,0.1)',
            color: '#00f5ff',
          }}
        >
          默认
        </span>
      )}

      {/* 删除按钮 */}
      {!category.isDefault && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
        >
          <Trash2 size={12} style={{ color: '#ef4444' }} />
        </button>
      )}
    </div>
  );
};

export const AssetRepositoryWorkspace: React.FC<AssetRepositoryWorkspaceProps> = ({
  scriptId,
}) => {
  const {
    categories,
    selectedCategoryId,
    assets,
    isLoading,
    loadCategories,
    createCategory,
    deleteCategory,
    selectCategory,
  } = useRepositoryStore();

  const { showToast, ToastContainer } = useToast();

  // 本地状态
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryName: string;
  }>({ isOpen: false, categoryId: null, categoryName: '' });

  // 加载分类列表
  useEffect(() => {
    if (scriptId) {
      loadCategories(scriptId);
    }
  }, [scriptId, loadCategories]);

  // 创建新分类
  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      showToast('请输入分类名称', 'warning');
      return;
    }

    try {
      await createCategory(trimmedName);
      setNewCategoryName('');
      setIsCreatingCategory(false);
      showToast('分类创建成功', 'success');
    } catch (error) {
      showToast('创建分类失败', 'error');
    }
  };

  // 删除分类确认
  const handleDeleteClick = (category: AssetCategory) => {
    setDeleteConfirm({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  // 确认删除分类
  const handleConfirmDelete = async () => {
    if (deleteConfirm.categoryId) {
      try {
        await deleteCategory(deleteConfirm.categoryId);
        showToast('分类已删除', 'success');
      } catch (error) {
        showToast('删除分类失败', 'error');
      }
    }
    setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '' });
  };

  // 选中的分类
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <>
      <ToastContainer />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="删除分类"
        message={`确定要删除分类「${deleteConfirm.categoryName}」吗？该分类下的所有资产也将被删除。`}
        type="danger"
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '' })
        }
      />

      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* 左侧：分类列表 */}
        <div
          className="w-[240px] flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(10,10,15,0.6)',
            border: '1px solid #1e1e2e',
          }}
        >
          {/* 标题栏 */}
          <div
            className="px-3 py-2.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid #1e1e2e' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,0,255,0.15))',
                  border: '1px solid rgba(0,245,255,0.3)',
                }}
              >
                <Package size={12} style={{ color: '#00f5ff' }} />
              </div>
              <span className="text-xs font-medium text-white">资产仓库</span>
            </div>
            <button
              onClick={() => setIsCreatingCategory(true)}
              className="p-1.5 rounded-lg transition-all hover:bg-white/5"
              style={{
                border: '1px solid rgba(0,245,255,0.2)',
              }}
              title="新建分类"
            >
              <Plus size={14} style={{ color: '#00f5ff' }} />
            </button>
          </div>

          {/* 新建分类输入框 */}
          {isCreatingCategory && (
            <div
              className="px-3 py-2 flex items-center gap-2"
              style={{ borderBottom: '1px solid #1e1e2e' }}
            >
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="输入分类名称"
                className="flex-1 h-8 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCategory();
                  } else if (e.key === 'Escape') {
                    setIsCreatingCategory(false);
                    setNewCategoryName('');
                  }
                }}
              />
              <button
                onClick={handleCreateCategory}
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'rgba(0,245,255,0.1)',
                  border: '1px solid rgba(0,245,255,0.3)',
                  color: '#00f5ff',
                }}
              >
                确定
              </button>
              <button
                onClick={() => {
                  setIsCreatingCategory(false);
                  setNewCategoryName('');
                }}
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'rgba(107,114,128,0.1)',
                  border: '1px solid rgba(107,114,128,0.3)',
                  color: '#9ca3af',
                }}
              >
                取消
              </button>
            </div>
          )}

          {/* 分类列表 */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {isLoading && categories.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <InlineLoading size={18} color="#00f5ff" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen
                  size={32}
                  style={{ color: 'rgba(107,114,128,0.4)' }}
                />
                <p
                  className="mt-2 text-xs"
                  style={{ color: '#6b7280' }}
                >
                  暂无分类
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: '#4b5563' }}
                >
                  点击上方按钮创建分类
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {categories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    isSelected={selectedCategoryId === category.id}
                    onSelect={() => selectCategory(category.id)}
                    onDelete={() => handleDeleteClick(category)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：资产网格 */}
        <div
          className="flex-1 flex flex-col rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(10,10,15,0.6)',
            border: '1px solid #1e1e2e',
          }}
        >
          {/* 标题栏 */}
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid #1e1e2e' }}
          >
            <div className="flex items-center gap-2">
              <FolderOpen size={14} style={{ color: '#00f5ff' }} />
              <span className="text-sm font-medium text-white">
                {selectedCategory?.name || '选择分类'}
              </span>
              {selectedCategory && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(107,114,128,0.1)',
                    color: '#6b7280',
                  }}
                >
                  {assets.length} 个资产
                </span>
              )}
            </div>
          </div>

          {/* 资产网格区域 */}
          <div className="flex-1 overflow-hidden">
            {selectedCategoryId ? (
              <AssetGrid
                scriptId={scriptId}
                categoryId={selectedCategoryId}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center h-full">
                <Package
                  size={48}
                  style={{ color: 'rgba(107,114,128,0.3)' }}
                />
                <p
                  className="mt-3 text-sm"
                  style={{ color: '#6b7280' }}
                >
                  请选择一个分类查看资产
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
