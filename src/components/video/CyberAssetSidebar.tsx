import React, { useState } from 'react';
import { LayoutGrid, Users, Mountain, Box, Layers } from 'lucide-react';
import { AssetTabType } from '@/types/video';

interface CyberAssetSidebarProps {
  activeTab: AssetTabType;
  onTabChange: (tab: AssetTabType) => void;
}

const TAB_CONFIG: { type: AssetTabType; icon: React.ElementType; label: string }[] = [
  { type: 'storyboard', icon: LayoutGrid, label: '剧集' },
  { type: 'character', icon: Users, label: '角色' },
  { type: 'scene', icon: Mountain, label: '场景' },
  { type: 'props', icon: Box, label: '道具' },
];

export const CyberAssetSidebar: React.FC<CyberAssetSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [hoveredTab, setHoveredTab] = useState<AssetTabType | null>(null);

  return (
    <div 
      className="w-14 flex-shrink-0 flex flex-col items-center py-3 gap-1 rounded-xl"
      style={{ 
        backgroundColor: 'rgba(10,10,15,0.8)',
        border: '1px solid #1e1e2e',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)'
      }}
    >
      {/* Logo/Home */}
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 cursor-pointer transition-all"
        style={{ 
          background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,0,255,0.15))',
          border: '1px solid rgba(0,245,255,0.3)',
          boxShadow: '0 0 15px rgba(0,245,255,0.2)'
        }}
      >
        <Layers size={20} style={{ color: '#00f5ff' }} />
      </div>

      {/* 分隔线 */}
      <div 
        className="w-8 h-[1px] mb-3"
        style={{ 
          background: 'linear-gradient(90deg, transparent, #1e1e2e, transparent)'
        }}
      />

      {/* Tab按钮 */}
      {TAB_CONFIG.map(({ type, icon: Icon, label }) => {
        const isActive = activeTab === type;
        const isHovered = hoveredTab === type;

        return (
          <button
            key={type}
            onClick={() => onTabChange(type)}
            onMouseEnter={() => setHoveredTab(type)}
            onMouseLeave={() => setHoveredTab(null)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group"
            style={{
              background: isActive 
                ? 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))'
                : isHovered 
                  ? 'rgba(26,26,40,0.8)' 
                  : 'transparent',
              border: isActive 
                ? '1px solid rgba(0,245,255,0.3)'
                : isHovered 
                  ? '1px solid #1e1e2e' 
                  : '1px solid transparent',
              boxShadow: isActive ? '0 0 15px rgba(0,245,255,0.2)' : 'none'
            }}
            title={label}
          >
            {/* 激活指示器 - 移除渐变边框 */}
            
            <Icon 
              size={18} 
              style={{ 
                color: isActive ? '#00f5ff' : isHovered ? '#9ca3af' : '#6b7280',
                filter: isActive ? 'drop-shadow(0 0 4px rgba(0,245,255,0.5))' : 'none'
              }}
            />

            {/* Tooltip */}
            <div 
              className="absolute left-full ml-2 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
              style={{ 
                backgroundColor: '#12121a',
                border: '1px solid #1e1e2e',
                color: '#d1d5db',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              {label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
