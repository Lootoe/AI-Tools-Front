import { create } from 'zustand';
import { Script, Episode, Storyboard, StoryboardVariant, VideoPhase, AssetTabType } from '@/types/video';
import * as api from '@/services/scriptApi';

interface VideoState {
  scripts: Script[];
  currentScriptId: string | null;
  currentAssetTab: AssetTabType;
  isLoading: boolean;
  error: string | null;

  setAssetTab: (tab: AssetTabType) => void;
  loadScripts: () => Promise<void>;
  createScript: (title?: string) => Promise<string>;
  selectScript: (id: string) => void;
  deleteScript: (id: string) => Promise<void>;
  deleteScripts: (ids: string[]) => Promise<void>;
  renameScript: (id: string, title: string) => Promise<void>;
  updateScriptPhase: (id: string, phase: VideoPhase) => Promise<void>;

  addEpisode: (scriptId: string, episode: Omit<Episode, 'id' | 'scriptId' | 'storyboards' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEpisode: (scriptId: string, episodeId: string, updates: Partial<Episode>) => Promise<void>;
  deleteEpisode: (scriptId: string, episodeId: string) => Promise<void>;

  addStoryboard: (scriptId: string, episodeId: string, storyboard: Omit<Storyboard, 'id' | 'episodeId' | 'status' | 'createdAt' | 'variants'>) => Promise<string>;
  updateStoryboard: (scriptId: string, episodeId: string, storyboardId: string, updates: Partial<Storyboard>) => Promise<void>;
  deleteStoryboard: (scriptId: string, episodeId: string, storyboardId: string) => Promise<void>;
  clearStoryboards: (scriptId: string, episodeId: string) => Promise<void>;
  reorderStoryboards: (scriptId: string, episodeId: string, fromIndex: number, toIndex: number) => Promise<void>;

  addVariant: (scriptId: string, episodeId: string, storyboardId: string) => Promise<string>;
  updateVariant: (scriptId: string, episodeId: string, storyboardId: string, variantId: string, updates: Partial<StoryboardVariant>) => Promise<void>;
  deleteVariant: (scriptId: string, episodeId: string, storyboardId: string, variantId: string) => Promise<void>;
  setActiveVariant: (scriptId: string, episodeId: string, storyboardId: string, variantId: string) => Promise<void>;
  refreshVariant: (scriptId: string, episodeId: string, storyboardId: string, variantId: string) => Promise<void>;

  getCurrentScript: () => Script | null;
  refreshScript: (scriptId: string) => Promise<void>;
}

// ============ 辅助函数：减少嵌套更新的重复代码 ============

type ScriptUpdater = (script: Script) => Script;
type EpisodeUpdater = (episode: Episode) => Episode;
type StoryboardUpdater = (storyboard: Storyboard) => Storyboard;

function updateScriptInList(scripts: Script[], scriptId: string, updater: ScriptUpdater): Script[] {
  return scripts.map((s) => (s.id === scriptId ? updater(s) : s));
}

function updateEpisodeInScript(script: Script, episodeId: string, updater: EpisodeUpdater): Script {
  return {
    ...script,
    episodes: script.episodes.map((e) => (e.id === episodeId ? updater(e) : e)),
  };
}

function updateStoryboardInEpisode(episode: Episode, storyboardId: string, updater: StoryboardUpdater): Episode {
  return {
    ...episode,
    storyboards: episode.storyboards.map((sb) => (sb.id === storyboardId ? updater(sb) : sb)),
  };
}

/** 深层更新：Script -> Episode -> Storyboard */
function deepUpdateStoryboard(
  scripts: Script[],
  scriptId: string,
  episodeId: string,
  storyboardId: string,
  updater: StoryboardUpdater
): Script[] {
  return updateScriptInList(scripts, scriptId, (script) =>
    updateEpisodeInScript(script, episodeId, (episode) =>
      updateStoryboardInEpisode(episode, storyboardId, updater)
    )
  );
}

/** 深层更新：Script -> Episode */
function deepUpdateEpisode(
  scripts: Script[],
  scriptId: string,
  episodeId: string,
  updater: EpisodeUpdater
): Script[] {
  return updateScriptInList(scripts, scriptId, (script) =>
    updateEpisodeInScript(script, episodeId, updater)
  );
}

/** 初始化脚本数据：排序分镜、初始化 variants */
function normalizeScript(script: Script): Script {
  script.episodes.forEach((episode) => {
    episode.storyboards.sort((a, b) => a.sceneNumber - b.sceneNumber);
    episode.storyboards.forEach((sb) => {
      if (!sb.variants) sb.variants = [];
    });
  });
  return script;
}


export const useVideoStore = create<VideoState>((set, get) => ({
  scripts: [],
  currentScriptId: null,
  currentAssetTab: 'storyboard',
  isLoading: false,
  error: null,

  setAssetTab: (tab) => set({ currentAssetTab: tab }),

  loadScripts: async () => {
    set({ isLoading: true, error: null });
    try {
      const scripts = await api.fetchScripts();
      scripts.forEach(normalizeScript);
      scripts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      set({ scripts, currentScriptId: scripts[0]?.id || null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createScript: async (title?: string) => {
    set({ isLoading: true, error: null });
    try {
      const newScript = await api.createScript(title);
      set((state) => ({
        scripts: [...state.scripts, newScript],
        currentScriptId: newScript.id,
        isLoading: false,
      }));
      return newScript.id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  selectScript: (id) => set({ currentScriptId: id }),

  deleteScript: async (id) => {
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

  deleteScripts: async (ids) => {
    try {
      await api.deleteScripts(ids);
      set((state) => ({
        scripts: state.scripts.filter((s) => !ids.includes(s.id)),
        currentScriptId: ids.includes(state.currentScriptId || '') ? null : state.currentScriptId,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  renameScript: async (id, title) => {
    try {
      await api.updateScript(id, { title });
      set((state) => ({
        scripts: updateScriptInList(state.scripts, id, (s) => ({
          ...s,
          title,
          updatedAt: new Date().toISOString(),
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateScriptPhase: async (id, phase) => {
    try {
      await api.updateScript(id, { currentPhase: phase });
      set((state) => ({
        scripts: updateScriptInList(state.scripts, id, (s) => ({
          ...s,
          currentPhase: phase,
          updatedAt: new Date().toISOString(),
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // ============ 剧集操作 ============

  addEpisode: async (scriptId, episode) => {
    try {
      const newEpisode = await api.createEpisode(scriptId, episode);
      set((state) => ({
        scripts: updateScriptInList(state.scripts, scriptId, (s) => ({
          ...s,
          episodes: [...s.episodes, newEpisode],
        })),
      }));
      return newEpisode.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateEpisode: async (scriptId, episodeId, updates) => {
    try {
      await api.updateEpisode(scriptId, episodeId, updates);
      set((state) => ({
        scripts: deepUpdateEpisode(state.scripts, scriptId, episodeId, (e) => ({ ...e, ...updates })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteEpisode: async (scriptId, episodeId) => {
    try {
      await api.deleteEpisode(scriptId, episodeId);
      set((state) => ({
        scripts: updateScriptInList(state.scripts, scriptId, (s) => ({
          ...s,
          episodes: s.episodes.filter((e) => e.id !== episodeId),
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },


  // ============ 分镜操作 ============

  addStoryboard: async (scriptId, episodeId, storyboard) => {
    try {
      const newStoryboard = await api.createStoryboard(scriptId, episodeId, storyboard);
      set((state) => ({
        scripts: deepUpdateEpisode(state.scripts, scriptId, episodeId, (e) => ({
          ...e,
          storyboards: [...e.storyboards, newStoryboard],
        })),
      }));
      return newStoryboard.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateStoryboard: async (scriptId, episodeId, storyboardId, updates) => {
    try {
      await api.updateStoryboard(scriptId, episodeId, storyboardId, updates);
      set((state) => ({
        scripts: deepUpdateStoryboard(state.scripts, scriptId, episodeId, storyboardId, (sb) => ({
          ...sb,
          ...updates,
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteStoryboard: async (scriptId, episodeId, storyboardId) => {
    try {
      await api.deleteStoryboard(scriptId, episodeId, storyboardId);
      set((state) => ({
        scripts: deepUpdateEpisode(state.scripts, scriptId, episodeId, (e) => ({
          ...e,
          storyboards: e.storyboards.filter((sb) => sb.id !== storyboardId),
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearStoryboards: async (scriptId, episodeId) => {
    try {
      await api.clearStoryboards(scriptId, episodeId);
      set((state) => ({
        scripts: deepUpdateEpisode(state.scripts, scriptId, episodeId, (e) => ({
          ...e,
          storyboards: [],
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  reorderStoryboards: async (scriptId, episodeId, fromIndex, toIndex) => {
    const state = get();
    const script = state.scripts.find((s) => s.id === scriptId);
    const episode = script?.episodes.find((e) => e.id === episodeId);
    if (!episode) return;

    const storyboards = [...episode.storyboards];
    const [movedItem] = storyboards.splice(fromIndex, 1);
    storyboards.splice(toIndex, 0, movedItem);
    storyboards.forEach((sb, idx) => (sb.sceneNumber = idx + 1));

    // 乐观更新
    set((state) => ({
      scripts: deepUpdateEpisode(state.scripts, scriptId, episodeId, (e) => ({
        ...e,
        storyboards,
      })),
    }));

    try {
      await api.reorderStoryboards(scriptId, episodeId, storyboards.map((sb) => sb.id));
    } catch (error) {
      await get().refreshScript(scriptId);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // ============ 分镜副本操作 ============

  addVariant: async (scriptId, episodeId, storyboardId) => {
    try {
      const newVariant = await api.createVariant(scriptId, episodeId, storyboardId);
      set((state) => ({
        scripts: deepUpdateStoryboard(state.scripts, scriptId, episodeId, storyboardId, (sb) => ({
          ...sb,
          variants: [...(sb.variants || []), newVariant],
          activeVariantId: sb.activeVariantId || newVariant.id,
        })),
      }));
      return newVariant.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateVariant: async (scriptId, episodeId, storyboardId, variantId, updates) => {
    try {
      await api.updateVariant(scriptId, episodeId, storyboardId, variantId, updates);
      set((state) => ({
        scripts: deepUpdateStoryboard(state.scripts, scriptId, episodeId, storyboardId, (sb) => ({
          ...sb,
          variants: (sb.variants || []).map((v) => (v.id === variantId ? { ...v, ...updates } : v)),
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteVariant: async (scriptId, episodeId, storyboardId, variantId) => {
    try {
      await api.deleteVariant(scriptId, episodeId, storyboardId, variantId);
      set((state) => ({
        scripts: deepUpdateStoryboard(state.scripts, scriptId, episodeId, storyboardId, (sb) => {
          const newVariants = (sb.variants || []).filter((v) => v.id !== variantId);
          return {
            ...sb,
            variants: newVariants,
            activeVariantId: sb.activeVariantId === variantId ? newVariants[0]?.id : sb.activeVariantId,
          };
        }),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setActiveVariant: async (scriptId, episodeId, storyboardId, variantId) => {
    try {
      await api.setActiveVariant(scriptId, episodeId, storyboardId, variantId);
      set((state) => ({
        scripts: deepUpdateStoryboard(state.scripts, scriptId, episodeId, storyboardId, (sb) => ({
          ...sb,
          activeVariantId: variantId,
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  refreshVariant: async (scriptId, episodeId, storyboardId, variantId) => {
    try {
      const variant = await api.fetchVariant(scriptId, episodeId, storyboardId, variantId);
      set((state) => ({
        scripts: deepUpdateStoryboard(state.scripts, scriptId, episodeId, storyboardId, (sb) => ({
          ...sb,
          variants: (sb.variants || []).map((v) => (v.id === variantId ? variant : v)),
        })),
      }));
    } catch (error) {
      console.error('刷新 variant 失败:', error);
    }
  },

  getCurrentScript: () => {
    const state = get();
    return state.scripts.find((s) => s.id === state.currentScriptId) || null;
  },

  refreshScript: async (scriptId) => {
    try {
      const script = await api.fetchScript(scriptId);
      set((state) => ({
        scripts: state.scripts.map((s) => (s.id === scriptId ? script : s)),
      }));
    } catch (error) {
      console.error('刷新剧本失败:', error);
    }
  },
}));
