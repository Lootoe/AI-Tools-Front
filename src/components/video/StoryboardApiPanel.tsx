import React from 'react';
import { Monitor, Clock } from 'lucide-react';
import { Storyboard } from '@/types/video';

interface StoryboardApiPanelProps {
  storyboard: Storyboard | null;
  localAspectRatio: '9:16' | '16:9';
  localDuration: '10' | '15';
  onAspectRatioChange: (ratio: '9:16' | '16:9') => void;
  onDurationChange: (duration: '10' | '15') => void;
}

export const StoryboardApiPanel: React.FC<StoryboardApiPanelProps> = ({
  storyboard,
  localAspectRatio,
  localDuration,
  onAspectRatioChange,
  onDurationChange,
}) => {
  if (!storyboard) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-center" style={{ color: '#6b7280' }}>
          选择分镜查看API设置
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 cyber-scrollbar">
      {/* 画面比例 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Monitor size={14} style={{ color: '#4d7cff' }} />
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            画面比例
          </span>
        </div>
        <div className="flex gap-2">
          {(['9:16', '16:9'] as const).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onAspectRatioChange(ratio)}
              className="flex-1 py-2 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: localAspectRatio === ratio ? 'rgba(77,124,255,0.15)' : '#12121a',
                border:
                  localAspectRatio === ratio
                    ? '1px solid rgba(77,124,255,0.5)'
                    : '1px solid #1e1e2e',
                color: localAspectRatio === ratio ? '#4d7cff' : '#6b7280',
              }}
            >
              {ratio === '9:16' ? '竖屏 9:16' : '横屏 16:9'}
            </button>
          ))}
        </div>
      </div>

      {/* 视频时长 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} style={{ color: '#ff00ff' }} />
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            视频时长
          </span>
        </div>
        <div className="flex gap-2">
          {(['10', '15'] as const).map((dur) => (
            <button
              key={dur}
              onClick={() => onDurationChange(dur)}
              className="flex-1 py-2 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: localDuration === dur ? 'rgba(255,0,255,0.15)' : '#12121a',
                border:
                  localDuration === dur ? '1px solid rgba(255,0,255,0.5)' : '1px solid #1e1e2e',
                color: localDuration === dur ? '#ff00ff' : '#6b7280',
              }}
            >
              {dur}秒
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
