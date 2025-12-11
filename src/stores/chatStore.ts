import { create } from 'zustand';

interface ChatState {
    isGenerating: boolean;
    abortController: AbortController | null;

    // 功能开关
    webSearchEnabled: boolean;
    deepThinkingEnabled: boolean;

    // 状态操作
    setIsGenerating: (isGenerating: boolean) => void;
    setAbortController: (controller: AbortController | null) => void;
    stopGenerating: () => void;

    // 功能开关操作
    setWebSearchEnabled: (enabled: boolean) => void;
    setDeepThinkingEnabled: (enabled: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    isGenerating: false,
    abortController: null,
    webSearchEnabled: false,
    deepThinkingEnabled: false,

    setIsGenerating: (isGenerating: boolean) => {
        set({ isGenerating });
    },

    setAbortController: (controller: AbortController | null) => {
        set({ abortController: controller });
    },

    stopGenerating: () => {
        const { abortController } = get();
        if (abortController) {
            abortController.abort();
        }
        set({ isGenerating: false, abortController: null });
    },

    setWebSearchEnabled: (enabled: boolean) => {
        set({ webSearchEnabled: enabled });
    },

    setDeepThinkingEnabled: (enabled: boolean) => {
        set({ deepThinkingEnabled: enabled });
    },
}));
