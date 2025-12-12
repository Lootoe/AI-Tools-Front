import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIModel, ModelParameters, AVAILABLE_MODELS, DEFAULT_PARAMETERS } from '@/types/models';

interface ModelState {
    currentModel: AIModel;
    parameters: ModelParameters;
    setModel: (model: AIModel) => void;
    setParameters: (parameters: Partial<ModelParameters>) => void;
    resetParameters: () => void;
}

export const useModelStore = create<ModelState>()(
    persist(
        (set) => ({
            currentModel: AVAILABLE_MODELS[0],
            parameters: DEFAULT_PARAMETERS,

            setModel: (model) => set({ currentModel: model }),

            setParameters: (newParameters) =>
                set((state) => ({
                    parameters: { ...state.parameters, ...newParameters },
                })),

            resetParameters: () => set({ parameters: DEFAULT_PARAMETERS }),
        }),
        {
            name: 'model-storage',
        }
    )
);
