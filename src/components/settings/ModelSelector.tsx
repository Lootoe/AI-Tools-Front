import React from 'react';
import { useModelStore } from '@/stores/modelStore';
import { AVAILABLE_MODELS } from '@/types/models';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export const ModelSelector: React.FC = () => {
  const { currentModel, setModel } = useModelStore();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">选择模型</h3>
      <div className="space-y-2">
        {AVAILABLE_MODELS.map((model) => (
          <div
            key={model.id}
            className={cn(
              'p-3 rounded-md border cursor-pointer transition-all',
              currentModel.id === model.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => setModel(model)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium">{model.name}</h4>
                {model.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {model.description}
                  </p>
                )}
              </div>
              {currentModel.id === model.id && (
                <div className="w-2 h-2 rounded-full bg-primary ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
