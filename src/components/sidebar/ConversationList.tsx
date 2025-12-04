import React from 'react';
import { Conversation } from '@/types/conversation';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { formatTimestamp } from '@/utils/formatters';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelect,
  onDelete,
  onCreate,
}) => {
  return (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-4 border-b">
        <Button
          onClick={onCreate}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <MessageSquarePlus size={18} />
          新对话
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'group relative px-4 py-3 cursor-pointer transition-colors',
              'hover:bg-muted/50 border-b border-border/50',
              currentConversationId === conversation.id && 'bg-muted'
            )}
            onClick={() => onSelect(conversation.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">
                  {conversation.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(conversation.updatedAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation.id);
                }}
              >
                <Trash2 size={14} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            还没有对话
            <br />
            点击上方按钮创建新对话
          </div>
        )}
      </div>
    </div>
  );
};
