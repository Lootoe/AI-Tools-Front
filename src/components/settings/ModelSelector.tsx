import React, { useEffect } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { cn } from '@/utils/cn';
import { Check, Sparkles, Loader2 } from 'lucide-react';

export const ModelSelector: React.FC = () => {
  const { models, currentModel, setModel, loading, error, loadModels } = useModelStore();

  useEffect(() => {
    if (models.length === 0) {
      loadModels();
    }
  }, [models.length, loadModels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
        <button onClick={loadModels} className="ml-2 text-purple-500 hover:underline">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        选择模型
      </h3>
      <div className="space-y-2">
        {models.map((model) => (
          <div
            key={model.id}
            className={cn(
              'p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2',
              currentModel?.id === model.id
                ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-purple-300 dark:border-purple-700 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-md'
            )}
            onClick={() => setModel(model)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  currentModel?.id === model.id 
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/25" 
                    : "bg-gray-200 dark:bg-gray-700"
                )}>
                  <Sparkles size={16} className={currentModel?.id === model.id ? "text-white" : "text-gray-500 dark:text-gray-400"} />
                </div>
                <div className="flex-1">
                  <h4 className={cn(
                    "text-sm font-medium",
                    currentModel?.id === model.id ? "text-purple-700 dark:text-purple-300" : "text-gray-800 dark:text-gray-200"
                  )}>
                    {model.name}
                  </h4>
                  {model.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {model.description}
                    </p>
                  )}
                </div>
              </div>
              {currentModel?.id === model.id && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
