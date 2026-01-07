import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Play,
  Loader2,
  RefreshCw,
  Settings,
  Monitor,
  Clock,
  Mountain,
  Box,
  Save,
} from 'lucide-react';
import { Storyboard } from '@/types/video';

interface StoryboardConfigPanelProps {
  storyboard: Storyboard | null;
  storyboardIndex: number;
  onDescriptionChange: (description: string) => void;
  onAspectRatioChange: (ratio: '9:16' | '16:9') => void;
  onDurationChange: (duration: '10' | '15') => void;
  onGenerate: () => void;
  onSave: () => void;
  isGenerating: boolean;
  isGenerateDisabled: boolean;
}

export const StoryboardConfigPanel: React.FC<StoryboardConfigPanelProps> = ({
  storyboard,
  storyboardIndex,
  onDescriptionChange,
  onAspectRatioChange,
  onDurationChange,
  onGenerate,
  onSave,
  isGenerating,
  isGenerateDisabled,
}) => {
  const [localDescription, setLocalDescription] = useState(storyboard?.description || '');
  const [isFocused, setIsFocused] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalDescription(storyboard?.description || '');
    setHasChanges(false);
  }, [storyboard?.id, storyboard?.description]);

  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value);
    setHasChanges(value !== storyboard?.description);
  };

  const handleSave = () => {
    if (localDescription !== storyboard?.description) {
      onDescriptionChange(localDescription);
    }
    onSave();
    setHasChanges(false);
  };

  if (!storyboard) {
    return (
      <div
        className="w-72 flex-shrink-0 rounded-xl flex flex-col items-center justify-center p-6"
        style={{
          backgroundColor: 'rgba(10,10,15,0.6)',
          border: '1px solid #1e1e2e',
        }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
            border: '1px solid rgba(0,245,255,0.2)',
          }}
        >
          <Settings size={24} style={{ color: 'rgba(0,245,255,0.4)' }} />
        </div>
        <p className="text-xs text-center" style={{ color: '#6b7280' }}>
          选择分镜查看配置
        </p>
      </div>
    );
  }

  const aspectRatio = storyboard.aspectRatio || '9:16';
  const duration = storyboard.duration || '15';

  return (
    <div
      className="w-72 flex-shrink-0 rounded-xl flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'rgba(10,10,15,0.6)',
        border: '1px solid #1e1e2e',
      }}
    >
      {/* 标题 */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid #1e1e2e' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,0,255,0.15))',
              border: '1px solid rgba(0,245,255,0.3)',
            }}
          >
            <span className="text-[10px] font-bold" style={{ color: '#00f5ff' }}>
              {storyboardIndex + 1}
            </span>
          </div>
          <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>
            分镜配置
          </span>
        </div>
        {hasChanges && (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,245,255,0.1)', color: '#00f5ff' }}>
            未保存
          </span>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 cyber-scrollbar">
        {/* 脚本输入 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FileText size={12} style={{ color: '#00f5ff' }} />
            <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
              提示词脚本
            </span>
          </div>
          <textarea
            value={localDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="输入分镜提示词..."
            className="w-full rounded-lg p-2.5 text-xs leading-relaxed resize-none focus:outline-none transition-all"
            style={{
              backgroundColor: '#0a0a0f',
              border: isFocused ? '1px solid rgba(0,245,255,0.5)' : '1px solid #1e1e2e',
              color: '#d1d5db',
              boxShadow: isFocused ? '0 0 15px rgba(0,245,255,0.1)' : 'none',
              minHeight: '80px',
            }}
          />
        </div>

        {/* 角色选择 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Users size={12} style={{ color: '#bf00ff' }} />
            <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
              角色
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px]" style={{ color: '#4b5563' }}>
              暂无角色
            </span>
          </div>
        </div>

        {/* 场景选择 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Mountain size={12} style={{ color: '#ff9500' }} />
            <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
              场景
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px]" style={{ color: '#4b5563' }}>
              暂无场景
            </span>
          </div>
        </div>

        {/* 物品选择 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Box size={12} style={{ color: '#00ff9d' }} />
            <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
              物品
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px]" style={{ color: '#4b5563' }}>
              暂无物品
            </span>
          </div>
        </div>

        {/* 画面比例 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Monitor size={12} style={{ color: '#4d7cff' }} />
            <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
              画面比例
            </span>
          </div>
          <div className="flex gap-2">
            {(['9:16', '16:9'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => onAspectRatioChange(ratio)}
                className="flex-1 py-1.5 rounded text-[10px] font-medium transition-all"
                style={{
                  backgroundColor: aspectRatio === ratio ? 'rgba(77,124,255,0.15)' : '#12121a',
                  border:
                    aspectRatio === ratio
                      ? '1px solid rgba(77,124,255,0.5)'
                      : '1px solid #1e1e2e',
                  color: aspectRatio === ratio ? '#4d7cff' : '#6b7280',
                }}
              >
                {ratio === '9:16' ? '竖屏 9:16' : '横屏 16:9'}
              </button>
            ))}
          </div>
        </div>

        {/* 视频时长 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={12} style={{ color: '#ff00ff' }} />
            <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
              视频时长
            </span>
          </div>
          <div className="flex gap-2">
            {(['10', '15'] as const).map((dur) => (
              <button
                key={dur}
                onClick={() => onDurationChange(dur)}
                className="flex-1 py-1.5 rounded text-[10px] font-medium transition-all"
                style={{
                  backgroundColor: duration === dur ? 'rgba(255,0,255,0.15)' : '#12121a',
                  border:
                    duration === dur ? '1px solid rgba(255,0,255,0.5)' : '1px solid #1e1e2e',
                  color: duration === dur ? '#ff00ff' : '#6b7280',
                }}
              >
                {dur}秒
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid #1e1e2e' }}>
        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
          style={{
            backgroundColor: hasChanges ? 'rgba(0,245,255,0.15)' : '#12121a',
            border: hasChanges ? '1px solid rgba(0,245,255,0.5)' : '1px solid #1e1e2e',
            color: hasChanges ? '#00f5ff' : '#6b7280',
          }}
        >
          <Save size={12} />
          保存配置
        </button>

        {/* 生成按钮 */}
        {isGenerating ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))',
              color: '#fff',
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            {storyboard.status === 'queued'
              ? '排队中...'
              : `生成中 ${storyboard.progress || '0'}%`}
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={isGenerateDisabled || !localDescription.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
            }}
          >
            {storyboard.status === 'completed' ? (
              <>
                <RefreshCw size={14} />
                重新生成视频
              </>
            ) : (
              <>
                <Play size={14} />
                生成视频
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
