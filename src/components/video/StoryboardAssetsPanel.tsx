import React from 'react';
import { Users, Mountain, Box } from 'lucide-react';
import { Storyboard } from '@/types/video';

interface StoryboardAssetsPanelProps {
  storyboard: Storyboard | null;
}

export const StoryboardAssetsPanel: React.FC<StoryboardAssetsPanelProps> = ({
  storyboard,
}) => {
  if (!storyboard) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-center" style={{ color: '#6b7280' }}>
          选择分镜查看关联资产
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 cyber-scrollbar">
      {/* 角色选择 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users size={14} style={{ color: '#bf00ff' }} />
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            角色
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs" style={{ color: '#4b5563' }}>
            暂无角色
          </span>
        </div>
      </div>

      {/* 场景选择 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Mountain size={14} style={{ color: '#ff9500' }} />
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            场景
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs" style={{ color: '#4b5563' }}>
            暂无场景
          </span>
        </div>
      </div>

      {/* 物品选择 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Box size={14} style={{ color: '#00ff9d' }} />
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            物品
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs" style={{ color: '#4b5563' }}>
            暂无物品
          </span>
        </div>
      </div>
    </div>
  );
};
