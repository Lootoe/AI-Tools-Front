import { useNavigate } from 'react-router-dom';
import { useVideoStore } from '@/stores/videoStore';
import { useEffect, useState } from 'react';
import { Plus, Loader2, Sparkles, Film, Trash2, X, CheckSquare } from 'lucide-react';
import { ScriptCard } from '@/components/video/ScriptCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AppNavbar } from '@/components/layout/AppNavbar';

export const ScriptListPage = () => {
  const navigate = useNavigate();
  const { scripts, loadScripts, createScript, deleteScript, deleteScripts, renameScript, isLoading } = useVideoStore();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const handleCreateScript = async () => {
    await createScript();
  };

  const handleScriptClick = (scriptId: string) => {
    navigate(`/video/script/${scriptId}`);
  };

  const handleDeleteScript = async (scriptId: string) => {
    await deleteScript(scriptId);
  };

  const handleRenameScript = async (scriptId: string, newTitle: string) => {
    await renameScript(scriptId, newTitle);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const handleSelect = (scriptId: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(scriptId);
      } else {
        next.delete(scriptId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === scripts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(scripts.map(s => s.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size > 0) {
      await deleteScripts(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectionMode(false);
    }
    setShowBatchDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex items-center gap-3" style={{ color: '#00f5ff' }}>
          <Loader2 className="animate-spin" size={24} />
          <span className="text-lg font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 顶部导航栏 */}
      <AppNavbar />

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* 标题和操作区 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-white">我的剧本</h1>
              {scripts.length > 0 && (
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  共 {scripts.length} 个剧本
                </span>
              )}
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>创作属于你的AI漫剧故事</p>
          </div>

          {/* 操作按钮区 */}
          {scripts.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <button
                data-testid="create-script-button"
                onClick={handleCreateScript}
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
                }}
              >
                <Plus size={18} className="text-white group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-semibold text-white">新建剧本</span>
              </button>

              {selectionMode ? (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff'
                    }}
                  >
                    <CheckSquare size={16} />
                    <span className="text-sm">{selectedIds.size === scripts.length ? '取消全选' : '全选'}</span>
                  </button>
                  <button
                    onClick={() => selectedIds.size > 0 && setShowBatchDeleteConfirm(true)}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: selectedIds.size > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: selectedIds.size > 0 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                      color: selectedIds.size > 0 ? '#ef4444' : 'rgba(255,255,255,0.3)',
                      cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <Trash2 size={16} />
                    <span className="text-sm">删除 ({selectedIds.size})</span>
                  </button>
                  <button
                    onClick={handleToggleSelectionMode}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff'
                    }}
                  >
                    <X size={16} />
                    <span className="text-sm">取消</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleSelectionMode}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all hover:bg-[rgba(255,255,255,0.15)]"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff'
                  }}
                >
                  <Trash2 size={16} />
                  <span className="text-sm">批量删除</span>
                </button>
              )}
            </div>
          )}

          {scripts.length === 0 ? (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-8">
                <div 
                  className="absolute inset-0 w-32 h-32 rounded-2xl blur-xl"
                  style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(191,0,255,0.2))' }}
                />
                <div 
                  className="relative w-32 h-32 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e' }}
                >
                  <Film size={48} style={{ color: 'rgba(0,245,255,0.5)' }} />
                  <div 
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(135deg, #ff00ff, #bf00ff)',
                      boxShadow: '0 0 15px rgba(255,0,255,0.5)'
                    }}
                  >
                    <Plus size={16} className="text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                开始你的创作之旅
              </h3>
              <p style={{ color: '#6b7280' }} className="mb-6 text-center max-w-md">
                点击下方按钮创建你的第一个剧本，用AI的力量将你的故事变成精彩的漫剧
              </p>
              <button
                onClick={handleCreateScript}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
                }}
              >
                <Sparkles size={16} className="text-white" />
                <span className="text-white font-medium">立即创建</span>
              </button>
            </div>
          ) : (
            /* 剧本网格 */
            <div 
              data-testid="script-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {scripts.map((script) => (
                <ScriptCard
                  key={script.id}
                  script={script}
                  onClick={handleScriptClick}
                  onDelete={handleDeleteScript}
                  onRename={handleRenameScript}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(script.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 批量删除确认弹窗 */}
      <ConfirmDialog
        isOpen={showBatchDeleteConfirm}
        title="批量删除剧本"
        message={`确定要删除选中的 ${selectedIds.size} 个剧本吗？此操作不可撤销。`}
        type="danger"
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleBatchDelete}
        onCancel={() => setShowBatchDeleteConfirm(false)}
      />
    </div>
  );
};
