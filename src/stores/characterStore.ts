import { create } from 'zustand';
import { Character } from '@/types/video';
import { fetchCharacters, createCharacter, updateCharacter, deleteCharacter } from '@/services/characterApi';

interface CharacterState {
    characters: Character[];
    isLoading: boolean;
    loadCharacters: (scriptId: string) => Promise<void>;
    addCharacter: (scriptId: string, name: string, description?: string) => Promise<string>;
    updateCharacter: (scriptId: string, characterId: string, data: Partial<Character>) => Promise<void>;
    deleteCharacter: (scriptId: string, characterId: string) => Promise<void>;
    refreshCharacter: (scriptId: string, characterId: string) => Promise<void>;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
    characters: [],
    isLoading: false,

    loadCharacters: async (scriptId: string) => {
        set({ isLoading: true });
        try {
            const res = await fetchCharacters(scriptId);
            if (res.success) set({ characters: res.data });
        } finally {
            set({ isLoading: false });
        }
    },

    addCharacter: async (scriptId: string, name: string, description = '') => {
        const res = await createCharacter(scriptId, name, description);
        if (res.success) {
            set((state) => ({ characters: [...state.characters, res.data] }));
            return res.data.id;
        }
        throw new Error('创建角色失败');
    },

    updateCharacter: async (scriptId: string, characterId: string, data: Partial<Character>) => {
        // 乐观更新
        set((state) => ({
            characters: state.characters.map((c) => (c.id === characterId ? { ...c, ...data } : c)),
        }));
        try {
            await updateCharacter(scriptId, characterId, data);
        } catch {
            // 失败时重新加载
            get().loadCharacters(scriptId);
        }
    },

    deleteCharacter: async (scriptId: string, characterId: string) => {
        set((state) => ({ characters: state.characters.filter((c) => c.id !== characterId) }));
        try {
            await deleteCharacter(scriptId, characterId);
        } catch {
            get().loadCharacters(scriptId);
        }
    },

    refreshCharacter: async (scriptId: string, characterId: string) => {
        const res = await fetchCharacters(scriptId);
        if (res.success) {
            const updated = res.data.find((c) => c.id === characterId);
            if (updated) {
                set((state) => ({
                    characters: state.characters.map((c) => (c.id === characterId ? updated : c)),
                }));
            }
        }
    },
}));
