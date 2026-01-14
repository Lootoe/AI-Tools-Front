import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, Play, Layers, AlertCircle, Pencil, X } from 'lucide-react';
import { Storyboard, StoryboardVariant } from '@/types/video';
import CoinIcon from '@/img/coin.webp';

interface StoryboardVariantPoolProps {
  storyboard: Storyboard | null;
  onSelectVariant: (variantId: string) => void;
  onDeleteVariant: (variantId: string) => void;
  onGenerate: () => void;
  onRemixVariant?: (variantId: string, taskId: string, prompt: string) => void;
}

export const StoryboardVariantPool: React.FC<StoryboardVariantPoolProps> = ({
  storyboard,
  onSelectVariant,
  onDeleteVariant,
  onGenerate,
  onRemixVariant,
}) => {
  const [isGenerateCooldown, setIsGenerateCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [remixModalVariant, setRemixModalVariant] = useState<StoryboardVariant | null>(null);
  const [remixPrompt, setRemixPrompt] = useState('');
  const [isRemixing, setIsRemixing] = useState(false);

  useEffect(() => {
    if (!isGenerateCooldown) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) { setIsGenerateCooldown(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGenerateCooldown]);

  const handleGenerate = useCallback(() => {
    if (isGenerateCooldown) return;
    onGenerate();
    setIsGenerateCooldown(true);
    setCooldownSeconds(2);
  }, [isGenerateCooldown, onGenerate]);

  const handleOpenRemixModal = useCallback((variant: StoryboardVariant) => {
    setRemixModalVariant(variant);
    setRemixPrompt('');
  }, []);

  const handleCloseRemixModal = useCallback(() => {
    setRemixModalVariant(null);
    setRemixPrompt('');
    setIsRemixing(false);
  }, []);

  const handleSubmitRemix = useCallback(async () => {
    if (!remixModalVariant || !remixModalVariant.taskId || !remixPrompt.trim() || !onRemixVariant) return;
    setIsRemixing(true);
    try {
      await onRemixVariant(remixModalVariant.id, remixModalVariant.taskId, remixPrompt.trim());
      handleCloseRemixModal();
    } catch {
      setIsRemixing(false);
    }
  }, [remixModalVariant, remixPrompt, onRemixVariant, handleCloseRemixModal]);

  if (!storyboard) {
    return (
      <div className="w-72 flex-shrink-0 rounded-xl flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}>
          <Layers size={24} style={{ color: 'rgba(0,245,255,0.4)' }} />
        </div>
        <p className="text-xs text-center" style={{ color: '#6b7280' }}>选择分镜查看分镜池</p>
      </div>
    );
  }

  const variants = storyboard.variants || [];
  const activeVariantId = storyboard.activeVariantId;
  const hasDescription = !!storyboard.description?.trim();

  return (
    <div className="w-72 flex-shrink-0 rounded-xl flex flex-col overflow-hidden"
      style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #1e1e2e' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Layers size={12} style={{ color: '#8b5cf6' }} />
          </div>
          <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>分镜池</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>{variants.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 cyber-scrollbar">
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Layers size={32} style={{ color: '#4b5563' }} className="mb-3" />
            <p className="text-xs" style={{ color: '#6b7280' }}>暂无分镜素材</p>
            <p className="text-[10px] mt-1" style={{ color: '#4b5563' }}>点击下方按钮生成</p>
          </div>
        ) : (
          variants.map((variant, index) => (
            <VariantCard key={variant.id} variant={variant} index={index} isActive={variant.id === activeVariantId}
              onSelect={() => onSelectVariant(variant.id)} onDelete={() => onDeleteVariant(variant.id)} onRemix={() => handleOpenRemixModal(variant)} />
          ))
        )}
      </div>

      <div className="p-3" style={{ borderTop: '1px solid #1e1e2e' }}>
        <button onClick={handleGenerate} disabled={!hasDescription || isGenerateCooldown}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${hasDescription && !isGenerateCooldown ? 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]' : ''}`}
          style={{ background: hasDescription && !isGenerateCooldown ? 'linear-gradient(135deg, #00f5ff, #00d4ff)' : 'rgba(0,245,255,0.1)', color: hasDescription && !isGenerateCooldown ? '#0a0a0f' : '#6b7280', boxShadow: hasDescription && !isGenerateCooldown ? '0 4px 15px rgba(0,245,255,0.3)' : 'none' }}>
          <Plus size={14} />
          {isGenerateCooldown ? `请等待 ${cooldownSeconds}s` : <>生成分镜（<img src={CoinIcon} alt="代币" className="w-4 h-4 inline" />消耗：3）</>}
        </button>
        {!hasDescription && <p className="text-[10px] text-center mt-2" style={{ color: '#ef4444' }}>请先填写分镜脚本</p>}
      </div>

      {/* Remix 编辑弹框 */}
      {remixModalVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={handleCloseRemixModal}>
          <div className="w-[400px] rounded-xl p-5" style={{ backgroundColor: '#12121a', border: '1px solid #2e2e3e', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <Pencil size={14} style={{ color: '#8b5cf6' }} />
                </div>
                <span className="text-sm font-medium text-white">编辑分镜视频</span>
              </div>
              <button onClick={handleCloseRemixModal} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10" style={{ color: '#6b7280' }}>
                <X size={16} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-xs mb-2" style={{ color: '#9ca3af' }}>编辑脚本</label>
              <textarea value={remixPrompt} onChange={(e) => setRemixPrompt(e.target.value)} placeholder="输入你想要修改的内容，例如：让角色转向镜头微笑..."
                className="w-full h-28 px-3 py-2 rounded-lg text-sm resize-none focus:outline-none" style={{ backgroundColor: '#0a0a0f', border: '1px solid #2e2e3e', color: '#e5e7eb' }} />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <img src={CoinIcon} alt="代币" className="w-4 h-4" />
              <span className="text-xs" style={{ color: '#a78bfa' }}>编辑将消耗 3 代币，生成一个新素材</span>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCloseRemixModal} className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid #2e2e3e' }}>取消</button>
              <button onClick={handleSubmitRemix} disabled={!remixPrompt.trim() || isRemixing}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
                {isRemixing ? <span className="flex items-center justify-center gap-2"><Loader2 size={12} className="animate-spin" />提交中...</span> : '提交编辑'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


interface VariantCardProps {
  variant: StoryboardVariant;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRemix: () => void;
}

// 格式化时间显示
const formatTime = (dateStr?: string) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}:${s}`;
};

const VariantCard: React.FC<VariantCardProps> = ({ variant, index, isActive, onSelect, onDelete, onRemix }) => {
  const isGenerating = variant.status === 'generating' || variant.status === 'queued';
  const isCompleted = variant.status === 'completed';
  const isFailed = variant.status === 'failed';
  const canRemix = isCompleted && !!variant.taskId;

  return (
    <div className="relative rounded-lg overflow-hidden cursor-pointer transition-all group"
      style={{ backgroundColor: isActive ? 'rgba(139,92,246,0.15)' : '#12121a', border: isActive ? '1px solid rgba(139,92,246,0.5)' : '1px solid #1e1e2e' }}
      onClick={onSelect}>
      <div className="flex items-center gap-2 p-2">
        <div className="w-20 h-14 rounded flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e1e2e' }}>
          {variant.thumbnailUrl ? (
            <img src={variant.thumbnailUrl} alt={`素材 ${index + 1}`} className="w-full h-full object-cover" />
          ) : variant.videoUrl ? (
            <video src={`${variant.videoUrl}#t=0.1`} className="w-full h-full object-cover pointer-events-none" preload="metadata" muted disablePictureInPicture controlsList="nodownload nofullscreen noremoteplayback" />
          ) : isGenerating ? (
            <Loader2 size={14} className="animate-spin" style={{ color: '#8b5cf6' }} />
          ) : isFailed ? (
            <AlertCircle size={14} style={{ color: '#ef4444' }} />
          ) : (
            <Play size={14} style={{ color: '#4b5563' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>素材 {index + 1}</span>
            {isActive && <span className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,245,255,0.15)', color: '#00f5ff' }}>当前</span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {isGenerating && <span className="text-[10px]" style={{ color: '#8b5cf6' }}>{variant.status === 'queued' ? '排队中' : `${variant.progress || 0}%`}</span>}
            {isCompleted && <span className="text-[10px]" style={{ color: '#10b981' }}>已完成</span>}
            {isFailed && (
              <span className="text-[10px] truncate max-w-[140px]" style={{ color: '#ef4444' }} title={variant.failReason || '生成失败'}>
                {variant.failReason || '生成失败'}
              </span>
            )}
            {variant.status === 'pending' && <span className="text-[10px]" style={{ color: '#6b7280' }}>待生成</span>}
          </div>
          {/* 时间信息 */}
          {variant.startedAt && (
            <div className="text-[9px] mt-0.5 whitespace-nowrap" style={{ color: '#6b7280' }}>
              开始: {formatTime(variant.startedAt)}
            </div>
          )}
          {variant.finishedAt && (
            <div className="text-[9px] whitespace-nowrap" style={{ color: '#6b7280' }}>
              {isCompleted ? '完成' : '失败'}: {formatTime(variant.finishedAt)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canRemix && (
            <button onClick={(e) => { e.stopPropagation(); onRemix(); }} className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-purple-500/20" style={{ color: '#8b5cf6' }} title="编辑视频">
              <Pencil size={12} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-red-500/20" style={{ color: '#6b7280' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {/* ID 单独一行 */}
      {variant.taskId && (
        <div className="px-2 pb-2 text-[9px] truncate" style={{ color: '#4b5563' }} title={variant.taskId}>
          ID: {variant.taskId}
        </div>
      )}
      {isGenerating && (
        <div className="h-0.5" style={{ backgroundColor: 'rgba(139,92,246,0.2)' }}>
          <div className="h-full transition-all" style={{ width: `${variant.progress || 0}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        </div>
      )}
    </div>
  );
};
