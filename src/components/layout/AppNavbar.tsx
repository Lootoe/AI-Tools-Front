import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AppNavbarProps {
  rightContent?: React.ReactNode;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ rightContent }) => {
  const navigate = useNavigate();

  return (
    <div
      className="relative z-10 h-12 flex items-center justify-between px-4"
      style={{
        borderBottom: '1px solid #1e1e2e',
        backgroundColor: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/video')}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group relative overflow-hidden"
        >
          {/* 动态光效背景 */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.1), rgba(191,0,255,0.1), transparent)',
            }}
          />
          {/* Logo图标 */}
          <div
            className="relative w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00f5ff, #bf00ff, #ff0080)',
              boxShadow: '0 0 12px rgba(0,245,255,0.5), 0 0 24px rgba(191,0,255,0.3)',
            }}
          >
            <span className="text-white text-xs font-bold" style={{ textShadow: '0 0 8px rgba(255,255,255,0.8)' }}>幻</span>
          </div>
          {/* Logo文字 */}
          <span
            className="relative font-bold text-base tracking-wide"
            style={{
              background: 'linear-gradient(90deg, #00f5ff, #bf00ff, #ff0080, #00f5ff)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-flow 3s linear infinite',
            }}
          >
            幻境AI
          </span>
        </button>

        {rightContent && (
          <>
            <div className="h-4 w-px" style={{ backgroundColor: '#1e1e2e' }} />
            {rightContent}
          </>
        )}
      </div>

      <div className="w-[100px]" />
    </div>
  );
};
