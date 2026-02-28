# 丁妙煊的奇妙工坊 · dingmiaoxuan.com

为 5 岁丁妙煊做的个人作品展示主页，部署后作为 **dingmiaoxuan.com** 的首页；页面上可点击「进去瞧瞧」进入明珠问天（独立 Cloud Run 服务）。

---

## 一、项目结构说明

- **本目录**：仅包含静态首页（`index.html`），无后端、无数据库。
- **首页内容**：丁妙煊的奇妙工坊标题、简介、两个项目卡片（明珠问天 + 奇妙绘本工坊）。
- **明珠问天**：按钮链接到独立地址（如 `https://mingzhu-wentian-xxx.asia-southeast1.run.app`），在新标签页打开，不占用本域名路径。

**整体关系：**

```
dingmiaoxuan.com（本仓库部署）
    → 打开即「丁妙煊的奇妙工坊」首页
    → 点击「进去瞧瞧」→ 跳转到 明珠问天 的 Cloud Run 地址（新标签页）

明珠问天（mingzhu-wentian 仓库部署）
    → 单独一个 Cloud Run 服务，用 run.app 或自备域名均可
```

---

## 二、推送到 GitHub

### 方式 A：独立仓库（推荐）

1. 在 GitHub 新建空仓库，例如命名为 `dingmiaoxuan` 或 `dingmiaoxuan-website`。
2. 在本机**单独复制本目录**为一份新文件夹（不要带进 mingzhu-wentian 其它文件）：

   ```bash
   # 例如
   cp -r /path/to/mingzhu-wentian/dingmiaoxuan ~/dingmiaoxuan-site
   cd ~/dingmiaoxuan-site
   ```

3. 初始化并推送：

   ```bash
   git init
   git add .
   git commit -m "feat: 丁妙煊的奇妙工坊静态首页"
   git remote add origin https://github.com/你的用户名/dingmiaoxuan.git
   git branch -M main
   git push -u origin main
   ```

### 方式 B：放在 mingzhu-wentian 仓库内

若希望和明珠问天同仓库存放，可保留当前 `mingzhu-wentian/dingmiaoxuan` 目录，直接：

```bash
cd /path/to/mingzhu-wentian
git add dingmiaoxuan/
git commit -m "feat: 添加丁妙煊的奇妙工坊静态站"
git push origin main
```

部署时需在 **dingmiaoxuan 目录下**执行 Cloud Build（见下文），或为 Cloud Build 配置 `dir: dingmiaoxuan`（若使用触发器）。

---

## 三、部署到 Google Cloud Run

### 1. 前置条件

- 已安装 [gcloud CLI](https://cloud.google.com/sdk/docs/install) 并登录：`gcloud auth login`
- 在 GCP 控制台为**同一项目**（或新建项目）开启：**Cloud Build API**、**Artifact Registry API**、**Cloud Run API**
- 若尚未创建 Docker 仓库，在 Artifact Registry 创建名为 `cloud-run-source-deploy` 的仓库（与 `cloudbuild.yaml` 中一致），区域选 `asia-southeast1`：

  ```bash
  gcloud artifacts repositories create cloud-run-source-deploy \
    --repository-format=docker \
    --location=asia-southeast1 \
    --project=你的项目ID
  ```

### 2. 在 dingmiaoxuan 目录下构建并部署

**若为独立仓库**（在复制出来的 `dingmiaoxuan-site` 根目录）：

```bash
cd ~/dingmiaoxuan-site   # 或你的 dingmiaoxuan 目录
gcloud config set project 你的项目ID
gcloud builds submit --config=cloudbuild.yaml .
```

**若在 mingzhu-wentian 仓库内**：

```bash
cd /path/to/mingzhu-wentian/dingmiaoxuan
gcloud config set project 你的项目ID
gcloud builds submit --config=cloudbuild.yaml .
```

成功后 Cloud Run 会给出服务 URL，形如：  
`https://dingmiaoxuan-xxxxx-as.a.run.app`。可先访问该链接确认首页正常。

---

## 四、将域名 dingmiaoxuan.com 指向 Cloud Run

1. **在 Cloud Run 控制台添加自定义域名**
   - 打开 [Cloud Run](https://console.cloud.google.com/run) → 选择服务 `dingmiaoxuan` → 「管理自定义网域」/「Manage custom domains」。
   - 点击「添加映射」→ 选择该服务与区域 → 网域填写 `dingmiaoxuan.com`（以及如需 `www.dingmiaoxuan.com`）。
   - 按提示完成**网域验证**（若使用 Google 域名或 Search Console 验证）。

2. **在域名注册商处配置 DNS**
   - 控制台会给出需要添加的记录（CNAME 或 A 记录及目标值）。
   - 到购买 dingmiaoxuan.com 的域名服务商（如 Google Domains、阿里云、Cloudflare 等）的 DNS 设置里，按 Cloud Run 控制台**实际显示的记录类型和目标**添加：
     - **根域名 dingmiaoxuan.com**：按提示添加 A 或 CNAME。
     - **www.dingmiaoxuan.com**：若在控制台添加了 www，按给出的 CNAME 填写。
   - 保存后等待 DNS 生效（几分钟到 48 小时不等）。

3. **SSL**
   - Cloud Run 为自定义域名自动提供 HTTPS，无需额外配置证书。

完成后，打开 **https://dingmiaoxuan.com** 应显示「丁妙煊的奇妙工坊」首页；点击「进去瞧瞧」会在新标签页打开明珠问天。

---

## 五、修改明珠问天链接地址

若明珠问天日后换了 URL（例如换了 Cloud Run 服务名或绑了子域名），只需改本仓库里的 `index.html`：

- 搜索 `mingzhu-wentian-pqoiehovoq-as.a.run.app`（或当前使用的 URL）。
- 替换为新的明珠问天地址，保存后重新部署本仓库即可。

---

## 六、本地预览

在 dingmiaoxuan 目录下用任意静态服务器即可，例如：

```bash
cd dingmiaoxuan
npx serve .
# 或
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080` 即可查看首页。
