# photoz-api

PhotoZ 独立 Node API 服务，采用 `coderhub` 风格分层架构（`Router → Middleware → Controller → Service → Database`），技术栈为 **Koa + pg + Supabase Auth**。

## 目录结构

```
src/
├── main.js               # 入口，加载 .env 并启动 Koa 服务
├── app.js                # Koa 应用组装（bodyParser + 路由 + 错误处理）
├── app/
│   ├── config.js         # 统一读取环境变量
│   ├── database.js       # pg.Pool 连接池
│   └── error-handle.js   # 全局错误处理
├── router/               # 按资源分文件，index.js 自动注册
├── middleware/
│   └── auth.middleware.js # Supabase Bearer token 校验，通过后挂 ctx.user
├── controller/           # 读请求 → 调 service → 写 ctx.body
├── service/
│   └── repository.service.js  # 所有数据库操作（pg 参数化 SQL）
├── utils/                # 工具函数：auth、tokens、storage、mailer、csv、public-url
└── constants/
    └── gallery-mode.js   # 相册模式枚举与工具函数
```

## 接口一览

所有后台接口需携带 `Authorization: Bearer <supabase_access_token>`。

| 方法     | 路径                                        | 说明           |
| -------- | ------------------------------------------- | -------------- |
| GET      | /api/admin/summary                          | 仪表盘概览     |
| GET      | /api/admin/clients                          | 客户列表       |
| POST     | /api/admin/clients                          | 创建客户       |
| DELETE   | /api/admin/clients/:id                      | 删除客户       |
| GET      | /api/admin/galleries                        | 相册列表       |
| POST     | /api/admin/galleries                        | 创建相册       |
| GET      | /api/admin/galleries/:id                    | 相册详情       |
| DELETE   | /api/admin/galleries/:id                    | 删除相册       |
| PATCH    | /api/admin/galleries/:id/mode               | 切换相册模式   |
| POST     | /api/admin/galleries/:id/publish            | 发布相册       |
| POST     | /api/admin/galleries/:id/upload-url         | 获取上传 URL   |
| POST     | /api/admin/galleries/:id/photos             | 批量入库照片   |
| DELETE   | /api/admin/galleries/:id/photos/:photoId    | 删除照片       |
| GET      | /api/admin/galleries/:id/selection.csv      | 导出选片 CSV   |
| GET      | /api/share/:token                           | 公开相册（无需登录） |
| POST     | /api/share/:token/selection                 | 客户提交选片   |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量模板
cp .env.example .env
# 编辑 .env，填入真实值

# 3. 开发模式（nodemon）
npm run dev

# 4. 生产启动
npm start
```

## 环境变量说明

| 变量名                      | 说明                                  |
| --------------------------- | ------------------------------------- |
| `APP_HOST`                  | 监听地址，默认 `localhost`            |
| `APP_PORT`                  | 监听端口，默认 `3001`                 |
| `DATABASE_URL`              | Supabase Postgres 连接串              |
| `SUPABASE_URL`              | Supabase 项目 URL（用于 Auth 校验）   |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key（鉴权+签名）|
| `R2_ACCOUNT_ID`             | Cloudflare R2 Account ID              |
| `R2_ACCESS_KEY_ID`          | R2 Access Key ID                      |
| `R2_SECRET_ACCESS_KEY`      | R2 Secret Access Key                  |
| `R2_BUCKET`                 | R2 存储桶名称                         |
| `R2_PUBLIC_BASE_URL`        | R2 公开访问 Base URL                  |
| `PUBLIC_SITE_URL`           | 前端网站 URL（邮件中生成链接使用）    |
| `RESEND_API_KEY`            | Resend API Key                        |
| `NOTIFICATION_FROM_EMAIL`   | 邮件发件人地址                        |

## 运行测试

```bash
npm test
```

测试覆盖工具函数：token 签名/解析、相册模式枚举、CSV 转义、公开 URL 构建。

## 与 Nuxt 前端对接

### 本地开发

在 Nuxt 项目的 `.env` 中把 API 基地址指向本服务：

```env
# 假设 nuxt.config.ts 中有 runtimeConfig.public.apiBase 之类的配置
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

或在 Nuxt 的 composable / `$fetch` 调用处统一加 `baseURL: 'http://localhost:3001'`。

### 线上反向代理（Nginx 示例）

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Vercel Rewrite（vercel.json）

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-api-host.com/api/:path*" }
  ]
}
```

### Cloudflare Tunnel

在 Cloudflare Zero Trust 创建 Tunnel，将 `your-api.domain.com` 路由到本机的 `localhost:3001`，然后在前端设置 `apiBase` 为该域名。

## 架构说明

- **鉴权**：中间件读取 `Authorization: Bearer <token>`，调用 Supabase Admin 的 `auth.getUser(token)` 验证，通过后将 `user` 对象挂到 `ctx.user`，加有 5 分钟内存缓存。
- **数据库**：使用 `pg.Pool` 直连 Supabase Postgres，全部参数化 SQL，不依赖 Supabase 客户端的 ORM。
- **分享 Token**：使用 `SUPABASE_SERVICE_ROLE_KEY` 作为 HMAC-SHA256 签名密钥，与 Nuxt 版本保持一致，旧分享链接无需迁移。
- **文件存储**：Node 服务只签发预签名上传 URL，前端直传 R2；删除操作由后端通过 S3 API 执行。
- **邮件**：客户提交选片后异步发送 Resend 邮件，失败不阻断主流程。
