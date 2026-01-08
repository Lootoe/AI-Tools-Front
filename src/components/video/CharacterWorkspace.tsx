import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Sparkles,
  Plus,
  Trash2,
  Wand2,
  Image as ImageIcon,
  Download,
  Upload,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Loading, InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCharacterStore } from '@/stores/characterStore';
import { generateCharacterDesign, uploadImage } from '@/services/api';
import { Character } from '@/types/video';

interface CharacterWorkspaceProps {
  scriptId: string;
}

// 单个角色卡片组件 - 重新设计
interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const isGenerating = character.status === 'generating';

  return (
    <div
      onClick={onSelect}
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: 'rgba(18,18,26,0.9)',
        border: '1px solid',
        borderColor: isSelected ? 'rgba(0,245,255,0.6)' : 'rgba(30,30,46,0.8)',
        boxShadow: isSelected
          ? '0 0 12px rgba(0,245,255,0.25), inset 0 0 20px rgba(0,245,255,0.05)'
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* 缩略图区域 */}
      <div
        className="aspect-square relative overflow-hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        {character.thumbnailUrl ? (
          <img
            src={character.thumbnailUrl}
            alt={character.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isGenerating ? (
              <InlineLoading size={20} color="#bf00ff" />
            ) : (
              <Users size={24} style={{ color: 'rgba(107,114,128,0.4)' }} />
            )}
          </div>
        )}

        {/* 生成中遮罩 */}
        {isGenerating && character.thumbnailUrl && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <InlineLoading size={20} color="#bf00ff" />
          </div>
        )}

        {/* 悬浮删除按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
          style={{
            backgroundColor: 'rgba(239,68,68,0.9)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          title="删除"
        >
          <Trash2 size={10} className="text-white" />
        </button>

        {/* 选中指示器 */}
        {isSelected && (
          <div
            className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#00f5ff',
              boxShadow: '0 0 6px rgba(0,245,255,0.8)',
            }}
          />
        )}
      </div>

      {/* 角色名称 - 底部居中，固定高度 */}
      <div className="px-1.5 py-1.5 text-center h-7 flex items-center justify-center">
        <span
          className="text-[10px] font-medium truncate"
          style={{ color: isSelected ? '#00f5ff' : '#d1d5db' }}
        >
          {character.name || '未命名'}
        </span>
      </div>
    </div>
  );
};

// 新建角色卡片 - 重新设计
const NewCharacterCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    className="rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
    style={{
      backgroundColor: 'rgba(18,18,26,0.5)',
      border: '1px dashed rgba(0,245,255,0.2)',
    }}
  >
    <div className="aspect-square flex flex-col items-center justify-center">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
          border: '1px solid rgba(0,245,255,0.2)',
        }}
      >
        <Plus size={16} style={{ color: '#00f5ff' }} />
      </div>
    </div>
    <div className="px-1.5 py-1.5 text-center h-7 flex items-center justify-center">
      <span className="text-[10px]" style={{ color: '#6b7280' }}>
        新建
      </span>
    </div>
  </div>
);

export const CharacterWorkspace: React.FC<CharacterWorkspaceProps> = ({ scriptId }) => {
  const { characters, isLoading, loadCharacters, addCharacter, updateCharacter, deleteCharacter } =
    useCharacterStore();
  const { showToast, ToastContainer } = useToast();

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; characterId: string | null; characterName: string }>({
    isOpen: false,
    characterId: null,
    characterName: '',
  });

  useEffect(() => {
    if (scriptId) {
      loadCharacters(scriptId);
    }
  }, [scriptId, loadCharacters]);

  useEffect(() => {
    const selected = characters.find((c) => c.id === selectedCharacterId);
    if (selected) {
      setEditDescription(selected.description || '');
      setEditName(selected.name || '');
    } else {
      setEditDescription('');
      setEditName('');
    }
  }, [selectedCharacterId, characters]);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
  const isProcessing = selectedCharacter?.status === 'generating' || isUploading;
  const hasDesignImage = !!selectedCharacter?.designImageUrl;

  const handleCreateCharacter = async () => {
    try {
      const characterId = await addCharacter(scriptId, '新角色', '');
      setSelectedCharacterId(characterId);
    } catch {
      // 错误由 API 层统一处理显示 toast
    }
  };

  const handleGenerateDesign = async () => {
    if (!selectedCharacter || !editDescription.trim() || isProcessing) return;

    await updateCharacter(scriptId, selectedCharacter.id, { status: 'generating' });

    try {
      // 调用后端角色设计稿生成接口，提示词模板在后端
      const response = await generateCharacterDesign(editDescription.trim());

      if (response.success && response.images.length > 0) {
        await updateCharacter(scriptId, selectedCharacter.id, {
          designImageUrl: response.images[0].url,
          thumbnailUrl: response.images[0].url,
          status: 'completed',
        });
        showToast('设计稿生成成功', 'success');
      } else {
        await updateCharacter(scriptId, selectedCharacter.id, { status: 'failed' });
      }
    } catch {
      await updateCharacter(scriptId, selectedCharacter.id, { status: 'failed' });
      // 错误由 API 层统一处理显示 toast
    }
  };

  const handleSave = async () => {
    if (!selectedCharacter || isSaving) return;
    setIsSaving(true);
    try {
      await updateCharacter(scriptId, selectedCharacter.id, {
        name: editName.trim() || '未命名角色',
        description: editDescription.trim(),
      });
      showToast('保存成功', 'success');
    } catch {
      // 错误由 API 层统一处理显示 toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCharacter || isProcessing) return;

    setIsUploading(true);

    try {
      const response = await uploadImage(file);
      if (response.success && response.url) {
        await updateCharacter(scriptId, selectedCharacter.id, {
          designImageUrl: response.url,
          thumbnailUrl: response.url,
          status: 'completed',
        });
        showToast('图片上传成功', 'success');
      }
    } catch {
      // 错误由 API 层统一处理显示 toast
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (character: Character) => {
    setDeleteConfirm({
      isOpen: true,
      characterId: character.id,
      characterName: character.name || '未命名角色',
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.characterId) {
      try {
        await deleteCharacter(scriptId, deleteConfirm.characterId);
        if (selectedCharacterId === deleteConfirm.characterId) {
          setSelectedCharacterId(null);
        }
        // 删除成功不需要 toast 提示
      } catch {
        // 错误由 API 层统一处理显示 toast
      }
    }
    setDeleteConfirm({ isOpen: false, characterId: null, characterName: '' });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, characterId: null, characterName: '' });
  };

  return (
    <>
      <ToastContainer />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="删除角色"
        message={`确定要删除角色「${deleteConfirm.characterName}」吗？此操作无法撤销。`}
        type="danger"
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
      {/* 左侧：角色池 - 3列网格 */}
      <div
        className="w-[280px] flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
        style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}
      >
        <div
          className="px-3 py-2.5 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid #1e1e2e' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,0,255,0.15))',
                border: '1px solid rgba(0,245,255,0.3)',
              }}
            >
              <Users size={12} style={{ color: '#00f5ff' }} />
            </div>
            <span className="text-xs font-medium text-white">角色池</span>
          </div>
          <span className="text-[10px]" style={{ color: '#6b7280' }}>
            {characters.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <InlineLoading size={18} color="#00f5ff" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <NewCharacterCard onClick={handleCreateCharacter} />
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isSelected={selectedCharacterId === character.id}
                  onSelect={() => setSelectedCharacterId(character.id)}
                  onDelete={() => handleDeleteClick(character)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：角色编辑器 */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {selectedCharacter ? (
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(191,0,255,0.15), rgba(255,0,255,0.15))',
                  border: '1px solid rgba(191,0,255,0.3)',
                }}
              >
                <Wand2 size={14} style={{ color: '#bf00ff' }} />
              </div>
              <span className="text-sm font-medium text-white">角色编辑器</span>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* 左侧：角色设定输入 */}
              <div
                className="w-[340px] flex-shrink-0 flex flex-col gap-3 rounded-xl p-4"
                style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}
              >
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>
                    角色名称
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="输入角色名称..."
                    className="h-9 text-sm"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>
                    角色设定
                  </label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="描述角色的外观、服装、风格等信息..."
                    className="flex-1 min-h-0 resize-none text-sm"
                  />
                </div>

                {/* 保存按钮 - 青色样式，带hover */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:shadow-[0_0_12px_rgba(0,245,255,0.2)]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,212,170,0.1))',
                    border: '1px solid rgba(0,245,255,0.3)',
                    color: '#00f5ff',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,212,170,0.2))';
                      e.currentTarget.style.borderColor = 'rgba(0,245,255,0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,212,170,0.1))';
                    e.currentTarget.style.borderColor = 'rgba(0,245,255,0.3)';
                  }}
                >
                  {isSaving ? (
                    <>
                      <InlineLoading size={16} color="#00f5ff" />
                      <span className="ml-2">保存中...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      保存角色信息
                    </>
                  )}
                </button>
              </div>

              {/* 右侧：设计稿展示区域 */}
              <div
                className="flex-1 flex flex-col rounded-xl overflow-hidden"
                style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}
              >
                {/* 展示区头部 */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between flex-shrink-0"
                  style={{ borderBottom: '1px solid #1e1e2e' }}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} style={{ color: '#00f5ff' }} />
                    <span className="text-sm font-medium text-white">角色设计稿</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 生成按钮 */}
                    <button
                      onClick={handleGenerateDesign}
                      disabled={isProcessing || !editDescription.trim()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                      style={{
                        background: isProcessing || !editDescription.trim()
                          ? 'rgba(191,0,255,0.1)'
                          : 'linear-gradient(135deg, rgba(191,0,255,0.2), rgba(255,0,255,0.2))',
                        border: '1px solid rgba(191,0,255,0.3)',
                        color: '#bf00ff',
                        opacity: isProcessing || !editDescription.trim() ? 0.5 : 1,
                        cursor: isProcessing || !editDescription.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Sparkles size={12} />
                      生成
                    </button>
                    {/* 上传按钮 */}
                    <button
                      onClick={() => !isProcessing && fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                      style={{
                        backgroundColor: 'rgba(107,114,128,0.15)',
                        border: '1px solid rgba(107,114,128,0.3)',
                        color: '#9ca3af',
                        opacity: isProcessing ? 0.5 : 1,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Upload size={12} />
                      上传
                    </button>
                    {/* 下载按钮 */}
                    {hasDesignImage && !isProcessing ? (
                      <a
                        href={selectedCharacter.designImageUrl}
                        download={`character-${selectedCharacter.name}-${Date.now()}.png`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors"
                        style={{
                          backgroundColor: 'rgba(0,245,255,0.1)',
                          border: '1px solid rgba(0,245,255,0.3)',
                          color: '#00f5ff',
                        }}
                      >
                        <Download size={12} />
                        下载
                      </a>
                    ) : (
                      <span
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                        style={{
                          backgroundColor: 'rgba(107,114,128,0.1)',
                          border: '1px solid rgba(107,114,128,0.2)',
                          color: '#6b7280',
                          opacity: 0.5,
                        }}
                      >
                        <Download size={12} />
                        下载
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                </div>

                {/* 设计稿展示 */}
                <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
                  {isProcessing && (
                    <Loading
                      overlay
                      size={28}
                      color="#bf00ff"
                      text={isUploading ? '正在上传...' : '正在生成设计稿...'}
                    />
                  )}

                  {selectedCharacter.designImageUrl ? (
                    <img
                      src={selectedCharacter.designImageUrl}
                      alt="角色设计稿"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      style={{ boxShadow: '0 0 30px rgba(0,245,255,0.1)' }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(191,0,255,0.05))',
                          border: '1px solid rgba(0,245,255,0.1)',
                        }}
                      >
                        <ImageIcon size={32} style={{ color: 'rgba(0,245,255,0.3)' }} />
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: '#6b7280' }}>
                          点击"生成"或"上传"添加角色设计稿
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                          AI生成将包含多角度、多表情、多穿搭的设计参考图
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
                  border: '1px solid rgba(0,245,255,0.2)',
                }}
              >
                <Users size={36} style={{ color: 'rgba(0,245,255,0.5)' }} />
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #ff00ff, #bf00ff)',
                  boxShadow: '0 0 10px rgba(255,0,255,0.5)',
                }}
              >
                <Sparkles size={12} className="text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">选择或创建角色</h3>
            <p className="text-sm max-w-md mb-4" style={{ color: '#6b7280' }}>
              从左侧角色池选择一个角色进行编辑，或点击"新建"创建新角色
            </p>
            <Button
              onClick={handleCreateCharacter}
              className="h-10 px-6"
              style={{ background: 'linear-gradient(135deg, #00f5ff, #00d4aa)' }}
            >
              <Plus size={16} className="mr-2" />
              新建角色
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
