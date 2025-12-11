import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIModel, ModelParameters, AVAILABLE_MODELS, DEFAULT_PARAMETERS } from '@/types/models';

interface ModelState {
    currentModel: AIModel;
    parameters: ModelParameters;
    systemPrompt: string;
    setModel: (model: AIModel) => void;
    setParameters: (parameters: Partial<ModelParameters>) => void;
    setSystemPrompt: (prompt: string) => void;
    resetParameters: () => void;
}

export const useModelStore = create<ModelState>()(
    persist(
        (set) => ({
            currentModel: AVAILABLE_MODELS[0],
            parameters: DEFAULT_PARAMETERS,
            systemPrompt: '你是一个有帮助的AI助手。',

            setModel: (model) => set({ currentModel: model }),

            setParameters: (newParameters) =>
                set((state) => ({
                    parameters: { ...state.parameters, ...newParameters },
                })),

            setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

            resetParameters: () => set({ parameters: DEFAULT_PARAMETERS }),
        }),
        {
            name: 'model-storage',
        }
    )
);
