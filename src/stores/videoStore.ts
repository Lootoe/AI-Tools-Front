import { create } from 'zustand';
import { Script, Character, Episode, Storyboard, VideoPhase } from '@/types/video';

const generateId = () => Math.random().toString(36).substring(2, 15);

// localStorage key
const STORAGE_KEY = 'ai-tools-video-scripts';

// 从 localStorage 加载
const loadScripts = (): Script[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// 保存到 localStorage
const saveScripts = (scripts: Script[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
};

interface VideoState {
  scripts: Script[];
  currentScriptId: string | null;
  isLoading: boolean;

  // 剧本操作
  loadScripts: () => void;
  createScript: (title?: string) => string;
  selectScript: (id: string) => void;
  deleteScript: (id: string) => void;
  renameScript: (id: string, title: string) => void;
  updateScriptPhase: (id: string, phase: VideoPhase) => void;

  // 角色操作
  addCharacter: (scriptId: string, character: Omit<Character, 'id' | 'status' | 'createdAt'>) => string;
  updateCharacter: (scriptId: string, characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (scriptId: string, characterId: string) => void;

  // 剧集操作
  addEpisode: (scriptId: string, episode: Omit<Episode, 'id' | 'scriptId' | 'storyboards' | 'createdAt' | 'updatedAt'>) => string;
  updateEpisode: (scriptId: string, episodeId: string, updates: Partial<Episode>) => void;
  deleteEpisode: (scriptId: string, episodeId: string) => void;

  // 分镜操作
  addStoryboard: (scriptId: string, episodeId: string, storyboard: Omit<Storyboard, 'id' | 'episodeId' | 'status' | 'createdAt'>) => string;
  updateStoryboard: (scriptId: string, episodeId: string, storyboardId: string, updates: Partial<Storyboard>) => void;
  deleteStoryboard: (scriptId: string, episodeId: string, storyboardId: string) => void;
  clearStoryboards: (scriptId: string, episodeId: string) => void;
  reorderStoryboards: (scriptId: string, episodeId: string, fromIndex: number, toIndex: number) => void;

  // 获取当前剧本
  getCurrentScript: () => Script | null;
}


export const useVideoStore = create<VideoState>((set, get) => ({
  scripts: [],
  currentScriptId: null,
  isLoading: false,

  loadScripts: () => {
    const scripts = loadScripts();
    // 自动选择第1个剧本
    const currentScriptId = scripts.length > 0 ? scripts[0].id : null;
    set({ scripts, currentScriptId });
  },

  createScript: (title?: string) => {
    const newScript: Script = {
      id: generateId(),
      title: title || '新剧本',
      characters: [],
      episodes: [],
      currentPhase: 'storyboard',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const scripts = [newScript, ...get().scripts];
    saveScripts(scripts);
    set({ scripts, currentScriptId: newScript.id });
    return newScript.id;
  },

  selectScript: (id: string) => {
    set({ currentScriptId: id });
  },

  deleteScript: (id: string) => {
    const scripts = get().scripts.filter((s) => s.id !== id);
    saveScripts(scripts);
    set({
      scripts,
      currentScriptId: get().currentScriptId === id ? null : get().currentScriptId,
    });
  },

  renameScript: (id: string, title: string) => {
    const scripts = get().scripts.map((s) =>
      s.id === id ? { ...s, title, updatedAt: Date.now() } : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  updateScriptPhase: (id: string, phase: VideoPhase) => {
    const scripts = get().scripts.map((s) =>
      s.id === id ? { ...s, currentPhase: phase, updatedAt: Date.now() } : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  addCharacter: (scriptId: string, character) => {
    const charId = generateId();
    const newCharacter: Character = {
      ...character,
      id: charId,
      status: 'pending',
      createdAt: Date.now(),
    };
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? { ...s, characters: [...s.characters, newCharacter], updatedAt: Date.now() }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
    return charId;
  },

  updateCharacter: (scriptId: string, characterId: string, updates) => {
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? {
            ...s,
            characters: s.characters.map((c) =>
              c.id === characterId ? { ...c, ...updates } : c
            ),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  deleteCharacter: (scriptId: string, characterId: string) => {
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? {
            ...s,
            characters: s.characters.filter((c) => c.id !== characterId),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  addEpisode: (scriptId: string, episode) => {
    const epId = generateId();
    const newEpisode: Episode = {
      ...episode,
      id: epId,
      scriptId,
      storyboards: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? { ...s, episodes: [...s.episodes, newEpisode], updatedAt: Date.now() }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
    return epId;
  },

  updateEpisode: (scriptId: string, episodeId: string, updates) => {
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? {
            ...s,
            episodes: s.episodes.map((e) =>
              e.id === episodeId ? { ...e, ...updates, updatedAt: Date.now() } : e
            ),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  deleteEpisode: (scriptId: string, episodeId: string) => {
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? {
            ...s,
            episodes: s.episodes.filter((e) => e.id !== episodeId),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  addStoryboard: (scriptId: string, episodeId: string, storyboard) => {
    const sbId = generateId();
    const newStoryboard: Storyboard = {
      ...storyboard,
      id: sbId,
      episodeId,
      status: 'pending',
      createdAt: Date.now(),
    };
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? {
            ...s,
            episodes: s.episodes.map((e) =>
              e.id === episodeId
                ? { ...e, storyboards: [...e.storyboards, newStoryboard], updatedAt: Date.now() }
                : e
            ),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
    return sbId;
  },

  updateStoryboard: (scriptId: string, episodeId: string, storyboardId: string, updates) => {
    const scripts = get().scripts.map((s) =>
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
                    updatedAt: Date.now(),
                  }
                : e
            ),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  deleteStoryboard: (scriptId: string, episodeId: string, storyboardId: string) => {
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? {
            ...s,
            episodes: s.episodes.map((e) =>
              e.id === episodeId
                ? {
                    ...e,
                    storyboards: e.storyboards.filter((sb) => sb.id !== storyboardId),
                    updatedAt: Date.now(),
                  }
                : e
            ),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  clearStoryboards: (scriptId: string, episodeId: string) => {
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? {
            ...s,
            episodes: s.episodes.map((e) =>
              e.id === episodeId
                ? {
                    ...e,
                    storyboards: [],
                    updatedAt: Date.now(),
                  }
                : e
            ),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  reorderStoryboards: (scriptId: string, episodeId: string, fromIndex: number, toIndex: number) => {
    const scripts = get().scripts.map((s) =>
      s.id === scriptId
        ? {
            ...s,
            episodes: s.episodes.map((e) => {
              if (e.id === episodeId) {
                const storyboards = [...e.storyboards];
                const [movedItem] = storyboards.splice(fromIndex, 1);
                storyboards.splice(toIndex, 0, movedItem);
                // 更新 sceneNumber
                storyboards.forEach((sb, idx) => {
                  sb.sceneNumber = idx + 1;
                });
                return {
                  ...e,
                  storyboards,
                  updatedAt: Date.now(),
                };
              }
              return e;
            }),
            updatedAt: Date.now(),
          }
        : s
    );
    saveScripts(scripts);
    set({ scripts });
  },

  getCurrentScript: () => {
    const { scripts, currentScriptId } = get();
    return scripts.find((s) => s.id === currentScriptId) || null;
  },
}));
