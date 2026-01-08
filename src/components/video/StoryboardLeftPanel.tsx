import React, { useState } from 'react';
import { FileText, Settings, Box, Save } from 'lucide-react';
import { Storyboard } from '@/types/video';
import { StoryboardApiPanel } from './StoryboardApiPanel';
import { StoryboardAssetsPanel } from './StoryboardAssetsPanel';

interface StoryboardLeftPanelProps {
  storyboard: Storyboard | null;
  storyboardIndex: number;
  localAspectRatio: '9:16' | '16:9';
  localDuration: '10' | '15';
  onAspectRatioChange: (ratio: '9:16' | '16:9') => void;
  onDurationChange: (duration: '10' | '15') => void;
  localDescription: string;
  onLocalDescriptionChange: (value: string) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
}

type TabType = 'script' | 'api' | 'assets';

export const StoryboardLeftPanel: React.FC<StoryboardLeftPanelProps> = ({
  storyboard,
  storyboardIndex,
  localAspectRatio,
  localDuration,
  onAspectRatioChange,
  onDurationChange,
  localDescription,
  onLocalDescriptionChange,
  onSave,
  hasUnsavedChanges,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('script');
  const [isFocused, setIsFocused] = useState(false);

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
          <FileText size={24} style={{ color: 'rgba(0,245,255,0.4)' }} />
        </div>
        <p className="text-xs text-center" style={{ color: '#6b7280' }}>
          选择分镜查看配置
        </p>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'script', label: '脚本', icon: <FileText size={12} /> },
    { key: 'api', label: 'API设置', icon: <Settings size={12} /> },
    { key: 'assets', label: '关联资产', icon: <Box size={12} /> },
  ];

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
      </div>

      {/* Tab 切换 */}
      <div
        className="flex items-center"
        style={{ borderBottom: '1px solid #1e1e2e' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-all"
            style={{
              color: activeTab === tab.key ? '#00f5ff' : '#6b7280',
              backgroundColor: activeTab === tab.key ? 'rgba(0,245,255,0.1)' : 'transparent',
              borderBottom: activeTab === tab.key ? '2px solid #00f5ff' : '2px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'script' && (
          <div className="h-full flex flex-col p-3">
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
              className="flex-1 w-full rounded-lg p-2.5 text-xs leading-relaxed resize-none focus:outline-none transition-all"
              style={{
                backgroundColor: '#0a0a0f',
                border: isFocused ? '1px solid rgba(0,245,255,0.5)' : '1px solid #1e1e2e',
                color: '#d1d5db',
                boxShadow: isFocused ? '0 0 15px rgba(0,245,255,0.1)' : 'none',
              }}
            />
          </div>
        )}
        {activeTab === 'api' && (
          <StoryboardApiPanel
            storyboard={storyboard}
            localAspectRatio={localAspectRatio}
            localDuration={localDuration}
            onAspectRatioChange={onAspectRatioChange}
            onDurationChange={onDurationChange}
          />
        )}
        {activeTab === 'assets' && (
          <StoryboardAssetsPanel storyboard={storyboard} />
        )}
      </div>

      {/* 保存按钮 */}
      {onSave && (
        <div className="p-3" style={{ borderTop: '1px solid #1e1e2e' }}>
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: hasUnsavedChanges
                ? 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,212,255,0.2))'
                : 'rgba(0,245,255,0.05)',
              color: hasUnsavedChanges ? '#00f5ff' : '#6b7280',
              border: hasUnsavedChanges ? '1px solid rgba(0,245,255,0.4)' : '1px solid rgba(0,245,255,0.1)',
              boxShadow: hasUnsavedChanges ? '0 4px 15px rgba(0,245,255,0.15)' : 'none',
            }}
          >
            <Save size={14} />
            保存配置
          </button>
        </div>
      )}
    </div>
  );
};
