import React from 'react';
import { useModelStore } from '@/stores/modelStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const ParameterControls: React.FC = () => {
  const { parameters, setParameters, resetParameters } = useModelStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">模型参数</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetParameters}
          className="h-7 text-xs"
        >
          重置
        </Button>
      </div>

      <div className="space-y-4">
        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Temperature</label>
            <span className="text-xs text-muted-foreground">
              {parameters.temperature}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={parameters.temperature}
            onChange={(e) =>
              setParameters({ temperature: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            控制回答的随机性。值越大越随机
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">最大Token数</label>
            <span className="text-xs text-muted-foreground">
              {parameters.maxTokens}
            </span>
          </div>
          <Input
            type="number"
            min="1"
            max="8192"
            value={parameters.maxTokens}
            onChange={(e) =>
              setParameters({ maxTokens: parseInt(e.target.value) || 1 })
            }
            className="h-9"
          />
        </div>

        {/* Top P */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Top P</label>
            <span className="text-xs text-muted-foreground">
              {parameters.topP}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={parameters.topP}
            onChange={(e) =>
              setParameters({ topP: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            核采样参数，控制生成的多样性
          </p>
        </div>

        {/* Frequency Penalty */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">频率惩罚</label>
            <span className="text-xs text-muted-foreground">
              {parameters.frequencyPenalty}
            </span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={parameters.frequencyPenalty}
            onChange={(e) =>
              setParameters({ frequencyPenalty: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Presence Penalty */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">存在惩罚</label>
            <span className="text-xs text-muted-foreground">
              {parameters.presencePenalty}
            </span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={parameters.presencePenalty}
            onChange={(e) =>
              setParameters({ presencePenalty: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
