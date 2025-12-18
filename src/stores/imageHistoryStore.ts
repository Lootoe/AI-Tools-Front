import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 单条历史记录
export interface ImageHistoryItem {
  id: string;
  createdAt: number;
  // 生成参数
  prompt: string;
  positiveTags: string[];
  negativeTags: string[];
  model: string;
  aspectRatio: string;
  imageSize: string;
  referenceImages: string[];
  // 生成结果
  generatedImages: string[];
}

interface ImageHistoryState {
  history: ImageHistoryItem[];
  addHistory: (item: Omit<ImageHistoryItem, 'id' | 'createdAt'>) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  getHistory: (id: string) => ImageHistoryItem | undefined;
}

export const useImageHistoryStore = create<ImageHistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      addHistory: (item) => {
        const newItem: ImageHistoryItem = {
          ...item,
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
        };
        set((state) => ({
          history: [newItem, ...state.history].slice(0, 100), // 最多保留100条
        }));
      },

      removeHistory: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      getHistory: (id) => {
        return get().history.find((item) => item.id === id);
      },
    }),
    {
      name: 'ai-tools-image-history',
    }
  )
);
