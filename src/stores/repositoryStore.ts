import { create } from 'zustand';
import { AssetCategory, SavedAsset } from '@/types/canvas';
import * as repositoryApi from '@/services/repositoryApi';

interface RepositoryState {
  // 状态
  categories: AssetCategory[];
  selectedCategoryId: string | null;
  assets: SavedAsset[];
  isLoading: boolean;
  error: string | null;
  currentScriptId: string | null;

  // 分类操作
  loadCategories: (scriptId: string) => Promise<void>;
  createCategory: (name: string) => Promise<string>;
  deleteCategory: (categoryId: string) => Promise<void>;
  selectCategory: (categoryId: string | null) => void;

  // 资产操作
  loadAssets: (categoryId: string) => Promise<void>;
  saveAsset: (categoryId: string, imageUrl: string, name?: string, sourceNodeId?: string) => Promise<string>;
  deleteAsset: (assetId: string) => Promise<void>;

  // 辅助方法
  clearRepository: () => void;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  // 初始状态
  categories: [],
  selectedCategoryId: null,
  assets: [],
  isLoading: false,
  error: null,
  currentScriptId: null,

  // 加载分类列表
  loadCategories: async (scriptId: string) => {
    set({ isLoading: true, error: null, currentScriptId: scriptId });
    try {
      const categories = await repositoryApi.fetchCategories(scriptId);
      set({
        categories,
        isLoading: false,
        // 如果有分类且没有选中的分类，自动选中第一个
        selectedCategoryId: categories.length > 0 && !get().selectedCategoryId
          ? categories[0].id
          : get().selectedCategoryId,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 创建分类
  createCategory: async (name: string) => {
    const { currentScriptId } = get();
    if (!currentScriptId) throw new Error('未选择脚本');

    try {
      const newCategory = await repositoryApi.createCategory(currentScriptId, name);
      set((state) => ({
        categories: [...state.categories, newCategory],
        // 如果是第一个分类，自动选中
        selectedCategoryId: state.categories.length === 0 ? newCategory.id : state.selectedCategoryId,
      }));
      return newCategory.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 删除分类
  deleteCategory: async (categoryId: string) => {
    const { currentScriptId, selectedCategoryId } = get();
    if (!currentScriptId) return;

    // 乐观更新
    set((state) => {
      const newCategories = state.categories.filter((c) => c.id !== categoryId);
      return {
        categories: newCategories,
        // 如果删除的是当前选中的分类，选中第一个或清空
        selectedCategoryId: selectedCategoryId === categoryId
          ? (newCategories.length > 0 ? newCategories[0].id : null)
          : selectedCategoryId,
        // 如果删除的是当前选中的分类，清空资产列表
        assets: selectedCategoryId === categoryId ? [] : state.assets,
      };
    });

    try {
      await repositoryApi.deleteCategory(currentScriptId, categoryId);
    } catch (error) {
      // 回滚：重新加载分类
      await get().loadCategories(currentScriptId);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 选择分类
  selectCategory: (categoryId: string | null) => {
    set({ selectedCategoryId: categoryId, assets: [] });
    // 如果选中了分类，自动加载该分类下的资产
    if (categoryId) {
      get().loadAssets(categoryId);
    }
  },

  // 加载分类下的资产
  loadAssets: async (categoryId: string) => {
    const { currentScriptId } = get();
    if (!currentScriptId) return;

    set({ isLoading: true, error: null });
    try {
      const assets = await repositoryApi.fetchAssets(currentScriptId, categoryId);
      set({ assets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 保存资产到分类
  saveAsset: async (categoryId: string, imageUrl: string, name?: string, sourceNodeId?: string) => {
    const { currentScriptId } = get();
    if (!currentScriptId) throw new Error('未选择脚本');

    try {
      const newAsset = await repositoryApi.saveAsset(currentScriptId, categoryId, {
        imageUrl,
        name,
        sourceNodeId,
      });
      
      // 如果保存到当前选中的分类，更新资产列表
      const { selectedCategoryId } = get();
      if (selectedCategoryId === categoryId) {
        set((state) => ({ assets: [...state.assets, newAsset] }));
      }
      
      return newAsset.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 删除资产
  deleteAsset: async (assetId: string) => {
    const { currentScriptId } = get();
    if (!currentScriptId) return;

    // 乐观更新
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== assetId),
    }));

    try {
      await repositoryApi.deleteAsset(currentScriptId, assetId);
    } catch (error) {
      // 回滚：重新加载资产
      const { selectedCategoryId } = get();
      if (selectedCategoryId) {
        await get().loadAssets(selectedCategoryId);
      }
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // 清空仓库状态
  clearRepository: () => {
    set({
      categories: [],
      selectedCategoryId: null,
      assets: [],
      currentScriptId: null,
      error: null,
    });
  },
}));
