# AI Tools Frontend

AI 视频创作工具平台前端，支持剧本编辑、分镜管理、AI 图片/视频生成等功能。

## 功能特性

- **剧本管理**：创建、编辑、删除剧本，支持多剧集结构
- **分镜编辑**：可视化分镜管理，支持拖拽排序、多副本生成
- **资产管理**：角色、场景、物品资产的创建与关联
- **AI 图片生成**：基于描述生成参考图片
- **AI 视频生成**：图生视频，支持多种比例和时长
- **实时状态**：视频生成进度实时更新
- **本地持久化**：对话历史本地存储

## 技术栈

- **框架**：React 18 + TypeScript 5
- **构建**：Vite 6
- **状态管理**：Zustand 5
- **数据请求**：TanStack Query + Axios
- **路由**：React Router 6
- **UI**：TailwindCSS + Radix UI
- **Markdown**：react-markdown + remark-gfm + rehype-highlight
- **本地存储**：LocalForage (IndexedDB)
- **图标**：Lucide React

## 项目结构

```
src/
├── components/           # 组件
│   ├── ui/              # 基础 UI 组件
│   ├── chat/            # 对话组件
│   ├── sidebar/         # 侧边栏
│   └── settings/        # 设置面板
├── pages/               # 页面
│   ├── HomePage.tsx     # 首页
│   ├── ScriptListPage.tsx    # 剧本列表
│   ├── ScriptEditorPage.tsx  # 剧本编辑器
│   └── ImageToVideoPage.tsx  # 图生视频
├── stores/              # Zustand 状态
├── services/            # API 服务
├── hooks/               # 自定义 Hooks
├── types/               # TypeScript 类型
├── utils/               # 工具函数
├── config/              # 配置
├── lib/                 # 第三方库封装
├── App.tsx
├── main.tsx
└── index.css
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
npm run preview  # 预览构建结果
```

## 页面说明

### 首页
AI 对话界面，支持多模型切换和参数调节。

### 剧本列表
管理所有剧本，支持创建、删除、批量操作。

### 剧本编辑器
核心功能页面：
- 左侧：剧集列表
- 中间：分镜编辑区，支持拖拽排序
- 右侧：资产面板（角色/场景/物品）

分镜支持：
- 添加参考图片
- 设置视频比例（16:9 / 9:16）
- 设置视频时长（10s / 15s）
- 生成多个视频副本
- 关联角色/场景/物品资产

### 图生视频
独立的图片转视频工具页面。

## 开发说明

### 代码规范

```bash
npm run lint      # ESLint 检查
npm run test      # 运行测试
```

### 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 添加路由配置

### 自定义样式

- 全局样式：`src/index.css`
- Tailwind 配置：`tailwind.config.js`

## 注意事项

- 需要后端服务运行在 http://localhost:3000
- 部分功能需要有效的 AI API 密钥
- 对话历史存储在浏览器 IndexedDB，清除浏览器数据会丢失

## License

MIT
