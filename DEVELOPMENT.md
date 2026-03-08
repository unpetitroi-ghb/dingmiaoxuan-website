# 暖暖绘本 — 开发文档

本文档面向后续参与开发的 AI 或开发者，用于理解当前项目功能、技术实现与可优化点，并据此给出页面与功能优化建议。

---

## 一、项目概述

- **产品名称**：暖暖绘本（dingmiaoxuan）
- **目标用户**：家长 / 儿童（3–10 岁）
- **核心价值**：用户上传孩子照片 → AI 分析照片并生成故事脚本 → 即梦 4.0 生成插画 → 形成可编辑、可导出的绘本（PDF/打印/图片包）。
- **域名**：dingmiaoxuan.com（部署后使用）。

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js 16 (App Router + Pages Router) | 首页为 App Router，创作/预览为 Pages Router |
| 样式 | Tailwind CSS 4 | 自定义设计系统见 `app/globals.css`（kid-* 类） |
| 语言 | TypeScript | 全项目 TS |
| 图像上传 | 服务端代理上传 | 前端 base64 → `/api/upload-file` → 服务器本地 public/uploads |
| 图像分析 | 腾讯混元 | 仅使用混元 hunyuan-vision 图生文，无需本地视觉服务 |
| 故事生成 | DeepSeek API | 文本生成，基于分析结果 + 用户创意生成 6 页脚本 |
| 插画生成 | 即梦 4.0（火山引擎） | 异步任务（提交 → 轮询），AK/SK 签名 |
| 存储 | 本地磁盘 | 上传图片与即梦生成图均存于服务器 public/uploads，返回 /uploads/xxx 路径 |
| 导出 | @react-pdf/renderer、JSZip、window.print | PDF、ZIP 图片包、打印 |

---

## 三、整体架构与数据流

```
用户浏览器
    │
    ├─ 首页 /              (app/page.tsx)
    ├─ 创作 /create         (pages/create/index.tsx)  上传照片 → 分析 → 填表单
    ├─ 等待 /create/waiting  (pages/create/waiting.tsx) 串行：DeepSeek → 即梦逐页
    └─ 预览 /create/preview (pages/create/preview.tsx) 翻页、编辑文字、导出

Next.js API (pages/api/)
    ├─ POST /api/upload-file        → 接收 base64，写入本地 public/uploads，返回 /uploads/xxx
    ├─ POST /api/character/analyze   → 单图角色头像分析（context=avatar），走混元 vision，失败时 200 兜底
    ├─ POST /api/story/analyze-clues → 多图线索分析，上传本地 + 混元视觉分析，创建 story 草稿，返回 storyId + clue_analysis
    ├─ POST /api/analyze-images     → 多图批量分析（legacy），调混元 vision，失败 503
    ├─ GET/PATCH /api/story/[id]     → 故事详情、更新概要/脚本/分页角色
    ├─ POST /api/story/generate      → 根据 storyId 生成分镜脚本（DeepSeek）
    ├─ POST /api/generate-image      → 即梦 4.0 出图，入参 prompt / style / referenceImageUrl
    └─ GET /api/characters、POST /api/character/create 等 → 角色库

视觉分析：仅使用腾讯混元（hunyuan-vision），环境变量 HUNYUAN_API_KEY 必填。
外部服务
    ├─ 腾讯混元（hunyuan-vision）图生文  ← 图像理解，必配 HUNYUAN_API_KEY
    ├─ DeepSeek API
    └─ 火山引擎即梦 4.0 API
```

**创作流程中的状态**：  
创作过程无后端会话，状态放在浏览器 **sessionStorage**：`photoUrls`、`photoFiles`（仅前端）、`analysisResult`、`imageLabels`、`characterName`、`storyIdea`、`style`、`projectId`、`fullStory`（含 title + pages[{ text, imageUrl }]）。刷新或关页会丢失，无作品列表与持久化。

---

## 四、目录与关键文件

```
dingmiaoxuan/
├── app/
│   ├── layout.tsx          # 根布局，Geist 字体，metadata 标题/描述
│   ├── globals.css         # 儿童向设计系统（kid-page/card/btn/input/title/heading/muted/thumbnail）
│   └── page.tsx            # 首页：标题、说明、步骤卡片、开始创作入口
├── pages/
│   ├── api/
│   │   ├── upload.ts           # 生成上传 URL（本地存储时多为占位，实际上传走 upload-file）
│   │   ├── upload-file.ts      # 接收 base64，写本地 public/uploads，返回 /uploads/xxx，body 限制 20mb
│   │   ├── analyze-images.ts   # multipart 解析 images[]，调混元 vision，无降级，失败 503
│   │   ├── generate-story.ts   # 调 lib/deepseek.generateComicScript
│   │   └── generate-image.ts   # 调 lib/jimeng 即梦异步出图
│   ├── create/
│   │   ├── index.tsx       # 创作页：两步（上传+分析 → 填主角名/故事创意/风格）→ 跳 waiting
│   │   ├── waiting.tsx     # 等待页：读 sessionStorage，串行调 generate-story 再逐页 generate-image，写 fullStory 后跳 preview
│   │   └── preview.tsx     # 预览页：翻页、可编辑文字叠加、导出 PDF/打印/单页图/ZIP、分享
│   └── (无 index.tsx，首页在 app/page.tsx)
├── components/
│   └── PhotoUploader.tsx   # 多图上传（react-dropzone），base64 上传到 upload-file，回调 (publicUrl, file)，支持外部 loading
├── lib/
│   ├── types.ts            # Project / Page / GenerationTask 等类型
│   ├── gcs.ts              # 本地存储：uploadBuffer 写 public/uploads、deleteFile、generateUploadSignedUrl（占位）
│   ├── deepseek.ts         # generateStory、generateComicScript（支持 imageAnalysis / imageAnalysisDescription）
│   ├── jimeng.ts           # 即梦 4.0：火山引擎签名、提交任务、轮询、返回 imageUrl
│   ├── vision-python.ts    # 视觉分析统一入口：仅腾讯混元 hunyuan-vision，analyzeBatchFromBuffers、checkVisionService
│   └── pdf-fonts.ts        # 注册 Noto Sans SC 供 @react-pdf/renderer 中文 PDF
├── .env.local             # 本地环境变量（不提交）
├── Dockerfile              # Next 应用镜像
├── DEPLOYMENT.md          # 部署说明（Docker、环境变量）
└── DEVELOPMENT.md         # 本开发文档
```

---

## 五、当前功能说明（按页面与接口）

### 5.1 首页 (`/`)

- **文件**：`app/page.tsx`
- **功能**：展示产品名「暖暖绘本」、一句话介绍、一张 hero 图（`/hero-image.jpg`）、「开始创作」按钮、4 步说明卡片（上传照片、取名、AI 生成、导出）。
- **实现要点**：纯静态，使用 `kid-page`、`kid-card`、`kid-btn-primary`、`kid-title`、`kid-heading`、`kid-muted`。无登录、无数据请求。

### 5.2 创作页 (`/create`)

- **文件**：`pages/create/index.tsx`
- **流程**：
  1. **第一步**：`PhotoUploader` 多图上传（最多 5 张），每张先 base64 上传到 `/api/upload-file` 得到 `photoUrls`（本地 /uploads/xxx），同时保留 `photoFiles`。已选图片以**缩略图网格**（约 80×80px）展示。用户点击「下一步：分析照片」时，将 `photoFiles` 以 `FormData`（字段 `images[]`）POST 到 `/api/analyze-images`。
  2. **分析失败**：若接口返回 503，前端 alert 提示检查 HUNYUAN_API_KEY 配置。
  3. **第二步**：展示分析结果文案（`summary`）、主角名字（默认「暖暖」）、故事创意（多行文本）、漫画风格（水彩/日漫/美漫/卡通/绘本）。点击「开始生成漫画」将 `photoUrls`、`analysisResult`、`imageLabels`、`characterName`、`storyIdea`、`style`、`projectId` 写入 sessionStorage，跳转 `/create/waiting`。
- **状态**：全部为 React state + sessionStorage，无服务端会话。

### 5.3 等待页 (`/create/waiting`)

- **文件**：`pages/create/waiting.tsx`
- **功能**：页面加载后自动执行生成流水线；展示进度条与步骤文案（分析照片、DeepSeek 写脚本、即梦画图、完成）。
- **流水线**：
  1. 从 sessionStorage 读取上述字段。
  2. 若有 `imageLabels` 且 `analysisResult` 存在，则调用 `/api/generate-story` 时传 `imageAnalysis: { summary, labels }`；否则传 `imageAnalysisDescription: analysisResult`。
  3. DeepSeek 返回 `{ title, pages: [{ text, description }] }`。
  4. 对每一页调用 `/api/generate-image`：prompt 含 `description`、风格、主角名、参考图 URL（`photoUrls[0]`）、「留出空白区域用于文字」的提示。
  5. 将结果组装为 `fullStory`（含 title、pages 的 text + imageUrl）写入 sessionStorage，约 1 秒后跳转 `/create/preview`。
- **错误**：任一步失败则展示错误信息与「返回重试」按钮，不持久化。

### 5.4 预览页 (`/create/preview`)

- **文件**：`pages/create/preview.tsx`
- **功能**：
  - **阅读**：按页展示插画 + 底部可编辑文字（contentEditable），字体为楷体/雅黑系；翻页时保存当前页文字到 sessionStorage 中的 `fullStory`。
  - **导出**：导出 PDF（@react-pdf/renderer，中文字体见 `lib/pdf-fonts.ts`）、打印（新窗口写入 HTML 后 `window.print()`）、下载当前页图片、下载全部页为 ZIP（JSZip）。
  - **分享**：Web Share API 或复制链接到剪贴板。
  - **返回首页**：跳回 `/`。
- **数据来源**：仅从 sessionStorage 读 `fullStory`；无服务端拉取。

### 5.5 API 汇总

| 路径 | 方法 | 作用 | 依赖 |
|------|------|------|------|
| `/api/upload-file` | POST | body: filename, contentType, fileBase64 → 写入本地 public/uploads，返回 publicUrl（/uploads/xxx） | 无 |
| `/api/analyze-images` | POST | multipart images[] → 转发 Python /analyze_batch，返回 summary、all_labels | **Python 视觉服务必须运行**，失败 503 |
| `/api/generate-story` | POST | characterName, imageAnalysis 或 imageAnalysisDescription, userStoryIdea, style, pageCount → DeepSeek 脚本 | DEEPSEEK_API_KEY |
| `/api/generate-image` | POST | prompt, style, referenceImageUrl → 即梦 4.0 异步出图，返回 imageUrl | JIMENG_API_KEY, JIMENG_SECRET_KEY |

---

## 六、设计系统（儿童向）

- **文件**：`app/globals.css`
- **CSS 变量**：`--kid-bg`、`--kid-primary`、`--kid-primary-soft`、`--kid-muted`、`--kid-card-border`、`--kid-radius`、`--kid-tap`（最小点击高度 48px）等。
- **常用类**：`kid-page`（整页背景与内边距）、`kid-card`（白底卡片）、`kid-btn-primary`（主按钮）、`kid-btn-secondary`（次按钮）、`kid-input`（输入框）、`kid-title` / `kid-heading` / `kid-muted`、`kid-thumbnail`（缩略图容器）。兼容旧类名：`comic-*` 已映射为与 kid-* 同效果。
- **目标**：柔和色、大圆角、足够点击区域，适合儿童与家长使用。

---

## 七、环境变量（.env.local 或 .env）

| 变量 | 说明 |
|------|------|
| DEEPSEEK_API_KEY | DeepSeek 对话 API |
| JIMENG_API_KEY / JIMENG_SECRET_KEY | 火山引擎即梦 AK/SK |
| HUNYUAN_API_KEY | 腾讯混元 API Key（视觉分析必填，控制台创建） |
| NEXT_PUBLIC_BASE_URL | 前端用，如 http://localhost:3000 |
| POSTGRES_* / DATABASE_URL | 数据库（云端部署见 docs/腾讯云部署指南.md） |

---

## 八、当前限制与可优化方向（供 AI 建议参考）

1. **无持久化与作品列表**：全部在 sessionStorage，刷新即丢；无用户、无「我的绘本」、无历史记录。
2. **等待页体验**：生成过程在前端串行请求，耗时长且易超时；无服务端任务队列、无 WebSocket/SSE 推送进度、无断点续传。
3. **视觉分析依赖混元**：分析接口无降级，未配置 HUNYUAN_API_KEY 则 503；可考虑「可选分析」或友好引导页。
4. **预览与导出**：文字为前端叠加，非即梦内嵌；PDF 字体仅 Noto Sans SC；打印为单页 HTML，无多页排版优化。
5. **移动端与 a11y**：布局已做基础响应式，但触控区域、焦点顺序、屏幕阅读器、深色模式未系统优化。
6. **错误与边界**：多数为 alert 或简单文案；无统一错误边界、无重试、无部分失败（如某一页出图失败）的降级策略。
7. **性能**：多图上传为逐张 base64，大图易卡；即梦逐页轮询，总时长较长；未做图片压缩或懒加载。
8. **安全与配置**：API Key 在服务端；上传文件存于 public/uploads，未做请求限流与防滥用。
9. **首页与品牌**：hero 图需自行替换；无 SEO 结构化、无分享图；步骤说明可更贴合实际流程。
10. **代码结构**：App Router 与 Pages Router 混用；部分逻辑集中在页面组件内，可拆为 hooks / 服务层便于测试与复用。

请基于以上功能说明与限制，从**页面交互、视觉、性能、可访问性、功能扩展（如作品保存、任务队列）、错误处理与部署**等维度，给出具体、可执行的优化建议（含建议优先级与实现要点）。
