import { Character } from '@/types/video';

// 角色显示状态
export type CharacterDisplayStatus = 
  | 'verified'      // 已认证
  | 'pending_verify' // 待认证（视频已生成但未注册）
  | 'generating'    // 生成中
  | 'pending'       // 待生成
  | 'failed';       // 失败

// 状态配置
interface StatusConfig {
  label: string;
  bgClass: string;
  textClass: string;
}

const STATUS_CONFIG: Record<CharacterDisplayStatus, StatusConfig> = {
  verified: {
    label: '已认证',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-600 dark:text-green-400',
  },
  pending_verify: {
    label: '待认证',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-600 dark:text-yellow-400',
  },
  generating: {
    label: '生成中',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  pending: {
    label: '待生成',
    bgClass: 'bg-gray-100 dark:bg-gray-700',
    textClass: 'text-gray-500 dark:text-gray-400',
  },
  failed: {
    label: '失败',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-600 dark:text-red-400',
  },
};

/**
 * 获取角色的显示状态
 */
export function getCharacterDisplayStatus(character: Character): CharacterDisplayStatus {
  // 已有 Sora2 角色ID，表示已认证
  if (character.characterId) {
    return 'verified';
  }
  
  // 视频已生成但未注册
  if (character.status === 'completed') {
    return 'pending_verify';
  }
  
  // 其他状态直接映射
  if (character.status === 'generating') {
    return 'generating';
  }
  
  if (character.status === 'failed') {
    return 'failed';
  }
  
  return 'pending';
}

/**
 * 获取角色状态标签
 */
export function getCharacterStatusLabel(character: Character): string {
  const status = getCharacterDisplayStatus(character);
  return STATUS_CONFIG[status].label;
}

/**
 * 获取角色状态样式类
 */
export function getCharacterStatusClasses(character: Character): string {
  const status = getCharacterDisplayStatus(character);
  const config = STATUS_CONFIG[status];
  return `${config.bgClass} ${config.textClass}`;
}

/**
 * 获取完整的状态配置
 */
export function getCharacterStatusConfig(character: Character): StatusConfig {
  const status = getCharacterDisplayStatus(character);
  return STATUS_CONFIG[status];
}
