import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ImagePlus,
  Wand2,
  Download,
  Trash2,
  Loader2,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Tags,
  X,
  Ban,
  Cpu,
  RatioIcon,
  ChevronDown,
  Check,
  Upload,
  Plus,
  FolderPlus,
  PlusCircle,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { generateImage, uploadBase64Image } from '@/services/api';
import { ImageHistoryPanel } from '@/components/image/ImageHistoryPanel';
import { useImageHistoryStore, ImageHistoryItem } from '@/stores/imageHistoryStore';

// 自定义下拉组件
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  icon?: React.ReactNode;
  label: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  icon,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 检测是否需要向上展开
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = options.length * 44 + 8; // 每个选项约44px + padding
      setDropUp(spaceBelow < dropdownHeight);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <label className="flex items-center text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
        {icon}
        {label}
      </label>
      <div ref={selectRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="w-full h-10 pl-3 pr-8 text-sm text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all hover:border-orange-300 dark:hover:border-orange-500/50 flex items-center"
        >
          <span className="truncate">{selectedOption?.label}</span>
          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            className={`absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden ${
              dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2.5 text-sm text-left flex items-center justify-between transition-colors ${
                  option.value === value
                    ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="w-4 h-4 text-orange-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 标签分类类型
interface TagCategory {
  name: string;
  tags: string[];
}

// 默认正向标签分类数据
const DEFAULT_TAG_CATEGORIES: TagCategory[] = [
  {
    name: '主题',
    tags: ['风景', '人物', '动物', '建筑', '美食', '科幻', '奇幻', '抽象']
  },
  {
    name: '风格',
    tags: ['写实', '动漫', '油画', '水彩', '素描', '像素', '3D', '扁平']
  },
  {
    name: '光影',
    tags: ['自然光', '黄金时刻', '蓝调时刻', '霓虹灯', '柔光', '逆光', '戏剧光']
  },
  {
    name: '氛围',
    tags: ['温馨', '神秘', '浪漫', '恐怖', '欢快', '忧郁', '史诗', '宁静']
  },
  {
    name: '质量',
    tags: ['高清', '4K', '8K', '超细节', '杰作', '专业', '精致']
  }
];

// 默认负面标签分类数据
const DEFAULT_NEGATIVE_TAG_CATEGORIES: TagCategory[] = [
  {
    name: '质量问题',
    tags: ['模糊', '低质量', '像素化', '噪点', '过曝', '欠曝', '畸变']
  },
  {
    name: '人物问题',
    tags: ['多余肢体', '变形', '不自然姿势', '错误比例', '面部扭曲']
  },
  {
    name: '画面问题',
    tags: ['水印', '文字', '边框', '裁切', '重复元素', '杂乱背景']
  }
];

// localStorage keys
const STORAGE_KEY_TAGS = 'ai-tools-tag-categories';
const STORAGE_KEY_NEGATIVE_TAGS = 'ai-tools-negative-tag-categories';

// 从 localStorage 加载标签分类
const loadTagCategories = (key: string, defaults: TagCategory[]): TagCategory[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load tag categories:', e);
  }
  return defaults;
};

// 保存标签分类到 localStorage
const saveTagCategories = (key: string, categories: TagCategory[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save tag categories:', e);
  }
};

// 宽高比选项
const ASPECT_RATIOS = [
  { label: '1:1 正方形', value: '1:1' },
  { label: '4:3 横屏', value: '4:3' },
  { label: '3:4 竖屏', value: '3:4' },
  { label: '16:9 宽屏', value: '16:9' },
  { label: '9:16 手机屏', value: '9:16' },
  { label: '2:3 海报', value: '2:3' },
  { label: '3:2 照片', value: '3:2' },
  { label: '4:5 社交', value: '4:5' },
  { label: '5:4 打印', value: '5:4' },
  { label: '21:9 超宽', value: '21:9' },
];

// 模型选项
const MODELS = [
  { label: 'Nano Banana 2 4K', value: 'nano-banana-2-4k' },
  { label: '豆包 Seedream 4.0', value: 'doubao-seedream-4-0-250828' },
];

// 清晰度选项（仅 nano-banana-2 系列支持）
const IMAGE_SIZES = [
  { label: '1K', value: '1K' },
  { label: '2K', value: '2K' },
  { label: '4K', value: '4K' },
];

export const TextToImagePage: React.FC = () => {
  // 状态管理
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0].value);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);
  const [selectedImageSize, setSelectedImageSize] = useState(IMAGE_SIZES[1].value); // 默认2K
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNegativeTags, setSelectedNegativeTags] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 历史记录面板状态
  const [showHistory, setShowHistory] = useState(true);
  const { addHistory } = useImageHistoryStore();

  // 标签分类状态（支持自定义）
  const [tagCategories, setTagCategories] = useState<TagCategory[]>(() =>
    loadTagCategories(STORAGE_KEY_TAGS, DEFAULT_TAG_CATEGORIES)
  );
  const [negativeTagCategories, setNegativeTagCategories] = useState<TagCategory[]>(() =>
    loadTagCategories(STORAGE_KEY_NEGATIVE_TAGS, DEFAULT_NEGATIVE_TAG_CATEGORIES)
  );

  // 新建分类/标签的输入状态
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newNegativeCategoryName, setNewNegativeCategoryName] = useState('');
  const [addingTagToCategory, setAddingTagToCategory] = useState<string | null>(null);
  const [addingTagToNegativeCategory, setAddingTagToNegativeCategory] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');

  // 参考图上传 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成的图片列表
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // 加载历史记录参数
  const handleLoadHistory = useCallback((item: ImageHistoryItem) => {
    setPrompt(item.prompt);
    setSelectedTags(item.positiveTags);
    setSelectedNegativeTags(item.negativeTags);
    setSelectedModel(item.model);
    setSelectedRatio(item.aspectRatio);
    setSelectedImageSize(item.imageSize);
    setReferenceImages(item.referenceImages);
    setGeneratedImages(item.generatedImages);
  }, []);

  // 新建正向分类
  const handleAddCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name || tagCategories.some(c => c.name === name)) return;
    const updated = [...tagCategories, { name, tags: [] }];
    setTagCategories(updated);
    saveTagCategories(STORAGE_KEY_TAGS, updated);
    setNewCategoryName('');
  }, [newCategoryName, tagCategories]);

  // 新建负面分类
  const handleAddNegativeCategory = useCallback(() => {
    const name = newNegativeCategoryName.trim();
    if (!name || negativeTagCategories.some(c => c.name === name)) return;
    const updated = [...negativeTagCategories, { name, tags: [] }];
    setNegativeTagCategories(updated);
    saveTagCategories(STORAGE_KEY_NEGATIVE_TAGS, updated);
    setNewNegativeCategoryName('');
  }, [newNegativeCategoryName, negativeTagCategories]);

  // 在正向分类下新建标签
  const handleAddTagToCategory = useCallback((categoryName: string) => {
    const tag = newTagName.trim();
    if (!tag) return;
    const updated = tagCategories.map(c => {
      if (c.name === categoryName && !c.tags.includes(tag)) {
        return { ...c, tags: [...c.tags, tag] };
      }
      return c;
    });
    setTagCategories(updated);
    saveTagCategories(STORAGE_KEY_TAGS, updated);
    setNewTagName('');
    setAddingTagToCategory(null);
  }, [newTagName, tagCategories]);

  // 在负面分类下新建标签
  const handleAddTagToNegativeCategory = useCallback((categoryName: string) => {
    const tag = newTagName.trim();
    if (!tag) return;
    const updated = negativeTagCategories.map(c => {
      if (c.name === categoryName && !c.tags.includes(tag)) {
        return { ...c, tags: [...c.tags, tag] };
      }
      return c;
    });
    setNegativeTagCategories(updated);
    saveTagCategories(STORAGE_KEY_NEGATIVE_TAGS, updated);
    setNewTagName('');
    setAddingTagToNegativeCategory(null);
  }, [newTagName, negativeTagCategories]);

  // 正向标签点击处理
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 负面标签点击处理
  const handleNegativeTagClick = (tag: string) => {
    if (selectedNegativeTags.includes(tag)) {
      setSelectedNegativeTags(selectedNegativeTags.filter((t) => t !== tag));
    } else {
      setSelectedNegativeTags([...selectedNegativeTags, tag]);
    }
  };

  // 移除单个正向标签
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  // 移除单个负面标签
  const removeNegativeTag = (tag: string) => {
    setSelectedNegativeTags(selectedNegativeTags.filter((t) => t !== tag));
  };

  // 处理参考图上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setReferenceImages((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });

    // 清空 input 以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 移除参考图
  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && selectedTags.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 如果有参考图，先上传到图床获取URL
      let imageUrls: string[] | undefined;
      if (referenceImages.length > 0) {
        const uploadPromises = referenceImages.map((img) => {
          // 如果是 base64，上传到图床；如果已经是 URL，直接使用
          if (img.startsWith('data:')) {
            return uploadBase64Image(img).then((res) => res.url);
          }
          return Promise.resolve(img);
        });
        imageUrls = await Promise.all(uploadPromises);
      }

      // 调用API生成图片，分开传递提示词、正面标签、负面标签
      const response = await generateImage({
        model: selectedModel,
        prompt: prompt.trim(),
        positiveTags: selectedTags,
        negativeTags: selectedNegativeTags,
        aspect_ratio: selectedRatio,
        // 仅 nano-banana-2 系列传递清晰度
        image_size: selectedImageSize,
        // 传递上传后的图片URL数组
        referenceImages: imageUrls,
      });

      if (response.success && response.images.length > 0) {
        // 将新生成的图片添加到列表前面
        const newImages = response.images.map((img) => img.url);
        setGeneratedImages((prev) => [...newImages, ...prev]);

        // 保存到历史记录
        addHistory({
          prompt: prompt.trim(),
          positiveTags: selectedTags,
          negativeTags: selectedNegativeTags,
          model: selectedModel,
          aspectRatio: selectedRatio,
          imageSize: selectedImageSize,
          referenceImages: imageUrls || [],
          generatedImages: newImages,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* 最左侧：历史记录面板 */}
      <div
        className={`flex-shrink-0 bg-white/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col overflow-hidden transition-all duration-300 ${
          showHistory ? 'w-[280px]' : 'w-0 border-0 p-0'
        }`}
      >
        {showHistory && <ImageHistoryPanel onLoadHistory={handleLoadHistory} />}
      </div>

      {/* 左侧：输入区域（两列布局 + 底部按钮） */}
      <div className="w-[720px] flex-shrink-0 flex flex-col gap-3 overflow-hidden">
        {/* 历史记录切换按钮 */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
        >
          {showHistory ? (
            <>
              <PanelLeftClose size={14} />
              隐藏历史
            </>
          ) : (
            <>
              <PanelLeftOpen size={14} />
              显示历史
            </>
          )}
        </button>
        {/* 上部两列区域 */}
        <div className="flex gap-3 flex-1 min-h-0">
          {/* 第一列：标签、负面标签 */}
          <div className="w-[320px] flex flex-col gap-3">
            {/* 正向标签区域 */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex-1 flex flex-col min-h-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex-shrink-0">
                <Tags className="w-4 h-4 inline mr-1.5 text-orange-500" />
                标签
              </label>
              <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                {selectedTags.length === 0 ? (
                  <div className="text-xs text-gray-400 dark:text-gray-500 py-1">
                    从右侧标签集中选择...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-md"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 负面标签区域 */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex-1 flex flex-col min-h-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex-shrink-0">
                <Ban className="w-4 h-4 inline mr-1.5 text-red-500" />
                负面标签
              </label>
              <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                {selectedNegativeTags.length === 0 ? (
                  <div className="text-xs text-gray-400 dark:text-gray-500 py-1">
                    从右侧标签集中选择...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNegativeTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-md"
                      >
                        {tag}
                        <button
                          onClick={() => removeNegativeTag(tag)}
                          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 第二列：提示词、参考图、模型参数 */}
          <div className="flex-1 flex flex-col gap-3">
            {/* 提示词输入 */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex-shrink-0">
                <Sparkles className="w-4 h-4 inline mr-1.5 text-orange-500" />
                提示词
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要生成的图片..."
                className="flex-1 min-h-0 resize-none text-sm"
              />
            </div>

            {/* 参考图上传 */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Upload className="w-4 h-4 inline mr-1.5 text-orange-500" />
                参考图
                <span className="text-xs text-gray-400 ml-1">（可选）</span>
              </label>

              <div className="flex flex-wrap gap-2">
                {/* 已上传的参考图 */}
                {referenceImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative w-14 h-14 rounded-lg overflow-hidden group"
                  >
                    <img
                      src={img}
                      alt={`参考图 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeReferenceImage(index)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}

                {/* 上传按钮 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-orange-500"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">添加</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* 模型选择 */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <CustomSelect
                value={selectedModel}
                onChange={setSelectedModel}
                options={MODELS}
                icon={<Cpu className="w-3.5 h-3.5 mr-1.5 text-orange-500" />}
                label="模型"
              />
            </div>

            {/* 宽高比选择 */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <CustomSelect
                value={selectedRatio}
                onChange={setSelectedRatio}
                options={ASPECT_RATIOS}
                icon={
                  <RatioIcon className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                }
                label="宽高比"
              />
            </div>

            {/* 清晰度选择 */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <CustomSelect
                value={selectedImageSize}
                onChange={setSelectedImageSize}
                options={IMAGE_SIZES}
                icon={<ImageIcon className="w-3.5 h-3.5 mr-1.5 text-orange-500" />}
                label="清晰度"
              />
            </div>


          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="flex-shrink-0 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 底部生成按钮（独占一行） */}
        <Button
          onClick={handleGenerate}
          disabled={
            (!prompt.trim() && selectedTags.length === 0) || isGenerating
          }
          className="w-full h-11 flex-shrink-0 bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 hover:from-orange-600 hover:via-pink-600 hover:to-rose-600 shadow-lg shadow-orange-500/25"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              生成图片
            </>
          )}
        </Button>
      </div>

      {/* 中间：图片展示区域 */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <ImageIcon className="w-4 h-4 inline mr-1.5" />
              生成结果
            </h3>
            {generatedImages.length > 0 && (
              <button
                onClick={() => setGeneratedImages([])}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center"
              >
                <Trash2 size={12} className="mr-1" />
                清空
              </button>
            )}
          </div>

          {generatedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-orange-500/50" />
                </div>
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                选择标签或输入提示词，点击生成按钮开始创作
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 flex-1 auto-rows-fr">
              {generatedImages.map((image, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700"
                >
                  <img
                    src={image}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* 悬浮操作栏 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={image}
                      download={`generated-image-${index + 1}.png`}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                      title="下载图片"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </a>
                    <button 
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                      title="重新生成"
                    >
                      <RefreshCw className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() =>
                        setGeneratedImages((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="p-2 bg-white/20 hover:bg-red-500/80 rounded-lg backdrop-blur-sm transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：标签集面板 */}
      <div className="w-[300px] flex-shrink-0 bg-white/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col overflow-hidden">
        {/* 标签面板头部 */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Tags size={12} className="text-white" />
            </div>
            <h3 className="text-sm font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              标签集
            </h3>
          </div>
        </div>

        {/* 标签列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
          {/* 正向标签 */}
          {tagCategories.map((category) => (
            <div key={category.name}>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {category.name}
                </h4>
                <button
                  onClick={() => {
                    setAddingTagToCategory(addingTagToCategory === category.name ? null : category.name);
                    setAddingTagToNegativeCategory(null);
                    setNewTagName('');
                  }}
                  className="p-0.5 text-gray-400 hover:text-orange-500 transition-colors"
                  title="添加标签"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {category.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {/* 添加标签输入框 */}
              {addingTagToCategory === category.name && (
                <div className="flex gap-1 mt-1.5">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTagToCategory(category.name);
                      if (e.key === 'Escape') {
                        setAddingTagToCategory(null);
                        setNewTagName('');
                      }
                    }}
                    placeholder="输入标签名"
                    className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddTagToCategory(category.name)}
                    className="px-2 py-1 text-xs bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    添加
                  </button>
                  <button
                    onClick={() => {
                      setAddingTagToCategory(null);
                      setNewTagName('');
                    }}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* 新建正向分类 */}
          <div className="pt-1">
            <div className="flex gap-1">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="新建分类..."
                className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-2 py-1.5 text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-md hover:from-orange-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <FolderPlus size={12} />
              </button>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          {/* 负面标签标题 */}
          <div className="flex items-center gap-1.5 px-1">
            <Ban size={12} className="text-red-500" />
            <span className="text-xs font-medium text-red-500">负面标签</span>
          </div>

          {/* 负面标签 */}
          {negativeTagCategories.map((category) => (
            <div key={category.name}>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {category.name}
                </h4>
                <button
                  onClick={() => {
                    setAddingTagToNegativeCategory(addingTagToNegativeCategory === category.name ? null : category.name);
                    setAddingTagToCategory(null);
                    setNewTagName('');
                  }}
                  className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="添加标签"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {category.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleNegativeTagClick(tag)}
                    className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      selectedNegativeTags.includes(tag)
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {/* 添加负面标签输入框 */}
              {addingTagToNegativeCategory === category.name && (
                <div className="flex gap-1 mt-1.5">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTagToNegativeCategory(category.name);
                      if (e.key === 'Escape') {
                        setAddingTagToNegativeCategory(null);
                        setNewTagName('');
                      }
                    }}
                    placeholder="输入标签名"
                    className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddTagToNegativeCategory(category.name)}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    添加
                  </button>
                  <button
                    onClick={() => {
                      setAddingTagToNegativeCategory(null);
                      setNewTagName('');
                    }}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* 新建负面分类 */}
          <div className="pt-1">
            <div className="flex gap-1">
              <input
                type="text"
                value={newNegativeCategoryName}
                onChange={(e) => setNewNegativeCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNegativeCategory()}
                placeholder="新建负面分类..."
                className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                onClick={handleAddNegativeCategory}
                disabled={!newNegativeCategoryName.trim()}
                className="px-2 py-1.5 text-xs bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-md hover:from-red-600 hover:to-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <FolderPlus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
