import { create } from 'zustand';
import { Scene } from '@/types/video';
import * as api from '@/services/sceneApi';

interface SceneState {
    scenes: Scene[];
    isLoading: boolean;
    error: string | null;
    currentScriptId: string | null;

    // 场景操作
    loadScenes: (scriptId: string) => Promise<void>;
    addScene: (scriptId: string, name: string, description: string) => Promise<string>;
    updateScene: (scriptId: string, sceneId: string, updates: Partial<Scene>) => Promise<void>;
    deleteScene: (scriptId: string, sceneId: string) => Promise<void>;
    clearScenes: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
    scenes: [],
    isLoading: false,
    error: null,
    currentScriptId: null,

    loadScenes: async (scriptId: string) => {
        set({ isLoading: true, error: null, currentScriptId: scriptId });
        try {
            const scenes = await api.fetchScenes(scriptId);
            set({ scenes, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addScene: async (scriptId: string, name: string, description: string) => {
        try {
            const newScene = await api.createScene(scriptId, { name, description });
            set((state) => ({
                scenes: [...state.scenes, newScene],
            }));
            return newScene.id;
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    updateScene: async (scriptId: string, sceneId: string, updates: Partial<Scene>) => {
        try {
            await api.updateScene(scriptId, sceneId, updates);
            set((state) => ({
                scenes: state.scenes.map((s) =>
                    s.id === sceneId ? { ...s, ...updates } : s
                ),
            }));
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    deleteScene: async (scriptId: string, sceneId: string) => {
        try {
            await api.deleteScene(scriptId, sceneId);
            set((state) => ({
                scenes: state.scenes.filter((s) => s.id !== sceneId),
            }));
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    clearScenes: () => {
        set({ scenes: [], currentScriptId: null });
    },
}));
