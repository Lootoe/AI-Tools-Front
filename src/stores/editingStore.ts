import { create } from 'zustand';

interface EditingState {
    editingMessageId: string | null;
    editingContent: string;

    startEditing: (messageId: string, content: string) => void;
    cancelEditing: () => void;
    clearEditing: () => void;
}

export const useEditingStore = create<EditingState>((set) => ({
    editingMessageId: null,
    editingContent: '',

    startEditing: (messageId: string, content: string) => {
        set({ editingMessageId: messageId, editingContent: content });
    },

    cancelEditing: () => {
        set({ editingMessageId: null, editingContent: '' });
    },

    clearEditing: () => {
        set({ editingMessageId: null, editingContent: '' });
    },
}));
