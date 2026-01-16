# AI-Tools-Front 项目上下文文档

> **重要提示**：此文档是 AI 助手理解项目的核心参考。在进行任何开发任务时，AI 必须先阅读此文档，并在完成功能开发后更新相关章节。

---

## 一、产品需求概述

### 1.1 产品定位
"喵想"是一个面向创作者的 AI 视频创作平台，帮助用户通过 AI 技术快速将创意转化为动画视频。目标用户包括：
- 短视频创作者
- 动画爱好者
- 内容营销人员
- 独立创作者

### 1.2 核心价值主张
- **降低创作门槛**：无需专业动画技能，通过文字描述即可生成视频
- **提升创作效率**：AI 辅助生成分镜、图片、视频，大幅缩短制作周期
- **保持创作控制**：支持多版本生成、编辑修改，让用户掌控最终效果

### 1.3 核心功能模块

#### 1.3.1 用户系统
- **注册/登录**：邮箱验证码注册
- **用户中心**：个人信息管理、余额查看、交易记录（支持分页和日期筛选）
- **套餐购买**：支持三档套餐（10元/100代币、29元/300代币、68元/700代币）
- **兑换码**：支持兑换码充值代币

#### 1.3.2 剧本管理
- **剧本列表**：卡片式展示，支持批量选择删除
- **剧本编辑**：三栏布局（剧集列表 + 工作区 + 素材池）
- **剧集管理**：支持多集创作，每集独立管理分镜

#### 1.3.3 分镜视频工作区（EpisodeWorkspace）
- **分镜列表**：底部横向滚动列表，支持拖拽排序
- **分镜编辑**：左侧面板编写脚本、上传参考图
- **视频播放器**：中央区域预览生成的视频
- **分镜池**：右侧面板管理多个视频版本
- **视频生成**：支持 16:9/9:16 比例，10s/15s 时长
- **视频编辑（Remix）**：基于已生成视频进行二次编辑
- **关联资产**：在参考图 Tab 中可关联资产库中的设计稿作为视频生成参考图

> 更新于 2026-01-16：关联设计稿功能改为关联资产仓库，统一参考图来源

#### 1.3.4 资产画布工作区（AssetCanvasWorkspace）
- **多画布管理**：支持创建多个画布，通过顶部标签页切换
- **画布标签栏**：显示所有画布，支持新建、删除、重命名
- **无限画布**：支持缩放、平移、网格背景
- **节点系统**：生成节点（AI 生成）、输入节点（上传图片）
- **连线系统**：节点间连接，传递参考图
- **右键菜单**：保存图像、删除节点
- **保存到仓库**：生成的图片可保存到资产仓库

> 更新于 2026-01-16：替代旧的 AssetWorkspace，使用画布节点系统
> 更新于 2026-01-16：新增多画布支持，每个剧本可创建多个独立画布

#### 1.3.5 资产仓库工作区（AssetRepositoryWorkspace）
- **分类管理**：创建、编辑、删除分类
- **资产网格**：展示所有已保存的资产
- **资产预览**：查看资产详情
- **关联使用**：分镜视频和角色可关联仓库中的资产作为参考图

> 更新于 2026-01-16：统一的资产存储和管理系统

#### 1.3.6 角色工作区（CharacterWorkspace）
- **角色身份卡片**：左上角展示角色认证状态
  - 已认证：显示 Sora2 头像、Username、Task ID、绿色对勾
  - 未认证：显示 UNREGISTERED 水印、注册按钮
- **角色池**：左下角网格展示所有角色
- **视频预览区**：右侧预览生成的角色视频
- **角色编辑器**：右侧编辑角色姓名、设定、参考图
- **视频生成**：支持比例、时长选择
- **角色注册**：视频生成完成后可注册 Sora2 角色，用于多视频角色一致性
  - 点击注册按钮弹出视频预览弹窗
  - 选择角色出现的时间范围（1-3秒）
  - 注册成功后显示已认证状态

> 更新于 2026-01-13：新增 Sora2 角色注册功能，支持多视频角色一致性

#### 1.3.6 角色工作区（CharacterWorkspace）
- **角色身份卡片**：左上角展示角色认证状态
  - 已认证：显示 Sora2 头像、Username、Task ID、绿色对勾
  - 未认证：显示 UNREGISTERED 水印、注册按钮
- **角色池**：左下角网格展示所有角色
- **视频预览区**：右侧预览生成的角色视频
- **角色编辑器**：右侧编辑角色姓名、设定、参考图
- **视频生成**：支持比例、时长选择
- **角色注册**：视频生成完成后可注册 Sora2 角色，用于多视频角色一致性
  - 点击注册按钮弹出视频预览弹窗
  - 选择角色出现的时间范围（1-3秒）
  - 注册成功后显示已认证状态

> 更新于 2026-01-13：新增 Sora2 角色注册功能，支持多视频角色一致性

#### 1.3.7 代币系统
- **代币消耗**：
  - 视频生成：3 代币/次
  - 图片生成（Nano Banana 2）：4 代币/次
  - 图片生成（豆包）：2 代币/次
- **余额显示**：顶部导航栏实时显示
- **乐观更新**：生成时立即扣除，失败后退款

### 1.4 用户界面流程

```
登录页（LandingPage）
    ↓ 登录成功
剧本列表页（ScriptListPage）
    ↓ 点击剧本
剧本编辑页（ScriptEditorPage）
    ├── 分镜视频工作区（Tab: storyboard）
    │   ├── 剧集面板（左）
    │   ├── 分镜编辑面板（中左）
    │   ├── 视频播放器（中）
    │   ├── 分镜池（右）
    │   └── 分镜列表（底）
    ├── 资产画布工作区（Tab: assetCanvas）
    │   ├── 画布工具栏（顶）
    │   ├── 无限画布（中）
    │   └── 节点系统（生成节点、输入节点）
    ├── 资产仓库工作区（Tab: assetRepository）
    │   ├── 分类列表（左）
    │   └── 资产网格（右）
    └── 角色工作区（Tab: character）
        ├── 角色池（左）
        ├── 角色编辑器（中）
        └── 视频预览区（右）
```

> 更新于 2026-01-16：移除分镜图工作区，简化工作流程

### 1.5 交互规范

#### 生成流程
1. 用户填写脚本/描述
2. 点击"生成"按钮
3. 前端乐观扣除代币
4. 创建新的 Variant，状态设为 `generating`
5. 调用后端 API
6. 定时轮询状态（5 秒间隔）
7. 完成后更新 UI，同步真实余额

#### 版本管理
- 每个分镜/分镜图支持多个版本（Variant）
- 点击版本卡片切换激活版本
- 激活版本显示在播放器/查看器中
- 支持删除不满意的版本

#### 状态显示
- `pending`：待生成（灰色）
- `queued`：排队中（紫色）
- `generating`：生成中（紫色 + 进度条）
- `completed`：已完成（绿色）
- `failed`：生成失败（红色）

### 1.6 设计风格
- **主题**：赛博朋克风格
- **主色调**：青色 `#00f5ff`、紫色 `#bf00ff`
- **背景色**：深色 `#0a0a0f`、`#12121a`
- **边框**：半透明发光效果
- **动画**：平滑过渡，发光效果

---

## 二、技术架构

### 2.1 项目定位
这是"喵想"AI 视频创作平台的前端应用，提供：
- 用户认证（登录/注册）
- 剧本管理与编辑
- 分镜视频/图片生成
- 资产管理（角色/场景/物品）
- 用户中心（余额、交易记录、邀请码）

### 2.2 技术栈
- **框架**: React 18
- **语言**: TypeScript
- **构建**: Vite
- **状态管理**: Zustand
- **数据请求**: TanStack React Query
- **路由**: React Router 6
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI

---

## 三、目录结构

```
AI-Tools-Front/
├── src/
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 根组件，路由配置
│   ├── index.css             # 全局样式
│   ├── pages/                # 页面组件
│   │   ├── LandingPage.tsx   # 登录/注册页
│   │   ├── ScriptListPage.tsx    # 剧本列表
│   │   ├── ScriptEditorPage.tsx  # 剧本编辑器
│   │   └── ProfilePage.tsx   # 用户中心
│   ├── components/           # 组件
│   │   ├── layout/           # 布局组件
│   │   │   └── AppNavbar.tsx # 顶部导航栏
│   │   ├── ui/               # 通用 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── ReferenceImageGrid.tsx      # 参考图网格展示（支持放大预览）
│   │   │   ├── ReferenceImageUploader.tsx  # 参考图上传组件
│   │   │   ├── LinkDesignImageDialog.tsx   # 关联设计稿弹窗（分镜视频用）
│   │   │   └── LinkAssetImageDialog.tsx    # 关联资产弹窗（分镜图用）
│   │   ├── video/            # 视频相关组件
│   │   │   ├── ScriptCard.tsx
│   │   │   ├── EpisodeWorkspace.tsx
│   │   │   ├── ImageWorkspace.tsx
│   │   │   ├── AssetCanvasWorkspace.tsx
│   │   │   ├── AssetRepositoryWorkspace.tsx
│   │   │   ├── CharacterWorkspace.tsx
│   │   │   ├── CyberAssetSidebar.tsx
│   │   │   ├── StoryboardCard.tsx
│   │   │   ├── VariantPool.tsx
│   │   │   └── ImageVariantPool.tsx
│   │   └── scene/            # 场景编辑组件
│   ├── stores/               # Zustand 状态管理
│   │   ├── authStore.ts      # 用户认证状态
│   │   ├── videoStore.ts     # 剧本/分镜状态
│   │   ├── editingStore.ts   # 编辑状态
│   │   ├── assetStore.ts     # 资产状态
│   │   └── characterStore.ts # 角色状态
│   ├── services/             # API 服务
│   │   ├── api.ts            # 视频/图片生成 API
│   │   ├── authApi.ts        # 认证 API
│   │   ├── scriptApi.ts      # 剧本/分镜 CRUD API
│   │   ├── assetApi.ts       # 资产 API
│   │   └── characterApi.ts   # 角色 API
│   ├── types/                # TypeScript 类型定义
│   │   └── video.ts          # 视频相关类型
│   ├── hooks/                # 自定义 Hooks
│   ├── utils/                # 工具函数
│   ├── config/               # 配置文件
│   └── lib/                  # 第三方库封装
├── tailwind.config.js        # Tailwind 配置
├── vite.config.ts            # Vite 配置
└── package.json
```

---

## 四、核心类型定义

### 4.1 数据模型类型

```typescript
// 剧本
interface Script {
  id: string;
  title: string;
  prompt?: string;
  content?: string;
  episodes: Episode[];
  currentPhase: VideoPhase;  // 'storyboard' | 'video'
  createdAt: string;
  updatedAt: string;
}

// 剧集
interface Episode {
  id: string;
  scriptId: string;
  episodeNumber: number;
  title: string;
  content: string;
  storyboards: Storyboard[];
  storyboardImages: StoryboardImage[];
  createdAt: string;
  updatedAt: string;
}

// 分镜（视频）
interface Storyboard {
  id: string;
  episodeId: string;
  sceneNumber: number;
  description: string;
  referenceImageUrls?: string[];
  variants: StoryboardVariant[];
  activeVariantId?: string;
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  createdAt: string;
}

// 分镜副本（视频）
interface StoryboardVariant {
  id: string;
  storyboardId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  taskId?: string;
  progress?: string;
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  startedAt?: string;   // 生成开始时间
  finishedAt?: string;  // 生成结束时间（完成或失败）
  createdAt: string;
}

// 分镜图（图片）
interface StoryboardImage {
  id: string;
  episodeId: string;
  sceneNumber: number;
  description: string;
  referenceImageUrls?: string[];
  imageVariants: ImageVariant[];
  activeVariantId?: string;
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  createdAt: string;
}

// 图片副本
interface ImageVariant {
  id: string;
  storyboardImageId: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  startedAt?: string;   // 生成开始时间
  finishedAt?: string;  // 生成结束时间（完成或失败）
  createdAt: string;
}

> 更新于 2026-01-14：StoryboardVariant 和 ImageVariant 新增 startedAt、finishedAt 字段

// 资产
interface Asset {
  id: string;
  scriptId: string;
  name: string;
  description: string;
  designImageUrl?: string;
  thumbnailUrl?: string;
  referenceImageUrls?: string[];
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
}

// Sora2角色
interface Character {
  id: string;
  scriptId: string;
  name: string;
  description: string;
  referenceImageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  taskId?: string;
  progress?: string;
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  // Sora2 角色注册信息（用于多视频角色一致性）
  soraCharacterId?: string;   // Sora2 角色ID (ch_xxx)
  soraUsername?: string;      // Sora2 用户名
  soraPermalink?: string;     // Sora2 角色主页链接
  soraProfilePicUrl?: string; // Sora2 角色头像URL
  createdAt: string;
  updatedAt: string;
}

// 资产 Tab 类型
type AssetTabType = 'storyboard' | 'storyboardImage' | 'asset' | 'character';

> 更新于 2026-01-13：Character 类型新增 Sora2 角色注册字段
```

---

## 五、状态管理

### 5.1 authStore（用户认证）
```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  updateBalance: (balance: number | ((prev: number) => number)) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}
```

### 5.2 videoStore（剧本/分镜）
```typescript
interface VideoState {
  scripts: Script[];
  currentScriptId: string | null;
  currentAssetTab: AssetTabType;
  isLoading: boolean;
  error: string | null;

  // 剧本操作
  loadScripts: () => Promise<void>;
  createScript: (title?: string) => Promise<string>;
  selectScript: (id: string) => void;
  deleteScript: (id: string) => Promise<void>;
  deleteScripts: (ids: string[]) => Promise<void>;
  renameScript: (id: string, title: string) => Promise<void>;
  updateScriptPhase: (id: string, phase: VideoPhase) => Promise<void>;

  // 剧集操作
  addEpisode: (...) => Promise<string>;
  updateEpisode: (...) => Promise<void>;
  deleteEpisode: (...) => Promise<void>;

  // 分镜操作
  addStoryboard: (...) => Promise<string>;
  updateStoryboard: (...) => Promise<void>;
  deleteStoryboard: (...) => Promise<void>;
  clearStoryboards: (...) => Promise<void>;
  reorderStoryboards: (...) => Promise<void>;

  // 分镜副本操作
  addVariant: (...) => Promise<string>;
  updateVariant: (...) => Promise<void>;
  deleteVariant: (...) => Promise<void>;
  setActiveVariant: (...) => Promise<void>;
  refreshVariant: (...) => Promise<void>;

  // 分镜图操作（与分镜类似）
  addStoryboardImage: (...) => Promise<string>;
  // ...

  // 图片副本操作（与分镜副本类似）
  addImageVariant: (...) => Promise<string>;
  // ...

  getCurrentScript: () => Script | null;
  refreshScript: (scriptId: string) => Promise<void>;
}
```

### 5.3 assetStore（资产管理）
```typescript
interface AssetState {
  assets: Asset[];
  isLoading: boolean;
  loadAssets: (scriptId: string) => Promise<void>;
  createAsset: (scriptId: string, data: {...}) => Promise<Asset>;
  updateAsset: (scriptId: string, assetId: string, data: {...}) => Promise<void>;
  deleteAsset: (scriptId: string, assetId: string) => Promise<void>;
}
```

### 5.4 characterStore（角色管理）
```typescript
interface CharacterState {
  characters: Character[];
  isLoading: boolean;
  loadCharacters: (scriptId: string) => Promise<void>;
  addCharacter: (scriptId: string, name: string, description?: string) => Promise<string>;
  updateCharacter: (scriptId: string, characterId: string, data: Partial<Character>) => Promise<void>;
  deleteCharacter: (scriptId: string, characterId: string) => Promise<void>;
  refreshCharacter: (scriptId: string, characterId: string) => Promise<void>;
}
```

> 更新于 2026-01-12：新增 characterStore

### 5.6 canvasStore（画布管理）
```typescript
interface CanvasState {
  canvases: Canvas[];
  currentCanvasId: string | null;
  viewport: Viewport;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
  currentScriptId: string | null;

  // 画布管理
  loadCanvases: (scriptId: string) => Promise<void>;
  createCanvas: (scriptId: string, name?: string) => Promise<string>;
  deleteCanvas: (scriptId: string, canvasId: string) => Promise<void>;
  renameCanvas: (scriptId: string, canvasId: string, name: string) => Promise<void>;
  switchCanvas: (canvasId: string) => void;

  // 画布操作
  setViewport: (viewport: Viewport) => Promise<void>;
  resetViewport: () => Promise<void>;

  // 节点操作
  addNode: (...) => Promise<string>;
  updateNode: (...) => Promise<void>;
  deleteNode: (...) => Promise<void>;
  selectNode: (nodeId: string | null) => void;

  // 连接操作
  addEdge: (...) => Promise<string>;
  deleteEdge: (...) => Promise<void>;

  // 辅助方法
  getConnectedInputUrls: (nodeId: string) => string[];
  getCurrentCanvas: () => Canvas | null;
  clearCanvas: () => void;
}
```

> 更新于 2026-01-16：新增多画布管理功能，支持创建、删除、重命名、切换画布
```typescript
interface PreferencesState {
  video: { aspectRatio: '16:9' | '9:16'; duration: '10' | '15' };
  storyboardImage: { aspectRatio: '16:9' | '1:1' | '4:3'; model: string; imageSize: '1K' | '2K' };
  asset: { aspectRatio: '1:1' | '4:3' | '16:9'; model: string; imageSize: '1K' | '2K' };
  character: { aspectRatio: '16:9' | '9:16'; duration: '10' | '15' };
  setVideoPreferences: (prefs: Partial<VideoPreferences>) => void;
  setStoryboardImagePreferences: (prefs: Partial<StoryboardImagePreferences>) => void;
  setAssetPreferences: (prefs: Partial<AssetPreferences>) => void;
  setCharacterPreferences: (prefs: Partial<CharacterPreferences>) => void;
}
```

> 更新于 2026-01-14：新增偏好设置 Store，使用 localStorage 持久化
> 更新于 2026-01-14：storyboardImage 和 asset 新增 imageSize 字段，支持图片质量设置（1K/2K）
> 更新于 2026-01-15：移除所有 promptTemplateId 字段，删除提示词模板功能

---

## 六、页面路由

| 路径 | 组件 | 说明 | 鉴权 |
|------|------|------|------|
| `/home` | LandingPage | 登录/注册页 | 否 |
| `/video` | ScriptListPage | 剧本列表 | 是 |
| `/video/script/:scriptId` | ScriptEditorPage | 剧本编辑器 | 是 |
| `/profile` | ProfilePage | 用户中心 | 是 |
| `/` | - | 重定向到 `/video` | 是 |

---

## 七、API 服务层

### 7.1 authApi.ts
```typescript
// 发送验证码
sendVerificationCode(email: string, type: 'register' | 'reset_password')

// 注册
register(email: string, password: string, code: string, nickname?: string)

// 登录
login(email: string, password: string)

// 获取当前用户
getCurrentUser()

// 登出
logout()
```

### 7.2 scriptApi.ts
```typescript
// 剧本 CRUD
fetchScripts() / fetchScript(id) / createScript(title) / updateScript(id, data) / deleteScript(id) / deleteScripts(ids)

// 剧集 CRUD
createEpisode(scriptId, data) / updateEpisode(scriptId, episodeId, data) / deleteEpisode(scriptId, episodeId)

// 分镜 CRUD
createStoryboard(...) / updateStoryboard(...) / deleteStoryboard(...) / clearStoryboards(...) / reorderStoryboards(...)

// 分镜副本 CRUD
fetchVariant(...) / createVariant(...) / updateVariant(...) / deleteVariant(...) / setActiveVariant(...)

// 分镜图 CRUD（与分镜类似）
// 图片副本 CRUD（与分镜副本类似）
```

### 7.3 api.ts
```typescript
// 视频生成
generateSora2Video(request: Sora2VideoRequest)
getVideoStatus(taskId: string)
generateStoryboardVideo(request: StoryboardToVideoRequest)
remixVideo(taskId: string, request: RemixVideoRequest)

// 图片生成
generateAssetDesign(request: AssetDesignRequest)
generateStoryboardImage(request: StoryboardImageRequest)

// 图片上传
uploadImage(file: File)

// 余额记录
getBalanceRecords(page: number, pageSize: number)
```

### 7.5 canvasApi.ts
```typescript
// 画布管理
fetchCanvases(scriptId: string) // 获取所有画布
fetchCanvas(scriptId: string, canvasId: string) // 获取单个画布
createCanvas(scriptId: string, name: string) // 创建画布
renameCanvas(scriptId: string, canvasId: string, name: string) // 重命名画布
deleteCanvas(scriptId: string, canvasId: string) // 删除画布
updateViewport(scriptId: string, canvasId: string, viewport: Viewport) // 更新视口

// 节点操作
createNode(scriptId: string, canvasId: string, data: CreateNodeRequest) // 创建节点
updateNode(scriptId: string, canvasId: string, nodeId: string, updates: UpdateNodeRequest) // 更新节点
deleteNode(scriptId: string, canvasId: string, nodeId: string) // 删除节点

// 连接操作
createEdge(scriptId: string, canvasId: string, data: CreateEdgeRequest) // 创建连接
deleteEdge(scriptId: string, canvasId: string, edgeId: string) // 删除连接
```

> 更新于 2026-01-16：新增多画布管理 API，所有操作需要 canvasId 参数
```typescript
fetchAssets(scriptId: string)
createAsset(scriptId: string, data: {...})
updateAsset(scriptId: string, assetId: string, data: {...})
deleteAsset(scriptId: string, assetId: string)
```

---

## 八、核心组件说明

### 8.1 页面组件

**LandingPage**
- 登录/注册表单切换
- 邮箱验证码发送
- 视频背景动画

**ScriptListPage**
- 剧本卡片网格展示
- 批量选择与删除
- 创建新剧本

**ScriptEditorPage**
- 左侧资产 Tab 切换（分镜/分镜图/资产）
- 根据 Tab 渲染不同工作区
- 顶部导航栏

**ProfilePage**
- 用户信息展示与编辑
- 余额显示
- 套餐购买（10元/100代币、29元/300代币、68元/700代币）
- 兑换码功能
- 交易记录（支持分页和日期范围筛选、总消耗统计）
- 偏好设置（分镜视频/资产/角色的默认生成参数）

> 更新于 2026-01-16：移除分镜图偏好设置

### 8.2 工作区组件

**EpisodeWorkspace**
- 剧集列表与编辑
- 分镜卡片展示
- 分镜拖拽排序
- 视频生成触发

**AssetCanvasWorkspace**
- 画布标签栏：顶部显示所有画布，支持切换、新建、删除、重命名
- 无限画布：缩放、平移、网格背景
- 节点管理：创建、删除、移动、连接
- 图片生成：AI 生成或上传
- 保存到仓库：将生成的图片保存到资产仓库
- 多画布支持：每个剧本可创建多个独立画布

**AssetRepositoryWorkspace**
- 分类管理：创建、编辑、删除分类
- 资产展示：网格展示所有资产
- 资产操作：查看、删除、关联使用

> 更新于 2026-01-16：资产系统重构
> 更新于 2026-01-16：AssetCanvasWorkspace 新增多画布支持，通过顶部标签栏管理

### 8.3 核心 UI 组件

**VariantPool / ImageVariantPool**
- 副本池展示
- 副本切换与删除
- 生成进度显示
- 激活副本选择

**CyberVideoPlayer**
- 视频播放器
- 画面比例选择（9:16/16:9）
- 视频时长选择（10s/15s）
- 可选生成按钮（支持显示代币消耗）
- 处理中状态显示（进度百分比）

> 更新于 2026-01-14：CyberVideoPlayer 新增 onGenerate、generateCost、processingProgress 等 props，支持角色模块复用

**CyberImageViewer**
- 图片查看器
- 画面比例选择（16:9/1:1/4:3）
- 图片质量选择（1K/2K）
- 模型选择

> 更新于 2026-01-14：CyberImageViewer 新增图片质量选择（1K/2K），支持生成不同分辨率的图片
> 更新于 2026-01-15：CyberVideoPlayer 和 CyberImageViewer 移除提示词模板选择功能

**StoryboardCard**
- 分镜卡片
- 描述编辑
- 参考图管理
- 视频/图片预览

**CanvasTabs**
- 画布标签栏
- 显示所有画布标签
- 点击切换画布
- 双击重命名画布
- 关闭按钮删除画布
- "+"按钮创建新画布

> 更新于 2026-01-16：新增画布标签栏组件

**CyberAssetSidebar**
- 资产 Tab 切换（分镜视频/资产画布/资产仓库/角色）
- 赛博朋克风格设计

> 更新于 2026-01-16：移除分镜图 Tab

**CharacterWorkspace**
- 角色池：左侧网格展示所有角色
- 角色编辑器：右侧编辑角色姓名、设定、参考图
- 视频预览区：使用 CyberVideoPlayer 组件预览生成的角色视频
- 支持上传参考图或关联资产图片（使用公用 ReferenceImageUploader 组件）
- 视频生成设置：比例、时长（集成在 CyberVideoPlayer 中）

> 更新于 2026-01-12：新增角色工作区组件
> 更新于 2026-01-13：参考图上传改用公用 ReferenceImageUploader 组件
> 更新于 2026-01-14：视频预览区改用 CyberVideoPlayer 组件，统一播放器体验

---

## 九、数据流说明

### 9.1 视频生成流程
```
1. 用户在 EpisodeWorkspace 点击"生成视频"
2. 调用 videoStore.addVariant() 创建新副本
3. 调用 api.generateStoryboardVideo() 发起生成请求
4. 后端返回 taskId，更新副本状态为 'queued'
5. 前端轮询 api.getVideoStatus(taskId) 查询状态
6. 状态更新时调用 videoStore.updateVariant() 更新本地状态
7. 完成后显示视频预览
```

### 9.2 图片生成流程
```
1. 用户在 ImageWorkspace 或 AssetCanvasWorkspace 点击"生成"
2. 调用相应的 addImageVariant() 或画布节点生成
3. 调用 api.generateAssetDesign() 或 api.generateStoryboardImage()
4. 后端同步返回生成结果（图片生成较快）
5. 更新本地状态，显示图片
```

> 更新于 2026-01-16：统一使用 api.ts 中的图片生成函数

### 9.3 角色视频生成流程
```
1. 用户在 CharacterWorkspace 选择角色，填写角色设定
2. 选择比例、时长
3. 点击"生成视频"，前端乐观扣除代币
4. 调用 characterApi.generateCharacterVideo() 发起生成请求
5. 后端返回 taskId，更新角色状态为 'generating'
6. 前端轮询 characterStore.refreshCharacter() 查询状态
7. 完成后显示角色视频预览
```

### 9.4 Sora2 角色注册流程（多视频角色一致性）
```
1. 角色视频生成完成后，用户点击"注册角色"按钮
2. 弹出视频预览弹窗，显示视频播放器和时间范围滑块
3. 用户选择角色出现的时间范围（1-3秒）
4. 点击确认，调用 characterApi.registerSoraCharacter()
5. 后端调用 Sora2 API 注册角色
6. 注册成功后，角色身份卡片显示"已认证"状态
7. 显示 Sora2 头像、Username、Task ID
```

> 更新于 2026-01-13：新增 Sora2 角色注册流程

### 9.5 状态同步策略
- 乐观更新：先更新本地状态，再发送 API 请求
- 失败回滚：API 失败时恢复原状态
- 定期刷新：关键数据定期从服务器同步

---

## 十、样式规范

### 10.1 设计风格
- 赛博朋克风格
- 主色调：青色 `#00f5ff`、紫色 `#bf00ff`
- 背景色：深色 `#0a0a0f`、`#12121a`
- 渐变：`linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))`

### 10.2 Tailwind 配置
- 自定义颜色已在 `tailwind.config.js` 中定义
- 使用 `@tailwindcss/typography` 插件

### 10.3 组件样式约定
- 使用 `clsx` 和 `tailwind-merge` 合并类名
- 交互状态使用 `hover:` 和 `transition-all`
- 边框使用 `border-[rgba(0,245,255,0.2)]` 风格

---

## 十一、环境变量

```env
VITE_BACKEND_URL=http://localhost:3000
```

---

## 十二、开发规范

### 12.1 组件规范
- 使用函数组件 + Hooks
- Props 使用 TypeScript 接口定义
- 复杂逻辑抽取到自定义 Hook

### 12.2 状态管理规范
- 全局状态使用 Zustand
- 组件局部状态使用 useState
- 服务端状态使用 React Query（可选）

### 12.3 API 调用规范
- 统一在 services 目录定义
- 使用 async/await
- 错误统一抛出，由调用方处理

### 12.4 命名规范
- 组件：PascalCase（如 `ScriptCard.tsx`）
- 函数/变量：camelCase（如 `handleClick`）
- 类型：PascalCase（如 `StoryboardVariant`）
- 文件夹：kebab-case 或 camelCase

---

## 十三、AI 助手维护指南

### 13.1 文档更新时机
- **新增页面**：更新第六章页面路由
- **新增组件**：更新第八章核心组件说明
- **新增类型**：更新第四章核心类型定义
- **新增 API**：更新第七章 API 服务层
- **修改状态管理**：更新第五章状态管理
- **修改数据流**：更新第九章数据流说明
- **新增产品功能**：更新第一章产品需求概述

### 13.2 更新格式
在更新时，请在相关章节末尾添加：
```
> 更新于 YYYY-MM-DD：简要说明变更内容
```

### 13.3 注意事项
- 保持文档与代码同步
- 使用中文编写
- 保持格式一致性
- 重要变更需要更新版本号
- 新增组件时说明其用途和关键 Props

---

## 十四、版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-01-11 | 初始版本，包含完整产品需求描述 |
| 1.0.1 | 2026-01-11 | 新增 ReferenceImageGrid、ReferenceImageUploader 公共组件，统一参考图上传与预览 |
| 1.0.2 | 2026-01-11 | 新增关联设计稿功能：分镜配置的参考图 Tab 中可关联同剧集同分镜序号的分镜图版本 |
| 1.0.3 | 2026-01-11 | 提示词模板改为从后端 API 动态获取，按 video/storyboardImage/asset 分类，通过 ID 查询 |
| 1.0.4 | 2026-01-12 | 分镜视频和分镜图工作区新增提示词模板选择功能，位于 CyberVideoPlayer/CyberImageViewer 顶部工具栏 |
| 1.0.5 | 2026-01-12 | 新增 Sora2 角色视频生成功能：CharacterWorkspace 组件、characterStore、characterApi、角色 Tab |
| 1.0.6 | 2026-01-13 | 新增 Sora2 角色注册功能：支持多视频角色一致性，角色身份卡片显示认证状态 |
| 1.0.7 | 2026-01-13 | 角色模块参考图上传改用公用 ReferenceImageUploader 组件，统一交互体验 |
| 1.0.8 | 2026-01-13 | 分镜图工作区新增"关联资产"功能，支持从资产库选择设计稿作为参考图 |
| 1.1.0 | 2026-01-14 | 用户中心重构：删除邀请码功能，新增套餐购买选项，余额记录支持分页和日期筛选，新增全局偏好设置（分镜视频/分镜图/资产/角色的默认生成参数） |
| 1.1.1 | 2026-01-14 | 分镜图生成、资产生成新增图片质量选择（1K/2K），上传组件默认限制改为 10MB |
| 1.2.0 | 2026-01-15 | 删除提示词模板功能：移除 getPromptTemplates API、PromptTemplateConfig 类型、偏好设置中的 promptTemplateId、CyberVideoPlayer/CyberImageViewer 的模板选择器 |
| 1.2.1 | 2026-01-16 | 资产画布节点新增右键菜单：支持保存图像（有图片时）和删除节点，适用于生成节点和输入节点 |
| 1.3.0 | 2026-01-16 | 删除旧资产系统：移除 AssetWorkspace、assetStore、assetApi，统一使用资产仓库（AssetRepositoryWorkspace）和资产画布（AssetCanvasWorkspace） |
| 1.3.1 | 2026-01-16 | 分镜视频工作区关联设计稿改为关联资产仓库，统一分镜视频和分镜图的参考图来源 |
| 1.4.0 | 2026-01-16 | 完全移除分镜图功能：删除 ImageWorkspace、ImageStoryboardGrid、ImageLeftPanel、ImageVariantPool 组件，移除分镜图 Tab，移除分镜图偏好设置，移除 types/stores/services 中的分镜图相关代码，简化工作流程 |
| 1.4.1 | 2026-01-16 | 修复资产关联弹窗：支持显示所有分类的资产，新增分类 Tab 切换，弹窗尺寸从 3 列调整为 4 列 |
| 1.4.2 | 2026-01-16 | 完成分镜图功能清理：删除 videoStore 中所有分镜图实现函数（addStoryboardImage、updateStoryboardImage、deleteStoryboardImage、clearStoryboardImages、reorderStoryboardImages、addImageVariant、updateImageVariant、deleteImageVariant、setActiveImageVariant、refreshImageVariant），删除 api.ts 中的 generateStoryboardImage 函数和 StoryboardImageResponse 接口，修复 videoStore 中重复的 getCurrentScript 方法定义 |
| 1.5.1 | 2026-01-16 | 资产画布新增多画布支持：每个剧本可创建多个独立画布，通过顶部标签栏切换、新建、删除、重命名画布，优化画布管理体验 |
