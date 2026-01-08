import { create } from 'zustand';
import { Character } from '@/types/video';
import * as api from '@/services/characterApi';

interface CharacterState {
  characters: Character[];
  isLoading: boolean;
  error: string | null;
  currentScriptId: string | null;

  // 角色操作
  loadCharacters: (scriptId: string) => Promise<void>;
  addCharacter: (scriptId: string, name: string, description: string) => Promise<string>;
  updateCharacter: (scriptId: string, characterId: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (scriptId: string, characterId: string) => Promise<void>;
  clearCharacters: () => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  isLoading: false,
  error: null,
  currentScriptId: null,

  loadCharacters: async (scriptId: string) => {
    set({ isLoading: true, error: null, currentScriptId: scriptId });
    try {
      const characters = await api.fetchCharacters(scriptId);
      set({ characters, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCharacter: async (scriptId: string, name: string, description: string) => {
    try {
      const newCharacter = await api.createCharacter(scriptId, { name, description });
      set((state) => ({
        characters: [...state.characters, newCharacter],
      }));
      return newCharacter.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateCharacter: async (scriptId: string, characterId: string, updates: Partial<Character>) => {
    try {
      await api.updateCharacter(scriptId, characterId, updates);
      set((state) => ({
        characters: state.characters.map((c) =>
          c.id === characterId ? { ...c, ...updates } : c
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteCharacter: async (scriptId: string, characterId: string) => {
    try {
      await api.deleteCharacter(scriptId, characterId);
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== characterId),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearCharacters: () => {
    set({ characters: [], currentScriptId: null });
  },
}));
