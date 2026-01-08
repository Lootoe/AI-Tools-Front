import React, { useState } from 'react';
import { Users, Mountain, Box, Plus, X } from 'lucide-react';
import { Storyboard, Character, Scene, Prop } from '@/types/video';
import { useCharacterStore } from '@/stores/characterStore';
import { useSceneStore } from '@/stores/sceneStore';
import { usePropStore } from '@/stores/propStore';

interface StoryboardAssetsPanelProps {
  storyboard: Storyboard | null;
  localLinkedCharacterIds: string[];
  localLinkedSceneIds: string[];
  localLinkedPropIds: string[];
  onUpdateLinkedAssets?: (
    characterIds: string[],
    sceneIds: string[],
    propIds: string[]
  ) => void;
}

// 资产选择弹框
interface AssetSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  assets: Array<{ id: string; name: string; imageUrl?: string }>;
  selectedIds: string[];
  onConfirm: (selectedIds: string[]) => void;
}

const AssetSelectModal: React.FC<AssetSelectModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  accentColor,
  assets,
  selectedIds,
  onConfirm,
}) => {
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  React.useEffect(() => {
    setLocalSelectedIds(selectedIds);
  }, [selectedIds, isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-[520px] max-h-[75vh] rounded-xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#0a0a0f',
          border: `1px solid ${accentColor}40`,
          boxShadow: `0 0 30px ${accentColor}20`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid #1e1e2e' }}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium" style={{ color: accentColor }}>
              选择{title}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              已选 {localSelectedIds.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-colors hover:bg-white/10">
            <X size={16} style={{ color: '#6b7280' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 cyber-scrollbar">
          {assets.length > 0 ? (
            <div className="grid grid-cols-5 gap-2.5">
              {assets.map((asset) => {
                const isSelected = localSelectedIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset.id)}
                    className="relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: 'rgba(18,18,26,0.9)',
                      border: isSelected ? `2px solid ${accentColor}` : '1px solid rgba(30,30,46,0.8)',
                      boxShadow: isSelected ? `0 0 10px ${accentColor}40` : 'none',
                    }}
                  >
                    <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                      {asset.imageUrl ? (
                        <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs" style={{ color: '#4b5563' }}>无图</span>
                        </div>
                      )}
                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: accentColor }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1.5 text-center">
                      <span className="text-xs truncate block" style={{ color: isSelected ? accentColor : '#d1d5db' }}>
                        {asset.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-sm" style={{ color: '#4b5563' }}>暂无可用{title}（需先生成设计稿）</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid #1e1e2e' }}>
          <button onClick={onClose} className="px-4 py-1.5 rounded text-xs transition-colors" style={{ color: '#9ca3af', border: '1px solid #374151' }}>
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}50` }}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
};


// 已关联资产网格卡片
interface LinkedAssetCardProps {
  name: string;
  imageUrl?: string;
  onRemove: () => void;
}

const LinkedAssetCard: React.FC<LinkedAssetCardProps> = ({ name, imageUrl, onRemove }) => {
  return (
    <div
      className="relative rounded-lg overflow-hidden group transition-all hover:scale-[1.02]"
      style={{ backgroundColor: 'rgba(18,18,26,0.9)', border: '1px solid rgba(30,30,46,0.8)' }}
    >
      <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs" style={{ color: '#4b5563' }}>无图</span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all"
          style={{ backgroundColor: 'rgba(239,68,68,0.9)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          <X size={10} className="text-white" />
        </button>
      </div>
      <div className="px-1 py-1 text-center h-5 flex items-center justify-center">
        <span className="text-[10px] font-medium truncate" style={{ color: '#d1d5db' }}>{name}</span>
      </div>
    </div>
  );
};

// 添加资产按钮
interface AddAssetButtonProps {
  onClick: () => void;
  accentColor: string;
}

const AddAssetButton: React.FC<AddAssetButtonProps> = ({ onClick, accentColor }) => {
  return (
    <div
      onClick={onClick}
      className="rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
      style={{ backgroundColor: 'rgba(18,18,26,0.5)', border: `1px dashed ${accentColor}30` }}
    >
      <div className="aspect-square flex items-center justify-center">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
          style={{ background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}10)`, border: `1px solid ${accentColor}30` }}
        >
          <Plus size={12} style={{ color: accentColor }} />
        </div>
      </div>
      <div className="px-1 py-1 text-center h-5 flex items-center justify-center">
        <span className="text-[10px]" style={{ color: '#6b7280' }}>添加</span>
      </div>
    </div>
  );
};

export const StoryboardAssetsPanel: React.FC<StoryboardAssetsPanelProps> = ({ storyboard, localLinkedCharacterIds, localLinkedSceneIds, localLinkedPropIds, onUpdateLinkedAssets }) => {
  const { characters } = useCharacterStore();
  const { scenes } = useSceneStore();
  const { props } = usePropStore();
  const [modalType, setModalType] = useState<'character' | 'scene' | 'prop' | null>(null);

  if (!storyboard) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-center" style={{ color: '#6b7280' }}>选择分镜查看关联资产</p>
      </div>
    );
  }

  // 使用传入的本地状态
  const linkedCharacterIds = localLinkedCharacterIds;
  const linkedSceneIds = localLinkedSceneIds;
  const linkedPropIds = localLinkedPropIds;

  const availableCharacters = characters.filter((c) => c.designImageUrl && c.status === 'completed');
  const availableScenes = scenes.filter((s) => s.designImageUrl && s.status === 'completed');
  const availableProps = props.filter((p) => p.designImageUrl && p.status === 'completed');

  const linkedCharacters = linkedCharacterIds.map((id) => characters.find((c) => c.id === id)).filter(Boolean) as Character[];
  const linkedScenes = linkedSceneIds.map((id) => scenes.find((s) => s.id === id)).filter(Boolean) as Scene[];
  const linkedProps = linkedPropIds.map((id) => props.find((p) => p.id === id)).filter(Boolean) as Prop[];

  const handleConfirmCharacters = (ids: string[]) => onUpdateLinkedAssets?.(ids, linkedSceneIds, linkedPropIds);
  const handleConfirmScenes = (ids: string[]) => onUpdateLinkedAssets?.(linkedCharacterIds, ids, linkedPropIds);
  const handleConfirmProps = (ids: string[]) => onUpdateLinkedAssets?.(linkedCharacterIds, linkedSceneIds, ids);

  const handleRemoveCharacter = (id: string) => onUpdateLinkedAssets?.(linkedCharacterIds.filter((i) => i !== id), linkedSceneIds, linkedPropIds);
  const handleRemoveScene = (id: string) => onUpdateLinkedAssets?.(linkedCharacterIds, linkedSceneIds.filter((i) => i !== id), linkedPropIds);
  const handleRemoveProp = (id: string) => onUpdateLinkedAssets?.(linkedCharacterIds, linkedSceneIds, linkedPropIds.filter((i) => i !== id));

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 cyber-scrollbar">
        {/* 角色 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} style={{ color: '#bf00ff' }} />
            <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>角色</span>
            {linkedCharacters.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(191,0,255,0.2)', color: '#bf00ff' }}>
                {linkedCharacters.length}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {linkedCharacters.map((char) => (
              <LinkedAssetCard key={char.id} name={char.name} imageUrl={char.designImageUrl} onRemove={() => handleRemoveCharacter(char.id)} />
            ))}
            <AddAssetButton onClick={() => setModalType('character')} accentColor="#bf00ff" />
          </div>
        </div>

        {/* 场景 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mountain size={14} style={{ color: '#ff9500' }} />
            <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>场景</span>
            {linkedScenes.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,149,0,0.2)', color: '#ff9500' }}>
                {linkedScenes.length}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {linkedScenes.map((scene) => (
              <LinkedAssetCard key={scene.id} name={scene.name} imageUrl={scene.designImageUrl} onRemove={() => handleRemoveScene(scene.id)} />
            ))}
            <AddAssetButton onClick={() => setModalType('scene')} accentColor="#ff9500" />
          </div>
        </div>

        {/* 物品 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Box size={14} style={{ color: '#00ff9d' }} />
            <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>物品</span>
            {linkedProps.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,255,157,0.2)', color: '#00ff9d' }}>
                {linkedProps.length}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {linkedProps.map((prop) => (
              <LinkedAssetCard key={prop.id} name={prop.name} imageUrl={prop.designImageUrl} onRemove={() => handleRemoveProp(prop.id)} />
            ))}
            <AddAssetButton onClick={() => setModalType('prop')} accentColor="#00ff9d" />
          </div>
        </div>
      </div>

      <AssetSelectModal
        isOpen={modalType === 'character'}
        onClose={() => setModalType(null)}
        title="角色"
        icon={<Users size={16} style={{ color: '#bf00ff' }} />}
        accentColor="#bf00ff"
        assets={availableCharacters.map((c) => ({ id: c.id, name: c.name, imageUrl: c.designImageUrl }))}
        selectedIds={linkedCharacterIds}
        onConfirm={handleConfirmCharacters}
      />
      <AssetSelectModal
        isOpen={modalType === 'scene'}
        onClose={() => setModalType(null)}
        title="场景"
        icon={<Mountain size={16} style={{ color: '#ff9500' }} />}
        accentColor="#ff9500"
        assets={availableScenes.map((s) => ({ id: s.id, name: s.name, imageUrl: s.designImageUrl }))}
        selectedIds={linkedSceneIds}
        onConfirm={handleConfirmScenes}
      />
      <AssetSelectModal
        isOpen={modalType === 'prop'}
        onClose={() => setModalType(null)}
        title="物品"
        icon={<Box size={16} style={{ color: '#00ff9d' }} />}
        accentColor="#00ff9d"
        assets={availableProps.map((p) => ({ id: p.id, name: p.name, imageUrl: p.designImageUrl }))}
        selectedIds={linkedPropIds}
        onConfirm={handleConfirmProps}
      />
    </>
  );
};
