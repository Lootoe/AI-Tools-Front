import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIModel, ModelParameters, DEFAULT_PARAMETERS } from '@/types/models';
import { fetchModels } from '@/services/api';

interface ModelState {
    models: AIModel[];
    currentModel: AIModel | null;
    parameters: ModelParameters;
    loading: boolean;
    error: string | null;
    loadModels: () => Promise<void>;
    setModel: (model: AIModel) => void;
    setParameters: (parameters: Partial<ModelParameters>) => void;
    resetParameters: () => void;
}

export const useModelStore = create<ModelState>()(
    persist(
        (set, get) => ({
            models: [],
            currentModel: null,
            parameters: DEFAULT_PARAMETERS,
            loading: false,
            error: null,

            loadModels: async () => {
                set({ loading: true, error: null });
                try {
                    const models = await fetchModels();
                    const { currentModel } = get();
                    // 如果当前没有选中模型，或选中的模型不在列表中，选择第一个
                    const validModel = currentModel && models.find(m => m.id === currentModel.id);
                    set({
                        models,
                        currentModel: validModel || models[0] || null,
                        loading: false,
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : '加载模型失败',
                        loading: false,
                    });
                }
            },

            setModel: (model) => set({ currentModel: model }),

            setParameters: (newParameters) =>
                set((state) => ({
                    parameters: { ...state.parameters, ...newParameters },
                })),

            resetParameters: () => set({ parameters: DEFAULT_PARAMETERS }),
        }),
        {
            name: 'model-storage',
            partialize: (state) => ({
                currentModel: state.currentModel,
                parameters: state.parameters,
            }),
        }
    )
);
