import React from 'react';
import { ConversationList } from './ConversationList';
import { useConversationStore } from '@/stores/conversationStore';
import { useModelStore } from '@/stores/modelStore';

export const Sidebar: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    createConversation,
    deleteConversation,
  } = useConversationStore();
  
  const { currentModel } = useModelStore();

  const handleCreate = async () => {
    await createConversation(currentModel.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个对话吗？')) {
      await deleteConversation(id);
    }
  };

  return (
    <aside className="w-64 border-r bg-background flex flex-col h-full">
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelect={selectConversation}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
    </aside>
  );
};
