import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Storyboard } from '@/types/video';

interface StoryboardScriptPanelProps {
  storyboard: Storyboard | null;
  storyboardIndex: number;
  onDescriptionChange: (description: string) => void;
  onHasChangesChange?: (hasChanges: boolean) => void;
  localDescription: string;
  onLocalDescriptionChange: (value: string) => void;
}

export const StoryboardScriptPanel: React.FC<StoryboardScriptPanelProps> = ({
  storyboard,
  storyboardIndex,
  localDescription,
  onLocalDescriptionChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  if (!storyboard) {
    return (
      <div
        className="w-64 flex-shrink-0 rounded-xl flex flex-col items-center justify-center p-6"
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
          <FileText size={24} style={{ color: 'rgba(0,245,255,0.4)' }} />
        </div>
        <p className="text-xs text-center" style={{ color: '#6b7280' }}>
          选择分镜查看脚本
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-64 flex-shrink-0 rounded-xl flex flex-col overflow-hidden"
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
            分镜脚本
          </span>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col p-3 min-h-0">
        <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
          <FileText size={12} style={{ color: '#00f5ff' }} />
          <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
            提示词脚本
          </span>
        </div>
        <textarea
          value={localDescription}
          onChange={(e) => onLocalDescriptionChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="输入分镜提示词..."
          className="flex-1 w-full rounded-lg p-2.5 text-xs leading-relaxed resize-none focus:outline-none transition-all min-h-0"
          style={{
            backgroundColor: '#0a0a0f',
            border: isFocused ? '1px solid rgba(0,245,255,0.5)' : '1px solid #1e1e2e',
            color: '#d1d5db',
            boxShadow: isFocused ? '0 0 15px rgba(0,245,255,0.1)' : 'none',
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
};
