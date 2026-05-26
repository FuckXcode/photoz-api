## Commands

```bash
npm run dev        # Start with nodemon (auto-reload)
npm start          # Production start
npm test           # Run all tests (Node built-in test runner)
node --test test/utils/<file>.test.js   # Run a single test file
```

## Architecture

Layered "coderhub" style: **Router → Middleware → Controller → Service → Utils**

```
src/
├── main.js               # Entry: loads .env, starts Koa
├── app.js                # Assembles Koa app (bodyParser + routes + error handler)
├── app/
│   ├── config.js         # Single source for all env vars
│   ├── database.js       # Singleton pg.Pool
│   └── error-handle.js   # Global Koa error handler
├── router/               # *.router.js files; index.js auto-registers all of them
├── middleware/
│   └── auth.middleware.js # Supabase Bearer token check → sets ctx.user (5 min cache)
├── controller/           # Reads ctx.request / ctx.params → calls service → sets ctx.body
├── service/
│   └── repository.service.js  # All DB queries (pg parameterized SQL), row mappers
├── utils/                # Thin, pure-ish helpers (tokens, storage, csv, mailer, public-url)
└── constants/
    └── gallery-mode.js   # Gallery mode enum + helper functions
```

**Single service file**: all database access lives in `repository.service.js`. Do not split it without good reason.

**Row mapping**: every DB query result goes through a `mapXxx(row)` function (e.g. `mapClient`, `mapGallery`, `mapPhoto`) that converts `snake_case` columns to `camelCase` JS objects. Always add a mapper when adding a new table.

## Key Conventions

**All env vars go through `src/app/config.js`** — never read `process.env` directly in other files.

**Auth**: `verifyAuth` middleware from `auth.middleware.js` must be applied to every `/api/admin/*` route. Public share routes (`/api/share/:token`) and auth routes (`/api/auth/*`) have no `verifyAuth`.

**Auth clients**: two Supabase clients exist in `utils/supabase-auth.js`:
- `getSupabaseAdmin()` — service role key, used for token validation and admin ops (logout)
- `getSupabaseClient()` — anon key, used for `signInWithPassword` / `signUp`

**Error signaling**: throw `Object.assign(new Error('message'), { status: 400 })` in service functions to propagate HTTP status codes up to the controller.

**Router naming**: router files must match `*.router.js` to be auto-loaded by `router/index.js`. Each router uses `prefix: '/api/admin'` (admin), `prefix: '/api/share'` (public), or `prefix: '/api/auth'` (auth).

**Photo storage layout** (Cloudflare R2):
```
photographers/{photographerId}/galleries/{galleryId}/previews/{timestamp}-{filename}
photographers/{photographerId}/galleries/{galleryId}/originals/{timestamp}-{filename}
```
The API only issues presigned PUT URLs; the frontend uploads directly to R2.

**Share tokens**: `{galleryId}.{HMAC-SHA256 signature}` signed with `SUPABASE_SERVICE_ROLE_KEY`. Token logic lives exclusively in `utils/tokens.js`. Do not replicate this elsewhere.

**Gallery statuses**: `draft` → `published` → `submitted` (→ can re-submit). `archived` galleries are not publicly accessible.

**Tests**: only utility functions in `test/utils/` are tested (tokens, gallery-mode, csv, public-url). Tests use Node's built-in `node:test` runner — no Jest or Mocha.

## Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | none | 邮箱+密码注册；若需邮件确认返回 202 |
| POST | /api/auth/login | none | 邮箱+密码登录，返回 `{ accessToken, refreshToken, expiresAt, user }` |
| POST | /api/auth/logout | Bearer | Invalidate 当前 token（scope: local），清除本地缓存 |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_HOST` | 监听地址，默认 `localhost` |
| `APP_PORT` | 监听端口，默认 `3001` |
| `DATABASE_URL` | Supabase Postgres 连接串 |
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key（鉴权校验 + 登出） |
| `SUPABASE_ANON_KEY` | Anon Key（登录 / 注册） |
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key |
| `R2_BUCKET` | R2 存储桶名称 |
| `R2_PUBLIC_BASE_URL` | R2 公开访问 Base URL |
| `PUBLIC_SITE_URL` | 前端网站 URL（邮件链接使用） |
| `RESEND_API_KEY` | Resend API Key |
| `NOTIFICATION_FROM_EMAIL` | 邮件发件人地址 |
