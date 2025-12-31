import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, Users, Settings, Image, Upload, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Character } from '@/types/video';
import { cn } from '@/utils/cn';

interface StoryboardSettingsModalProps {
  description: string;
  characters: Character[];
  selectedCharacterIds: string[];
  referenceImageUrls?: string[];
  aspectRatio?: string;
  duration?: string;
  onSave: (data: {
    description: string;
    characterIds: string[];
    referenceImageUrls?: string[];
    aspectRatio: string;
    duration: string;
  }) => void;
  onClose: () => void;
}

export const StoryboardSettingsModal: React.FC<StoryboardSettingsModalProps> = ({
  description,
  characters,
  selectedCharacterIds,
  referenceImageUrls = [],
  aspectRatio = '9:16',
  duration = '15',
  onSave,
  onClose,
}) => {
  const [text, setText] = useState(description);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCharacterIds);
  const [refImageUrls, setRefImageUrls] = useState<string[]>(referenceImageUrls);
  const [ratio, setRatio] = useState(aspectRatio);
  const [dur, setDur] = useState(duration);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 使用 ref 来追踪上一次的 props，避免数组引用导致的无限循环
  const prevPropsRef = useRef({
    description,
    selectedCharacterIds: JSON.stringify(selectedCharacterIds),
    referenceImageUrls: JSON.stringify(referenceImageUrls),
    aspectRatio,
    duration,
  });

  useEffect(() => {
    const currentProps = {
      description,
      selectedCharacterIds: JSON.stringify(selectedCharacterIds),
      referenceImageUrls: JSON.stringify(referenceImageUrls),
      aspectRatio,
      duration,
    };

    // 只在 props 真正改变时才更新状态
    if (JSON.stringify(prevPropsRef.current) !== JSON.stringify(currentProps)) {
      setText(description);
      setSelectedIds(selectedCharacterIds);
      setRefImageUrls(referenceImageUrls);
      setRatio(aspectRatio);
      setDur(duration);
      prevPropsRef.current = currentProps;
    }
  }, [description, selectedCharacterIds, referenceImageUrls, aspectRatio, duration]);

  const handleAddCharacter = (characterId: string) => {
    if (characterId && !selectedIds.includes(characterId)) {
      setSelectedIds([...selectedIds, characterId]);
      setShowCharacterDropdown(false);
    }
  };

  const handleRemoveCharacter = (characterId: string) => {
    setSelectedIds(selectedIds.filter((id) => id !== characterId));
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCharacterDropdown(false);
      }
    };

    if (showCharacterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCharacterDropdown]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newUrls: string[] = [];
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        newUrls.push(url);
      });
      setRefImageUrls([...refImageUrls, ...newUrls]);
      // TODO: 实际项目中需要上传到服务器并获取真实URL
    }
  };

  const handleRemoveImage = (index: number) => {
    const urlToRemove = refImageUrls[index];
    if (urlToRemove) {
      URL.revokeObjectURL(urlToRemove);
    }
    setRefImageUrls(refImageUrls.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      description: text.trim(),
      characterIds: selectedIds,
      referenceImageUrls: refImageUrls.length > 0 ? refImageUrls : undefined,
      aspectRatio: ratio,
      duration: dur,
    });
    onClose();
  };

  // 获取未选中的角色列表
  const availableCharacters = characters.filter((char) => !selectedIds.includes(char.id));
  const selectedCharacters = selectedIds
    .map((id) => characters.find((char) => char.id === id))
    .filter((char): char is Character => !!char);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden m-4 max-h-[85vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            分镜配置
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区 - 三栏布局 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左侧 - 脚本编辑 */}
          <div className="flex-1 overflow-y-auto p-5 border-r border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-purple-500" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                分镜脚本
              </h4>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="详细描述这个分镜的场景、动作、对话、镜头运动等..."
              className="h-[400px] resize-none"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-2">
              提示：详细的分镜描述有助于生成更准确的视频
            </p>
          </div>

          {/* 中间 - 关联角色 */}
          <div className="w-72 overflow-y-auto p-5 border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
            {/* 关联角色 */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-purple-500" />
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    关联角色
                  </h4>
                  <span className="text-xs text-gray-400">({selectedIds.length})</span>
                </div>
              </div>

              {/* 已选角色列表 - 网格布局，每行3个，带滚动 */}
              {selectedCharacters.length > 0 && (
                <div className="max-h-[320px] overflow-y-auto mb-2.5 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div className="grid grid-cols-3 gap-1.5">
                    {selectedCharacters.map((char) => (
                      <div
                        key={char.id}
                        className="relative flex flex-col items-center gap-1 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                      >
                        {/* 删除按钮 */}
                        <button
                          onClick={() => handleRemoveCharacter(char.id)}
                          className="absolute top-0.5 right-0.5 p-0.5 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-800 rounded-full"
                        >
                          <X size={10} />
                        </button>

                        {/* 头像 */}
                        {char.thumbnailUrl ? (
                          <img
                            src={char.thumbnailUrl}
                            alt={char.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                            {char.name.charAt(0)}
                          </div>
                        )}

                        {/* 名字 */}
                        <span className="text-xs text-gray-700 dark:text-gray-300 text-center truncate w-full px-1">
                          {char.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 添加角色下拉框 */}
              {characters.length === 0 ? (
                <div className="text-center py-3 text-gray-400 dark:text-gray-500 text-xs bg-white dark:bg-gray-800 rounded-lg">
                  暂无角色
                </div>
              ) : availableCharacters.length > 0 ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowCharacterDropdown(!showCharacterDropdown)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:border-purple-400 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus size={14} />
                      选择角色添加...
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'transition-transform',
                        showCharacterDropdown && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* 下拉列表 */}
                  {showCharacterDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
                      {availableCharacters.map((char) => (
                        <button
                          key={char.id}
                          onClick={() => handleAddCharacter(char.id)}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                        >
                          {/* 头像 */}
                          {char.thumbnailUrl ? (
                            <img
                              src={char.thumbnailUrl}
                              alt={char.name}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {char.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-gray-700 dark:text-gray-300 truncate">
                            {char.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-2 text-gray-400 dark:text-gray-500 text-xs bg-white dark:bg-gray-800 rounded-lg">
                  所有角色已添加
                </div>
              )}
            </div>
          </div>

          {/* 右侧 - 参考图和视频设置 */}
          <div className="w-72 overflow-y-auto p-5 bg-white dark:bg-gray-800 space-y-4">
            {/* 参考图上传 */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Image size={14} className="text-purple-500" />
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    参考图
                  </h4>
                  {refImageUrls.length > 0 && (
                    <span className="text-xs text-gray-400">({refImageUrls.length})</span>
                  )}
                </div>
              </div>

              {/* 已上传图片网格 */}
              {refImageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {refImageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`参考图 ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 上传按钮 */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
                >
                  <Upload size={16} />
                  <span className="text-xs">点击上传参考图</span>
                </button>
              </div>
            </div>

            {/* 视频设置 */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={14} className="text-purple-500" />
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  视频设置
                </h4>
              </div>

              {/* 比例选择 */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  比例
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRatio('9:16')}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg border transition-colors text-xs font-medium',
                      ratio === '9:16'
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400'
                    )}
                  >
                    9:16
                  </button>
                  <button
                    onClick={() => setRatio('16:9')}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg border transition-colors text-xs font-medium',
                      ratio === '16:9'
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400'
                    )}
                  >
                    16:9
                  </button>
                </div>
              </div>

              {/* 时长选择 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  时长
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDur('10')}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg border transition-colors text-xs font-medium',
                      dur === '10'
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400'
                    )}
                  >
                    10秒
                  </button>
                  <button
                    onClick={() => setDur('15')}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg border transition-colors text-xs font-medium',
                      dur === '15'
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400'
                    )}
                  >
                    15秒
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <Button size="sm" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save size={14} className="mr-1.5" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};
