import React from 'react';
import { ModelSelector } from './ModelSelector';
import { ParameterControls } from './ParameterControls';

export const SettingsPanel: React.FC = () => {
  return (
    <aside className="w-80 border-l bg-background overflow-y-auto scrollbar-thin">
      <div className="p-6 space-y-8">
        <ModelSelector />
        <div className="border-t pt-6">
          <ParameterControls />
        </div>
      </div>
    </aside>
  );
};
