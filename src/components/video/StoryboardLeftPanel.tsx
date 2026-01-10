import React, { useState, useRef } from 'react';
import { FileText, Settings, Save, Image, Upload, X, Loader2 } from 'lucide-react';
import { Storyboard } from '@/types/video';
import { StoryboardApiPanel } from './StoryboardApiPanel';
import { uploadImage } from '@/services/api';

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
  // 首帧相关
  localFirstFrameUrl: string;
  onFirstFrameUrlChange: (url: string) => void;
}

type TabType = 'script' | 'firstFrame' | 'api';

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
  localFirstFrameUrl,
  onFirstFrameUrlChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('script');
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    { key: 'firstFrame', label: '首帧', icon: <Image size={12} /> },
    { key: 'api', label: 'API设置', icon: <Settings size={12} /> },
  ];

  // 首帧图片上传处理
  const handleFirstFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;

    setIsUploading(true);
    try {
      const response = await uploadImage(file);
      if (response.success && response.url) {
        onFirstFrameUrlChange(response.url);
      }
    } catch (error) {
      console.error('首帧图片上传失败:', error);
    } finally {
      setIsUploading(false);
      // 清空 input 以便重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除首帧图片
  const handleRemoveFirstFrame = () => {
    onFirstFrameUrlChange('');
  };

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
              className="flex-1 w-full rounded-lg p-2.5 text-xs leading-relaxed resize-none focus:outline-none transition-all scrollbar-hide"
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
        {activeTab === 'firstFrame' && (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
              <Image size={12} style={{ color: '#ff9500' }} />
              <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
                视频首帧
              </span>
            </div>
            <p className="text-[10px] mb-3" style={{ color: '#6b7280' }}>
              上传一张图片作为视频的首帧，生成的视频将以此图片开始
            </p>

            {localFirstFrameUrl ? (
              <div className="relative group">
                <img
                  src={localFirstFrameUrl}
                  alt="首帧图片"
                  className="w-full rounded-lg object-cover"
                  style={{
                    border: '1px solid #1e1e2e',
                    maxHeight: '200px',
                  }}
                />
                <button
                  onClick={handleRemoveFirstFrame}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.9)',
                    color: '#fff',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label
                className={`flex-1 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all ${isUploading ? 'pointer-events-none' : 'hover:border-opacity-50'}`}
                style={{
                  backgroundColor: '#0a0a0f',
                  border: '2px dashed rgba(255,149,0,0.3)',
                  minHeight: '120px',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFirstFrameUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <>
                    <Loader2 size={24} className="animate-spin mb-2" style={{ color: '#ff9500' }} />
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>
                      上传中...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="mb-2" style={{ color: 'rgba(255,149,0,0.5)' }} />
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>
                      点击上传首帧图片
                    </span>
                    <span className="text-[10px] mt-1" style={{ color: '#4b5563' }}>
                      支持 JPG、PNG 格式
                    </span>
                  </>
                )}
              </label>
            )}
          </div>
        )}
      </div>

      {/* 保存按钮 */}
      {onSave && (
        <div className="p-3" style={{ borderTop: '1px solid #1e1e2e' }}>
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${hasUnsavedChanges ? 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]' : ''}`}
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
