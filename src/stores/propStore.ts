import { create } from 'zustand';
import { Prop } from '@/types/video';
import * as api from '@/services/propApi';

interface PropState {
    props: Prop[];
    isLoading: boolean;
    error: string | null;
    currentScriptId: string | null;

    // 物品操作
    loadProps: (scriptId: string) => Promise<void>;
    addProp: (scriptId: string, name: string, description: string) => Promise<string>;
    updateProp: (scriptId: string, propId: string, updates: Partial<Prop>) => Promise<void>;
    deleteProp: (scriptId: string, propId: string) => Promise<void>;
    clearProps: () => void;
}

export const usePropStore = create<PropState>((set, get) => ({
    props: [],
    isLoading: false,
    error: null,
    currentScriptId: null,

    loadProps: async (scriptId: string) => {
        set({ isLoading: true, error: null, currentScriptId: scriptId });
        try {
            const props = await api.fetchProps(scriptId);
            set({ props, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addProp: async (scriptId: string, name: string, description: string) => {
        try {
            const newProp = await api.createProp(scriptId, { name, description });
            set((state) => ({
                props: [...state.props, newProp],
            }));
            return newProp.id;
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    updateProp: async (scriptId: string, propId: string, updates: Partial<Prop>) => {
        try {
            await api.updateProp(scriptId, propId, updates);
            set((state) => ({
                props: state.props.map((p) =>
                    p.id === propId ? { ...p, ...updates } : p
                ),
            }));
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    deleteProp: async (scriptId: string, propId: string) => {
        try {
            await api.deleteProp(scriptId, propId);
            set((state) => ({
                props: state.props.filter((p) => p.id !== propId),
            }));
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    clearProps: () => {
        set({ props: [], currentScriptId: null });
    },
}));
