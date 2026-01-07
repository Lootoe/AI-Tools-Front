import React, { useState } from 'react';
import { Settings, Box } from 'lucide-react';
import { Storyboard } from '@/types/video';
import { StoryboardApiPanel } from './StoryboardApiPanel';
import { StoryboardAssetsPanel } from './StoryboardAssetsPanel';

interface StoryboardRightPanelProps {
  storyboard: Storyboard | null;
  onAspectRatioChange: (ratio: '9:16' | '16:9') => void;
  onDurationChange: (duration: '10' | '15') => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isGenerateDisabled: boolean;
}

type TabType = 'api' | 'assets';

export const StoryboardRightPanel: React.FC<StoryboardRightPanelProps> = ({
  storyboard,
  onAspectRatioChange,
  onDurationChange,
  onGenerate,
  isGenerating,
  isGenerateDisabled,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('api');

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
          选择分镜查看设置
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-72 flex-shrink-0 rounded-xl flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'rgba(10,10,15,0.6)',
        border: '1px solid #1e1e2e',
      }}
    >
      {/* Tab 切换 */}
      <div
        className="flex items-center"
        style={{ borderBottom: '1px solid #1e1e2e' }}
      >
        <button
          onClick={() => setActiveTab('api')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all"
          style={{
            color: activeTab === 'api' ? '#00f5ff' : '#6b7280',
            backgroundColor: activeTab === 'api' ? 'rgba(0,245,255,0.1)' : 'transparent',
            borderBottom: activeTab === 'api' ? '2px solid #00f5ff' : '2px solid transparent',
          }}
        >
          <Settings size={12} />
          API设置
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all"
          style={{
            color: activeTab === 'assets' ? '#00f5ff' : '#6b7280',
            backgroundColor: activeTab === 'assets' ? 'rgba(0,245,255,0.1)' : 'transparent',
            borderBottom: activeTab === 'assets' ? '2px solid #00f5ff' : '2px solid transparent',
          }}
        >
          <Box size={12} />
          关联资产
        </button>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'api' ? (
        <StoryboardApiPanel
          storyboard={storyboard}
          onAspectRatioChange={onAspectRatioChange}
          onDurationChange={onDurationChange}
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          isGenerateDisabled={isGenerateDisabled}
        />
      ) : (
        <StoryboardAssetsPanel storyboard={storyboard} />
      )}
    </div>
  );
};
