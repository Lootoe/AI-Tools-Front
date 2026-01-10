import { create } from 'zustand';
import { Asset } from '@/types/asset';
import * as api from '@/services/assetApi';

interface AssetState {
    assets: Asset[];
    isLoading: boolean;
    error: string | null;
    currentScriptId: string | null;

    loadAssets: (scriptId: string) => Promise<void>;
    addAsset: (scriptId: string, name: string, description: string) => Promise<string>;
    updateAsset: (scriptId: string, assetId: string, updates: Partial<Asset>) => Promise<void>;
    deleteAsset: (scriptId: string, assetId: string) => Promise<void>;
    clearAssets: () => void;
}

export const useAssetStore = create<AssetState>((set) => ({
    assets: [],
    isLoading: false,
    error: null,
    currentScriptId: null,

    loadAssets: async (scriptId: string) => {
        set({ isLoading: true, error: null, currentScriptId: scriptId });
        try {
            const assets = await api.fetchAssets(scriptId);
            set({ assets, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addAsset: async (scriptId: string, name: string, description: string) => {
        try {
            const newAsset = await api.createAsset(scriptId, { name, description });
            set((state) => ({ assets: [...state.assets, newAsset] }));
            return newAsset.id;
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    updateAsset: async (scriptId: string, assetId: string, updates: Partial<Asset>) => {
        try {
            await api.updateAsset(scriptId, assetId, updates);
            set((state) => ({
                assets: state.assets.map((a) => (a.id === assetId ? { ...a, ...updates } : a)),
            }));
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    deleteAsset: async (scriptId: string, assetId: string) => {
        try {
            await api.deleteAsset(scriptId, assetId);
            set((state) => ({ assets: state.assets.filter((a) => a.id !== assetId) }));
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },

    clearAssets: () => {
        set({ assets: [], currentScriptId: null });
    },
}));
