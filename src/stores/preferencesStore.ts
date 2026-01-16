import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 分镜视频偏好
export interface VideoPreferences {
  aspectRatio: '16:9' | '9:16';
  duration: '10' | '15';
}

// 资产偏好
export interface AssetPreferences {
  aspectRatio: '1:1' | '4:3' | '16:9';
  model: string;
  imageSize: '1K' | '2K'; // 图片质量
}

// 角色视频偏好
export interface CharacterPreferences {
  aspectRatio: '16:9' | '9:16';
  duration: '10' | '15';
}

export interface PreferencesState {
  video: VideoPreferences;
  asset: AssetPreferences;
  character: CharacterPreferences;
  setVideoPreferences: (prefs: Partial<VideoPreferences>) => void;
  setAssetPreferences: (prefs: Partial<AssetPreferences>) => void;
  setCharacterPreferences: (prefs: Partial<CharacterPreferences>) => void;
}

const DEFAULT_VIDEO: VideoPreferences = {
  aspectRatio: '16:9',
  duration: '10',
};

const DEFAULT_ASSET: AssetPreferences = {
  aspectRatio: '16:9',
  model: 'nano-banana-2',
  imageSize: '1K',
};

const DEFAULT_CHARACTER: CharacterPreferences = {
  aspectRatio: '16:9',
  duration: '10',
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      video: DEFAULT_VIDEO,
      asset: DEFAULT_ASSET,
      character: DEFAULT_CHARACTER,
      setVideoPreferences: (prefs) =>
        set((state) => ({ video: { ...state.video, ...prefs } })),
      setAssetPreferences: (prefs) =>
        set((state) => ({ asset: { ...state.asset, ...prefs } })),
      setCharacterPreferences: (prefs) =>
        set((state) => ({ character: { ...state.character, ...prefs } })),
    }),
    {
      name: 'miaoxiang-preferences',
    }
  )
);
