import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: number;
  text?: string;
  color?: string;
  fullscreen?: boolean;
  overlay?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 24,
  text,
  color = '#bf00ff',
  fullscreen = false,
  overlay = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="rounded-2xl flex items-center justify-center"
        style={{
          width: size * 2.5,
          height: size * 2.5,
          background: `linear-gradient(135deg, ${color}15, ${color}25)`,
          border: `1px solid ${color}30`,
        }}
      >
        <Loader2 size={size} className="animate-spin" style={{ color }} />
      </div>
      {text && (
        <p className="text-sm" style={{ color: '#d1d5db' }}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

// 简单的行内Loading
interface InlineLoadingProps {
  size?: number;
  color?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ size = 16, color = '#00f5ff' }) => (
  <Loader2 size={size} className="animate-spin" style={{ color }} />
);
