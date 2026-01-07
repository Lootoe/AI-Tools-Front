import React from 'react';
import { Users, Sparkles } from 'lucide-react';

interface CharacterWorkspaceProps {
  scriptId: string;
}

export const CharacterWorkspace: React.FC<CharacterWorkspaceProps> = ({ scriptId }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
            border: '1px solid rgba(0,245,255,0.2)',
          }}
        >
          <Users size={36} style={{ color: 'rgba(0,245,255,0.5)' }} />
        </div>
        <div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ff00ff, #bf00ff)',
            boxShadow: '0 0 10px rgba(255,0,255,0.5)',
          }}
        >
          <Sparkles size={12} className="text-white" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">角色管理</h3>
      <p className="text-sm max-w-md" style={{ color: '#6b7280' }}>
        角色管理功能开发中...
      </p>
    </div>
  );
};
