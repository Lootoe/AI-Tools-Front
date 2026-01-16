import React, { useState, useEffect } from 'react';
import { Save, Plus, FolderOpen, X } from 'lucide-react';
import { AssetCategory } from '@/types/canvas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export interface SaveAssetDialogProps {
  isOpen: boolean;
  imageUrl: string;
  categories: AssetCategory[];
  onSave: (categoryId: string, name?: string) => void;
  onCreateCategory: (name: string) => Promise<string>;
  onClose: () => void;
}

export const SaveAssetDialog: React.FC<SaveAssetDialogProps> = ({
  isOpen,
  imageUrl,
  categories,
  onSave,
  onCreateCategory,
  onClose,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [assetName, setAssetName] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当分类列表变化时，自动选中第一个分类
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // 重置状态当对话框打开时
  useEffect(() => {
    if (isOpen) {
      setAssetName('');
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setError(null);
      if (categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      }
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('请输入分类名称');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const newCategoryId = await onCreateCategory(newCategoryName.trim());
      setSelectedCategoryId(newCategoryId);
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } catch (err) {
      setError((err as Error).message || '创建分类失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCategoryId) {
      setError('请选择或创建一个分类');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      onSave(selectedCategoryId, assetName.trim() || undefined);
      onClose();
    } catch (err) {
      setError((err as Error).message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div
        className="rounded-xl p-6 w-full max-w-md mx-4 shadow-xl animate-scale-in"
        style={{
          backgroundColor: 'rgba(15, 15, 25, 0.95)',
          border: '1px solid rgba(60, 60, 80, 0.5)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <Save size={20} style={{ color: '#8b5cf6' }} />
            </div>
            <h3 className="text-lg font-bold text-white">保存资产</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: '#9ca3af' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 图片预览 */}
        {imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(60, 60, 80, 0.5)' }}>
            <img
              src={imageUrl}
              alt="预览"
              className="w-full h-32 object-contain"
              style={{ backgroundColor: 'rgba(20, 20, 35, 0.8)' }}
            />
          </div>
        )}

        {/* 分类选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#9ca3af' }}>
            选择分类
          </label>
          {!isCreatingCategory ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  disabled={categories.length === 0 || isSaving}
                >
                  {categories.length === 0 ? (
                    <option value="">暂无分类</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </Select>
              </div>
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="px-3 h-10 rounded-lg flex items-center gap-1 transition-all"
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#a78bfa',
                }}
                title="新建分类"
              >
                <Plus size={16} />
                <span className="text-sm">新建</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="输入分类名称"
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
              </div>
              <button
                onClick={handleCreateCategory}
                disabled={isSaving || !newCategoryName.trim()}
                className="px-3 h-11 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                }}
              >
                <FolderOpen size={16} />
                <span className="text-sm">创建</span>
              </button>
              <button
                onClick={() => {
                  setIsCreatingCategory(false);
                  setNewCategoryName('');
                }}
                className="px-3 h-11 rounded-lg transition-all"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(60, 60, 80, 0.5)',
                  color: '#9ca3af',
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* 资产名称 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#9ca3af' }}>
            资产名称（可选）
          </label>
          <Input
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="输入资产名称"
            disabled={isSaving}
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            className="mb-4 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
            }}
          >
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(60, 60, 80, 0.5)',
              color: '#9ca3af',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                e.currentTarget.style.color = '#d1d5db';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(60, 60, 80, 0.5)';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (!selectedCategoryId && !isCreatingCategory)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            }}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
