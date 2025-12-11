import React from 'react';
import { SystemPrompt } from './SystemPrompt';

export const SettingsPanel: React.FC = () => {
  return (
    <aside className="w-80 border-l bg-background overflow-y-auto scrollbar-thin">
      <div className="p-6">
        {/* 系统提示词 */}
        <SystemPrompt />
      </div>
    </aside>
  );
};
