# 管理后台说明

## 访问

- 地址：**`/admin`**
- 默认密码：**123456**（生产环境请设置环境变量 `ADMIN_PASSWORD` 修改）

## 功能

1. **服务状态**：数据库、视觉服务是否正常；可点击「刷新状态」重新检测。
2. **远程启动**：当视觉服务显示未启动时，可点击「远程启动」。需在环境变量中配置 `ADMIN_VISION_RESTART_WEBHOOK_URL` 为可 POST 的 URL（例如云厂商的「重启容器」回调或自建脚本地址），否则按钮会提示「未配置重启地址」。
3. **使用情况**：故事总数、角色总数、近 7 天创作数、近 7 天 API 调用（DeepSeek、即梦等）。

## 环境变量

| 变量 | 说明 |
|------|------|
| `ADMIN_PASSWORD` | 后台登录密码，默认 123456 |
| `ADMIN_SECRET` | 会话签名密钥，与密码无关；未设置时用 ADMIN_PASSWORD 或默认值 |
| `ADMIN_VISION_RESTART_WEBHOOK_URL` | 可选；远程启动 Vision 时 POST 的 URL |

## 数据库

后台「API 调用」统计依赖 `ApiCall` 表。首次部署或拉取含该表的代码后，需执行：

```bash
npx prisma generate
npx prisma db push
```
