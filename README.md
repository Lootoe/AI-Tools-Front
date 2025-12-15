# AI Agent Platform

一个现代化的 AI 对话平台，支持多个大模型，可自定义参数，具备完整的对话管理功能。

## ✨ 功能特性

-   **🤖 多模型支持**：支持 OpenAI GPT、Claude、通义千问等多个大模型
-   **⚙️ 参数调节**：可自由调整 temperature、max_tokens、top_p 等参数
-   **💬 对话管理**：
    -   创建、删除对话
    -   编辑、删除、重新生成消息
    -   对话列表展示
    -   对话历史持久化（本地存储）
-   **📝 Markdown 支持**：
    -   完整的 Markdown 语法渲染
    -   代码高亮显示（支持多种编程语言）
    -   表格、列表、引用等格式支持
    -   GFM（GitHub Flavored Markdown）扩展
-   **🎨 现代 UI**：基于 TailwindCSS 的美观界面
-   **📱 响应式设计**：适配不同屏幕尺寸

## 🛠️ 技术栈

-   **框架**：React 18 + TypeScript 5
-   **构建工具**：Vite 6
-   **状态管理**：Zustand
-   **UI 组件**：自定义组件 + Radix UI
-   **样式**：TailwindCSS + @tailwindcss/typography
-   **Markdown 渲染**：react-markdown + remark-gfm + rehype-highlight
-   **HTTP 客户端**：Axios
-   **本地存储**：LocalForage (IndexedDB)
-   **图标**：Lucide React

## 📦 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_QWEN_API_KEY=your_qwen_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
AI-Agent/
├── src/
│   ├── components/          # 组件目录
│   │   ├── ui/             # 基础UI组件
│   │   ├── chat/           # 对话相关组件
│   │   ├── sidebar/        # 侧边栏组件
│   │   └── settings/       # 设置相关组件
│   ├── pages/              # 页面组件
│   ├── stores/             # Zustand状态管理
│   ├── services/           # API服务
│   ├── types/              # TypeScript类型定义
│   ├── hooks/              # 自定义Hooks
│   ├── utils/              # 工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 使用说明

### 创建对话

1. 点击左侧边栏的"新对话"按钮
2. 系统会自动创建一个新对话并切换到该对话

### 切换模型

1. 在右侧设置面板中选择想要使用的模型
2. 点击对应的模型卡片即可切换

### 调整参数

在右侧设置面板中可以调整以下参数：

-   **Temperature**：控制回答的随机性（0-2）
-   **Max Tokens**：最大生成的 token 数
-   **Top P**：核采样参数
-   **Frequency Penalty**：频率惩罚（-2 to 2）
-   **Presence Penalty**：存在惩罚（-2 to 2）

### 消息操作

-   **编辑**：点击用户消息上的编辑图标
-   **删除**：点击消息上的删除图标
-   **重新生成**：点击 AI 消息上的重新生成图标

## ⚠️ 注意事项

-   需要有效的 API 密钥才能使用对应的模型
-   对话历史存储在本地浏览器中（IndexedDB）
-   清除浏览器数据会导致对话历史丢失

## 📝 开发说明

### 添加新模型

在 `src/types/models.ts` 中的 `AVAILABLE_MODELS` 数组中添加新模型配置：

```typescript
{
  id: 'model-id',
  name: 'Model Name',
  provider: 'provider-name',
  description: '模型描述',
  maxTokens: 8192,
}
```

### 自定义样式

主题配置在 `src/index.css` 和 `tailwind.config.js` 中。

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
