# 前端部署指南

## 一、前置条件

确保后端已部署并运行在 `http://122.51.160.57:8686`

---

## 二、部署步骤

### 2.1 克隆代码
```bash
mkdir -p /opt/ai-tools
cd /opt/ai-tools
git clone 你的前端仓库地址 frontend
cd frontend
```

### 2.2 配置环境变量
```bash
cp .env.example .env
nano .env
```

确认后端地址正确：
```env
VITE_BACKEND_URL=http://122.51.160.57:8686
```

### 2.3 启动服务
```bash
docker compose up -d --build
```

### 2.4 验证
访问 `http://122.51.160.57` 即可看到前端页面

---

## 三、常用命令

```bash
# 查看日志
docker compose logs -f web

# 重启
docker compose restart web

# 停止
docker compose down

# 重新构建
docker compose up -d --build
```

---

## 四、更新部署

```bash
cd /opt/ai-tools/frontend
git pull
docker compose up -d --build
```
