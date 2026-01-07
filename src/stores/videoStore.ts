import { create } from 'zustand';
import { Script, Episode, Storyboard, StoryboardVariant, VideoPhase, AssetTabType } from '@/types/video';
import * as api from '@/services/scriptApi';

interface VideoState {
  scripts: Script[];
  currentScriptId: string | null;
  currentAssetTab: AssetTabType;
  isLoading: boolean;
  error: string | null;

  // 资产 Tab 操作
  setAssetTab: (tab: AssetTabType) => void;

  // 剧本操作
  loadScripts: () => Promise<void>;
  createScript: (title?: string) => Promise<string>;
  selectScript: (id: string) => void;
  deleteScript: (id: string) => Promise<void>;
  renameScript: (id: string, title: string) => Promise<void>;
  updateScriptPhase: (id: string, phase: VideoPhase) => Promise<void>;

  // 剧集操作
  addEpisode: (scriptId: string, episode: Omit<Episode, 'id' | 'scriptId' | 'storyboards' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEpisode: (scriptId: string, episodeId: string, updates: Partial<Episode>) => Promise<void>;
  deleteEpisode: (scriptId: string, episodeId: string) => Promise<void>;

  // 分镜操作
  addStoryboard: (scriptId: string, episodeId: string, storyboard: Omit<Storyboard, 'id' | 'episodeId' | 'status' | 'createdAt' | 'variants'>) => Promise<string>;
  updateStoryboard: (scriptId: string, episodeId: string, storyboardId: string, updates: Partial<Storyboard>) => Promise<void>;
  deleteStoryboard: (scriptId: string, episodeId: string, storyboardId: string) => Promise<void>;
  clearStoryboards: (scriptId: string, episodeId: string) => Promise<void>;
  reorderStoryboards: (scriptId: string, episodeId: string, fromIndex: number, toIndex: number) => Promise<void>;

  // 分镜副本操作
  addVariant: (scriptId: string, episodeId: string, storyboardId: string) => Promise<string>;
  updateVariant: (scriptId: string, episodeId: string, storyboardId: string, variantId: string, updates: Partial<StoryboardVariant>) => Promise<void>;
  deleteVariant: (scriptId: string, episodeId: string, storyboardId: string, variantId: string) => Promise<void>;
  setActiveVariant: (scriptId: string, episodeId: string, storyboardId: string, variantId: string) => Promise<void>;

  // 获取当前剧本
  getCurrentScript: () => Script | null;
  
  // 内部方法：刷新单个剧本
  refreshScript: (scriptId: string) => Promise<void>;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  scripts: [],
  currentScriptId: null,
  currentAssetTab: 'storyboard',
  isLoading: false,
  error: null,

  setAssetTab: (tab: AssetTabType) => {
    set({ currentAssetTab: tab });
  },

  loadScripts: async () => {
    set({ isLoading: true, error: null });
    try {
      const scripts = await api.fetchScripts();
      // 确保分镜按 sceneNumber 排序，并初始化 variants 数组
      scripts.forEach((script) => {
        script.episodes.forEach((episode) => {
          episode.storyboards.sort((a, b) => a.sceneNumber - b.sceneNumber);
          episode.storyboards.forEach((sb) => {
            if (!sb.variants) sb.variants = [];
          });
        });
      });
      const currentScriptId = scripts.length > 0 ? scripts[0].id : null;
      set({ scripts, currentScriptId, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createScript: async (title?: string) => {
    set({ isLoading: true, error: null });
    try {
      const newScript = await api.createScript(title);
      set((state) => ({
        scripts: [newScript, ...state.scripts],
        currentScriptId: newScript.id,
        isLoading: false,
      }));
      return newScript.id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  selectScript: (id: string) => {
    set({ currentScriptId: id });
  },

  deleteScript: async (id: string) => {
    try {
      await api.deleteScript(id);
      set((state) => ({
        scripts: state.scripts.filter((s) => s.id !== id),
        currentScriptId: state.currentScriptId === id ? null : state.currentScriptId,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  renameScript: async (id: string, title: string) => {
    try {
      await api.updateScript(id, { title });
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === id ? { ...s, title, updatedAt: new Date().toISOString() } : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateScriptPhase: async (id: string, phase: VideoPhase) => {
    try {
      await api.updateScript(id, { currentPhase: phase });
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === id ? { ...s, currentPhase: phase, updatedAt: new Date().toISOString() } : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },


  refreshScript: async (scriptId: string) => {
    try {
      const script = await api.fetchScript(scriptId);
      // 确保分镜按 sceneNumber 排序，并初始化 variants 数组
      script.episodes.forEach((episode) => {
        episode.storyboards.sort((a, b) => a.sceneNumber - b.sceneNumber);
        episode.storyboards.forEach((sb) => {
          if (!sb.variants) sb.variants = [];
        });
      });
      set((state) => ({
        scripts: state.scripts.map((s) => (s.id === scriptId ? script : s)),
      }));
    } catch (error) {
      console.error('刷新剧本失败:', error);
    }
  },

  addEpisode: async (scriptId: string, episode) => {
    try {
      const newEpisode = await api.createEpisode(scriptId, episode);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? { ...s, episodes: [...s.episodes, newEpisode] }
            : s
        ),
      }));
      return newEpisode.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateEpisode: async (scriptId: string, episodeId: string, updates) => {
    try {
      await api.updateEpisode(scriptId, episodeId, updates);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId ? { ...e, ...updates } : e
                ),
              }
            : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteEpisode: async (scriptId: string, episodeId: string) => {
    try {
      await api.deleteEpisode(scriptId, episodeId);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? { ...s, episodes: s.episodes.filter((e) => e.id !== episodeId) }
            : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addStoryboard: async (scriptId: string, episodeId: string, storyboard) => {
    try {
      const newStoryboard = await api.createStoryboard(scriptId, episodeId, storyboard);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId
                    ? { ...e, storyboards: [...e.storyboards, newStoryboard] }
                    : e
                ),
              }
            : s
        ),
      }));
      return newStoryboard.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateStoryboard: async (scriptId: string, episodeId: string, storyboardId: string, updates) => {
    try {
      await api.updateStoryboard(scriptId, episodeId, storyboardId, updates);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId
                    ? {
                        ...e,
                        storyboards: e.storyboards.map((sb) =>
                          sb.id === storyboardId ? { ...sb, ...updates } : sb
                        ),
                      }
                    : e
                ),
              }
            : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteStoryboard: async (scriptId: string, episodeId: string, storyboardId: string) => {
    try {
      await api.deleteStoryboard(scriptId, episodeId, storyboardId);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId
                    ? { ...e, storyboards: e.storyboards.filter((sb) => sb.id !== storyboardId) }
                    : e
                ),
              }
            : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearStoryboards: async (scriptId: string, episodeId: string) => {
    try {
      await api.clearStoryboards(scriptId, episodeId);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId ? { ...e, storyboards: [] } : e
                ),
              }
            : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  reorderStoryboards: async (scriptId: string, episodeId: string, fromIndex: number, toIndex: number) => {
    const state = get();
    const script = state.scripts.find((s) => s.id === scriptId);
    const episode = script?.episodes.find((e) => e.id === episodeId);
    if (!episode) return;

    const storyboards = [...episode.storyboards];
    const [movedItem] = storyboards.splice(fromIndex, 1);
    storyboards.splice(toIndex, 0, movedItem);
    
    // 更新 sceneNumber
    storyboards.forEach((sb, idx) => {
      sb.sceneNumber = idx + 1;
    });

    // 先乐观更新 UI
    set((state) => ({
      scripts: state.scripts.map((s) =>
        s.id === scriptId
          ? {
              ...s,
              episodes: s.episodes.map((e) =>
                e.id === episodeId ? { ...e, storyboards } : e
              ),
            }
          : s
      ),
    }));

    try {
      await api.reorderStoryboards(scriptId, episodeId, storyboards.map((sb) => sb.id));
    } catch (error) {
      // 失败时重新加载
      await get().refreshScript(scriptId);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 分镜副本操作
  addVariant: async (scriptId: string, episodeId: string, storyboardId: string) => {
    try {
      const newVariant = await api.createVariant(scriptId, episodeId, storyboardId);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId
                    ? {
                        ...e,
                        storyboards: e.storyboards.map((sb) =>
                          sb.id === storyboardId
                            ? {
                                ...sb,
                                variants: [...(sb.variants || []), newVariant],
                                activeVariantId: sb.activeVariantId || newVariant.id,
                              }
                            : sb
                        ),
                      }
                    : e
                ),
              }
            : s
        ),
      }));
      return newVariant.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateVariant: async (scriptId: string, episodeId: string, storyboardId: string, variantId: string, updates) => {
    try {
      await api.updateVariant(scriptId, episodeId, storyboardId, variantId, updates);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId
                    ? {
                        ...e,
                        storyboards: e.storyboards.map((sb) =>
                          sb.id === storyboardId
                            ? {
                                ...sb,
                                variants: (sb.variants || []).map((v) =>
                                  v.id === variantId ? { ...v, ...updates } : v
                                ),
                              }
                            : sb
                        ),
                      }
                    : e
                ),
              }
            : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteVariant: async (scriptId: string, episodeId: string, storyboardId: string, variantId: string) => {
    try {
      await api.deleteVariant(scriptId, episodeId, storyboardId, variantId);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId
                    ? {
                        ...e,
                        storyboards: e.storyboards.map((sb) => {
                          if (sb.id !== storyboardId) return sb;
                          const newVariants = (sb.variants || []).filter((v) => v.id !== variantId);
                          return {
                            ...sb,
                            variants: newVariants,
                            activeVariantId:
                              sb.activeVariantId === variantId
                                ? newVariants[0]?.id
                                : sb.activeVariantId,
                          };
                        }),
                      }
                    : e
                ),
              }
            : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setActiveVariant: async (scriptId: string, episodeId: string, storyboardId: string, variantId: string) => {
    try {
      await api.setActiveVariant(scriptId, episodeId, storyboardId, variantId);
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.id === scriptId
            ? {
                ...s,
                episodes: s.episodes.map((e) =>
                  e.id === episodeId
                    ? {
                        ...e,
                        storyboards: e.storyboards.map((sb) =>
                          sb.id === storyboardId
                            ? { ...sb, activeVariantId: variantId }
                            : sb
                        ),
                      }
                    : e
                ),
              }
            : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getCurrentScript: () => {
    const { scripts, currentScriptId } = get();
    return scripts.find((s) => s.id === currentScriptId) || null;
  },
}));
