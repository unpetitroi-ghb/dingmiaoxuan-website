# 方案 B：把当前代码部署到 152.136.155.145

让 http://152.136.155.145:3000 跑「紫橙魔法风」新版，任选一种方式。

---

## 方式一：用 Git（推荐）

### 1. 在本机（你改代码的机器）

```bash
cd ~/dingmiaoxuan
git add -A
git commit -m "UI 魔法化：紫橙配色、首页/创作/等待/预览页改造"
git push origin main
```

（若主分支叫 `master`，把 `main` 改成 `master`。）

### 2. 在服务器 152.136.155.145 上

SSH 登录后：

```bash
cd /path/to/dingmiaoxuan   # 改成你项目在服务器上的实际路径
git pull origin main

npm ci                     # 或 npm install
npm run build
npm run start:server       # 见下方「生产环境启动」
```

若服务器上还没有项目，先克隆再构建：

```bash
git clone <你的仓库地址> dingmiaoxuan
cd dingmiaoxuan
npm ci
cp .env.example .env.local   # 若有，并填好环境变量
npm run build
npm run start:server
```

---

## 方式二：用 rsync 直接拷代码

在本机执行（把 `user` 和 `/path/to/dingmiaoxuan` 换成你的服务器账号和路径）：

```bash
cd ~/dingmiaoxuan
rsync -avz --exclude node_modules --exclude .next --exclude .git . user@152.136.155.145:/path/to/dingmiaoxuan/
```

然后 SSH 到服务器：

```bash
cd /path/to/dingmiaoxuan
npm install
npm run build
npm run start:server
```

---

## 生产环境启动（在服务器上）

要让人通过 http://152.136.155.145:3000 访问，需监听所有网卡。已在 `package.json` 中加好脚本：

- **开发**：`npm run dev`（本机调试）
- **生产**：`npm run start:server`（监听 0.0.0.0:3000，供外网访问）

首次部署或改代码后记得：

```bash
npm run build
npm run start:server
```

若用 **pm2** 保活：

```bash
npm install -g pm2
pm2 start npm --name "dingmiaoxuan" -- run start:server
pm2 save && pm2 startup
```

---

## 部署后自检

打开 http://152.136.155.145:3000 应看到：

- 标题：**✨ 暖暖绘本 🔮**
- 背景：浅灰蓝（非黄色）
- 主按钮：紫橙渐变
- 四张步骤卡：上传照片、取名与创意、AI 生成、导出绘本

若仍是「AI 魔法绘本」和「选角→上传线索…」，说明跑的仍是旧代码，请确认服务器上的目录和进程都是本次部署的版本。
