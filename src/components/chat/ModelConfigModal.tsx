import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';
import { useModelStore } from '@/stores/modelStore';
import { useChatStore } from '@/stores/chatStore';
import { AVAILABLE_MODELS } from '@/types/models';
import { cn } from '@/lib/utils';

interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelConfigModal: React.FC<ModelConfigModalProps> = ({ isOpen, onClose }) => {
  const { currentModel, setModel, parameters, setParameters, resetParameters } = useModelStore();
  const { webSearchEnabled, deepThinkingEnabled, setWebSearchEnabled, setDeepThinkingEnabled } =
    useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredModels = AVAILABLE_MODELS.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* 弹框 */}
      <div className="bg-background rounded-2xl shadow-2xl w-[900px] h-[600px] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h2 className="text-base font-semibold">模型配置</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 主体内容 - 左右布局 */}
        <div className="flex flex-1 min-h-0">
          {/* 左侧 - 模型列表 */}
          <div className="w-[360px] border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  placeholder="搜索模型..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full text-sm bg-background border border-input rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    className={cn(
                      'p-3 rounded-xl cursor-pointer transition-all',
                      currentModel.id === model.id
                        ? 'bg-primary/10 ring-2 ring-primary'
                        : 'bg-muted/30 hover:bg-muted/50'
                    )}
                    onClick={() => setModel(model)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{model.name}</h4>
                        {model.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {model.description}
                          </p>
                        )}
                      </div>
                      {currentModel.id === model.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={12} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredModels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    没有找到匹配的模型
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧 - 参数配置 */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 功能开关 */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground">功能设置</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs font-medium">联网搜索</p>
                      <p className="text-[10px] text-muted-foreground">搜索网络获取最新信息</p>
                    </div>
                    <Switch checked={webSearchEnabled} onChange={setWebSearchEnabled} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs font-medium">深度思考</p>
                      <p className="text-[10px] text-muted-foreground">进行更深入的推理分析</p>
                    </div>
                    <Switch checked={deepThinkingEnabled} onChange={setDeepThinkingEnabled} />
                  </div>
                </div>
              </div>

              {/* 模型参数 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground">模型参数</h3>
                  <Button variant="ghost" size="sm" onClick={resetParameters} className="h-6 text-[11px]">
                    重置
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Temperature */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs">Temperature</label>
                      <span className="text-[11px] text-muted-foreground">{parameters.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={parameters.temperature}
                      onChange={(e) => setParameters({ temperature: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Top P */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs">Top P</label>
                      <span className="text-[11px] text-muted-foreground">{parameters.topP}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={parameters.topP}
                      onChange={(e) => setParameters({ topP: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Frequency Penalty */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs">频率惩罚</label>
                      <span className="text-[11px] text-muted-foreground">{parameters.frequencyPenalty}</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={parameters.frequencyPenalty}
                      onChange={(e) => setParameters({ frequencyPenalty: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Presence Penalty */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs">存在惩罚</label>
                      <span className="text-[11px] text-muted-foreground">{parameters.presencePenalty}</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={parameters.presencePenalty}
                      onChange={(e) => setParameters({ presencePenalty: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                  </div>


                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t">
              <Button onClick={onClose} className="w-full">
                完成
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
