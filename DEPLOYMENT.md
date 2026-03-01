# 云端部署说明（含万物识别）

本应用**必须**与万物识别视觉服务一起运行：分析照片依赖 vision 服务，无降级逻辑。

## 一、Docker Compose 一键部署（推荐）

适用于本地或单机云主机（如腾讯云、阿里云、AWS EC2）。

### 1. 环境变量

在仓库根目录创建 `.env`（不要提交到 Git），示例：

```env
DEEPSEEK_API_KEY=sk-xxx
JIMENG_API_KEY=AKLTxxx
JIMENG_SECRET_KEY=xxx
GCS_BUCKET_NAME=dingmiaoxuan-picture-book
NEXT_PUBLIC_BASE_URL=https://你的域名
# 可选：自定义视觉模型
# VISION_MODEL=your-model-id
```

### 2. GCS 密钥

将 Google Cloud 服务账号密钥保存为 `gcs-key.json` 放在项目根目录。  
Docker Compose 会把它挂载进 app 容器：`./gcs-key.json:/app/gcs-key.json:ro`。

### 3. 启动

```bash
docker compose up -d
```

- 视觉服务：先启动并做健康检查（约 2 分钟内就绪）。
- Next.js：在 vision 健康通过后启动，并连接 `http://vision:5001`。
- 访问：`http://localhost:3000`（或你的主机 IP/域名）。

### 4. 通过 GitHub 部署到云端

1. 将代码推送到 GitHub。
2. 在云主机上克隆仓库，按上面步骤配置 `.env` 和 `gcs-key.json`。
3. 运行 `docker compose up -d`。
4. 配置 Nginx/Caddy 反向代理到 `localhost:3000`，并绑定域名（如 dingmiaoxuan.com）。

## 二、仅构建与运行镜像

### 构建万物识别服务镜像

```bash
docker build -t dingmiaoxuan-vision ./vision-service
docker run -d -p 5001:5001 --name vision dingmiaoxuan-vision
```

### 构建 Next.js 镜像（需能访问 vision）

```bash
docker build -t dingmiaoxuan-app .
docker run -d -p 3000:3000 \
  -e VISION_SERVICE_URL=http://主机IP:5001 \
  -e DEEPSEEK_API_KEY=xxx \
  -e JIMENG_API_KEY=xxx \
  -e JIMENG_SECRET_KEY=xxx \
  -e GCS_BUCKET_NAME=xxx \
  -v $(pwd)/gcs-key.json:/app/gcs-key.json:ro \
  dingmiaoxuan-app
```

## 三、注意事项

- **视觉服务必须先启动**：前端点「下一步：分析照片」会请求 Next.js，Next.js 再请求 vision；若 vision 未就绪会返回 503，页面提示「万物识别服务未启动」。
- **生产环境**：建议用 `docker compose` 的 `depends_on` + `healthcheck` 保证 vision 先就绪再起 app。
- **密钥安全**：`.env` 与 `gcs-key.json` 不要提交到 Git；云上可用密钥管理服务（如 GitHub Secrets、云厂商 KMS）注入环境变量。
- **本地 `npm run build`**：若项目内存在 `vision-service/venv`（Python 虚拟环境），Turbopack 可能报错「Symlink vision-service/venv/bin/python is invalid」。构建前请暂时移除：`rm -rf vision-service/venv`（需要跑视觉服务时再按 vision-service/README 重建）。用 Docker 构建时无此问题（venv 已通过 .dockerignore 排除）。
