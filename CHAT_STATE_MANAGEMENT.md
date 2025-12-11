# 对话状态管理完整方案

## 状态类型定义

### 1. 消息状态 (MessageStatus)

#### 用户消息状态
- `pending` - 正在发送中（显示"发送中..."）
- `success` - 发送成功
- `failed` - 发送失败（显示错误信息和重试按钮）

#### AI消息状态
- `loading` - 等待AI响应（显示"正在思考..."和loading动画）
- `streaming` - AI正在流式输出（显示"正在生成..."和loading动画）
- `success` - 回复完成
- `timeout` - 回复超时（显示超时图标和重试按钮）
- `interrupted` - 用户主动中断生成（显示"生成已中断"）
- `failed` - 回复失败（显示错误信息和重试按钮）

### 2. 错误类型 (MessageErrorType)
- `network_error` - 网络连接失败
- `timeout_error` - 请求超时（30秒）
- `api_error` - API错误
- `rate_limit_error` - 请求频率限制
- `interrupted` - 用户中断
- `unknown_error` - 未知错误

## 核心功能实现

### 1. 发送消息流程
```
用户输入 → pending状态 → success状态 → 创建AI消息(loading) → streaming → success/failed/timeout/interrupted
```

**关键方法：**
- `sendMessage`: 创建用户消息 → 调用 `generateAIResponse`
- `generateAIResponse`: 创建AI消息 → 调用API → 更新状态

### 2. 中断生成
- 点击中断按钮 → 调用AbortController.abort() → AI消息状态变为interrupted
- 输入框在生成时显示"中断"按钮（红色方块图标）

### 3. 重试机制
- 用户消息失败：删除失败的用户消息，重新发送（会创建新的用户消息和AI回复）
- AI消息失败/超时/中断：删除失败的AI消息，直接重新生成AI回复（不重复用户消息）

### 4. 超时处理
- 设置30秒超时定时器
- 超时后自动调用abort，状态变为timeout
- 显示"AI回复超时"提示和重试按钮

### 5. 错误处理
- 网络错误：用户消息标记为failed
- API错误：AI消息标记为failed，显示具体错误信息
- 超时错误：AI消息标记为timeout
- 中断：AI消息标记为interrupted

## UI反馈

### 用户消息气泡
- `pending`: 显示"发送中..."
- `success`: 正常显示，可编辑
- `failed`: 红色边框 + 错误提示 + 重试按钮

### AI消息气泡
- `loading`: 显示loading动画 + "正在思考..."
- `streaming`: 显示loading动画 + "正在生成..."
- `success`: 正常显示，可重新生成
- `timeout`: 时钟图标 + "AI回复超时" + 重试按钮
- `interrupted`: 停止图标 + "生成已中断" + 重试按钮
- `failed`: 警告图标 + 错误信息 + 重试按钮

### 输入框状态
- 空闲：显示发送图标（蓝色）
- 生成中：显示中断图标（红色方块）
- 禁用：灰色，提示"请先选择或创建一个对话..."

## 状态图标

| 状态 | 图标 | 颜色 |
|------|------|------|
| pending | Loader2 (旋转) | 灰色 |
| loading | Loader2 (旋转) | 灰色 |
| streaming | Loader2 (旋转) | 灰色 |
| timeout | Clock | 红色 |
| interrupted | StopCircle | 红色 |
| failed | AlertCircle | 红色 |

## 技术实现要点

### 1. 方法分离
- `sendMessage`: 处理用户消息的发送
- `generateAIResponse`: 处理AI回复的生成
- `retryMessage`: 根据消息类型调用对应方法
- `regenerateMessage`: 删除消息后重新生成AI回复

这种分离确保重试AI消息时不会重复创建用户消息。

### 2. AbortController
- 每次生成AI回复时创建新的AbortController
- 存储在chatStore中，用于中断请求
- 请求完成或中断后清理

### 3. 状态更新
- 使用updateMessageStatus方法统一更新消息状态
- 支持同时更新status、errorType、errorMessage

### 4. API集成
- 所有API调用支持signal参数
- 捕获AbortError并正确处理

### 5. 用户体验
- 所有状态变化都有明确的视觉反馈
- 错误信息清晰易懂
- 提供重试功能，降低用户挫败感
- 中断功能让用户有控制感
- **重试AI消息时不会重复用户消息**

## 扩展性

系统设计支持未来扩展：
- 可添加更多错误类型
- 可添加消息编辑历史
- 可添加消息评分功能
- 可添加流式输出的逐字显示
- 可添加重试次数限制
- 可添加自动重试机制
