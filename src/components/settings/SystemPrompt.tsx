import React from 'react';
import { useModelStore } from '@/stores/modelStore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const DEFAULT_PROMPTS = [
  {
    name: '默认助手',
    prompt: '你是一个有帮助的AI助手。',
  },
  {
    name: '代码助手',
    prompt: '你是一个专业的编程助手，擅长解释代码、调试问题和提供最佳实践建议。',
  },
  {
    name: '创意写作',
    prompt: '你是一个富有创造力的写作助手，擅长创作故事、诗歌和各种文学作品。',
  },
  {
    name: '专业翻译',
    prompt: '你是一个专业的翻译助手，能够准确、流畅地在不同语言之间进行翻译。',
  },
];

export const SystemPrompt: React.FC = () => {
  const { systemPrompt, setSystemPrompt } = useModelStore();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">系统提示词</h3>
      
      {/* 预设提示词快捷按钮 */}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_PROMPTS.map((preset) => (
          <Button
            key={preset.name}
            variant="outline"
            size="sm"
            onClick={() => setSystemPrompt(preset.prompt)}
            className="h-7 text-xs"
          >
            {preset.name}
          </Button>
        ))}
      </div>

      {/* 自定义提示词输入 */}
      <Textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        placeholder="输入自定义系统提示词..."
        className="min-h-[120px] resize-none"
      />
      
      <p className="text-xs text-muted-foreground">
        系统提示词会在每次对话开始时发送给AI，用于定义其行为和角色
      </p>
    </div>
  );
};
