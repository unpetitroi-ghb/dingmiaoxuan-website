# 暖暖绘本（dingmiaoxuan）— 当前界面描述（供其他 AI 做 UI 优化）

> 本文档描述项目现有界面结构、设计系统与用户流程，便于外部 AI 或设计师进行界面优化。

---

## 一、产品与目标用户

- **产品名**：暖暖绘本（内部项目名 dingmiaoxuan），对外可称「AI 魔法绘本」
- **一句话**：用你家照片与角色，AI 理解并汇总成故事，生成独一无二的魔法绘本
- **目标用户**：家长 + 3～10 岁儿童（亲子共创、睡前故事、纪念册）
- **核心流程**：上传照片 → 选角/分析 → 填故事创意与风格 → AI 生成脚本与插画 → 预览/编辑/导出 PDF 或图片

---

## 二、技术栈与路由

- **框架**：Next.js 16（App Router + Pages Router 混用）
- **样式**：Tailwind CSS 4 + 自定义设计系统（见下）
- **动效**：Framer Motion（翻页、弹窗、过渡）
- **字体**：Geist Sans/Mono + 谷歌字体 ZCOOL KuaiLe、Ma Shan Zheng；预览页阅读区使用楷体（KaiTi）
- **主要路由**：
  - **`/`**：首页（App Router，`app/page.tsx`，若有）
  - **`/create`**：创作入口（多步：选角/线索图/故事概要/脚本编辑）
  - **`/create/waiting`**：生成中等待页（进度条、步骤文案）
  - **`/create/preview`**：绘本预览页（翻页、编辑文字、导出 PDF/打印/ZIP、分享）
  - **`/pricing`**：定价与解锁（免费 10 本、单本 9.9、月会员 19.9）
  - **`/admin`**：管理后台（密码登录、服务健康、统计）

---

## 三、设计系统（`app/globals.css`）

### 3.1 色彩变量

| 变量名 | 用途 | 典型值 |
|--------|------|--------|
| `--kid-bg` / `--kid-bg-alt` | 主背景/渐变底 | `#fffbeb` / `#fef3c7`（米黄） |
| `--kid-primary` / `--kid-primary-soft` | 主色/主色浅 | `#ea580c`（橙）/ `#fb923c` |
| `--kid-secondary` | 辅助色 | `#2dd4bf`（青） |
| `--kid-accent` | 强调色 | `#c45c8a`（粉） |
| `--kid-muted` | 次要文案 | `#57534e` |
| `--kid-card` / `--kid-card-border` | 卡片背景/描边 | `#ffffff` / `#fde68a`（黄） |
| `--kid-shadow` | 卡片阴影 | `0 10px 40px rgba(234, 88, 12, 0.12)` |

整体：儿童友好、暖色、高对比、圆润；主色橙色，辅以青、粉。

### 3.2 通用类名

- **布局**：`kid-page`（整页渐变、内边距）、`kid-card`（白底、大圆角、黄边、阴影）
- **按钮**：`kid-btn-primary`（橙渐变、白字、大点击区、hover 上浮、active 缩小）、`kid-btn-secondary`（白底橙边）
- **表单**：`kid-input`（白底、圆角、聚焦橙圈）
- **文案**：`kid-title`（橙色大标题）、`kid-heading`、`kid-muted`、`kid-body`、`kid-caption`
- **缩略图**：`kid-thumbnail`（约 80×80px）
- **动效**：`animate-float-slow`、`animate-pen-draw`、`animate-card-bounce`；预览翻页 `preview-slide-left/right`
- **纸张**：`kid-paper`（预览页文字区，米黄底+纹理）
- **加载**：`kid-spinner`（圆环旋转）
- **圆角**：`--kid-radius`（1.5rem）、`--kid-radius-xl`（1.875rem）；主按钮最小高度 `--kid-tap: 56px`

---

## 四、主要页面与组件

### 4.1 首页（`/`）

产品名、一句话、hero 图、「开始创作」按钮、4 步说明卡片（上传照片、取名、AI 生成、导出）。纯静态，kid-page、kid-card、kid-btn-primary、kid-title 等。

### 4.2 创作页（`/create`）

选角（新建角色、上传头像、AI 分析；失败显示「AI 分析暂不可用，请手动补充角色描述」）、线索图（多图上传与分析）、故事概要与风格（主角名、创意、风格：水彩/日漫/美漫/卡通/绘本）、脚本/分镜编辑。组件：PhotoUploader、表单、主/次按钮；超额弹出 PaywallModal。

### 4.3 等待页（`/create/waiting`）

自动执行流水线；进度条与步骤（分析照片、生成脚本、绘制插画、完成）；成功跳预览，失败展示错误与「返回重试」。

### 4.4 预览页（`/create/preview`）

每页：插画 + 底部可编辑文字（楷体）；左右翻页（Framer Motion）；导出 PDF、打印、下载当前页/全部 ZIP、分享、返回首页。kid-card 书页、kid-paper 文字区。

### 4.5 定价页（`/pricing`）

免费 10 本、单本 9.9、月会员 19.9；支付按钮与微信赞赏码（若配置）；链接回创作与首页。

### 4.6 付费墙（PaywallModal）

额度用尽时弹出；「继续创作需解锁」、单本/会员价格、支付、关闭；遮罩+居中白卡片。

### 4.7 管理后台（`/admin`）

密码登录；服务健康、故事/角色/API 统计；kid-* 样式。

### 4.8 通用组件

PhotoUploader（react-dropzone，上传、缩略图、进度）；PaywallModal。

---

## 五、可优化方向

1. 首页：Hero 与 4 步更突出，CTA 更明显。
2. 创作页：步骤条/进度、折叠、移动端触控与错误提示。
3. 等待页：进度可视化、预估时间、错误重试引导。
4. 预览页：翻页手势、页码、导出入口集中、移动端适配。
5. 全站：统一 kid-*；无障碍与性能（焦点、对比度、懒加载）。
6. 品牌：favicon、OG 图、分享预览。

---

## 六、关键文件路径

| 用途 | 路径 |
|------|------|
| 设计系统 | `app/globals.css` |
| 根布局 | `app/layout.tsx` |
| 首页 | `app/page.tsx`（若存在） |
| 创作 | `pages/create/index.tsx`、`pages/create/waiting.tsx` |
| 预览 | `pages/create/preview.tsx` |
| 定价 | `pages/pricing.tsx` |
| 管理 | `pages/admin/index.tsx` |
| 付费墙 | `components/PaywallModal.tsx` |
| 上传 | `components/PhotoUploader.tsx` |
| 全局 | `pages/_app.tsx` |

---

## 七、设计约束（建议保留）

- 儿童友好：大按钮、高对比、圆角。
- 移动端：触控区域足够（56px）、关键操作不依赖 hover。
- 中文为主：PingFang、楷体、ZCOOL KuaiLe。
- 无登录：主流程无用户系统；管理后台单独密码。
