# photoz-api 接口文档

**版本**：1.0.0  
**Base URL**：`http://localhost:3001`  
**更新日期**：2026-05-26

---

## 认证说明

除公开分享接口（`/api/share/*`）和认证接口（`/api/auth/*`）外，所有接口均需在请求头携带：

```
Authorization: Bearer <access_token>
```

`access_token` 由登录接口返回。

---

## 一、认证接口 `/api/auth`

### 1.1 注册

**POST** `/api/auth/register`

**请求体**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**响应**

| 状态码 | 说明 |
|--------|------|
| 201 | 注册成功并已自动登录 |
| 202 | 注册成功，需邮件确认后才能登录 |
| 400 | 参数缺失或格式错误 |
| 409 | 该邮箱已注册 |

```json
// 201 - 注册即登录
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresAt": 1748000000,
  "user": { "id": "uuid", "email": "user@example.com" }
}

// 202 - 需邮件确认
{ "message": "注册成功，请查收确认邮件后再登录" }

// 409
{ "error": "该邮箱已注册，请直接登录" }
```

---

### 1.2 登录

**POST** `/api/auth/login`

**请求体**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | 登录成功 |
| 400 | 参数缺失 |
| 401 | 邮箱或密码不正确 |

```json
// 200
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresAt": 1748000000,
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

---

### 1.3 登出

**POST** `/api/auth/logout`

需携带 `Authorization: Bearer <access_token>`

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | 登出成功 |

```json
{ "ok": true }
```

---

## 二、仪表盘 `/api/admin`

### 2.1 获取概览数据

**GET** `/api/admin/summary`

**响应 200**

```json
{
  "clientCount": 12,
  "galleryCount": 34,
  "publishedCount": 20,
  "submittedCount": 8,
  "unreadSubmissionCount": 3,
  "photoCount": 1024,
  "latestGalleries": [ /* 最近 5 个相册，结构见相册列表 */ ]
}
```

---

## 三、客户接口 `/api/admin/clients`

### 3.1 获取客户列表

**GET** `/api/admin/clients`

**响应 200**

```json
[
  {
    "id": "uuid",
    "name": "张三",
    "phone": "13800000000",
    "email": "client@example.com",
    "note": "婚礼客户",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3.2 创建客户

**POST** `/api/admin/clients`

**请求体**

```json
{
  "name": "张三",
  "phone": "13800000000",
  "email": "client@example.com",
  "note": "婚礼客户"
}
```

> `name` 必填，其余选填。

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | 创建成功，返回客户对象 |
| 400 | `name` 为空 |

---

### 3.3 删除客户

**DELETE** `/api/admin/clients/:id`

> 删除客户会同时删除其名下所有相册及照片（含 R2 存储文件）。

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | `{ "ok": true }` |
| 404 | 客户不存在 |

---

## 四、相册接口 `/api/admin/galleries`

### 4.1 获取相册列表

**GET** `/api/admin/galleries`

**响应 200**

```json
[
  {
    "id": "uuid",
    "clientId": "uuid",
    "title": "张三婚礼精选",
    "slug": "zhang-san-hun-li-jing-xuan",
    "shareToken": "uuid.signature",
    "status": "published",
    "mode": "selection",
    "selectionLimit": 30,
    "expiresAt": null,
    "latestSelectionAt": null,
    "lastViewedSelectionAt": null,
    "hasUnreadSelection": false,
    "photoCount": 120,
    "client": { "id": "uuid", "name": "张三" },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**相册状态说明**

| status | 含义 |
|--------|------|
| `draft` | 草稿，未对外发布 |
| `published` | 已发布，客户可通过分享链接访问 |
| `submitted` | 客户已提交选片 |
| `archived` | 已归档，不可公开访问 |

**相册模式说明**

| mode | 含义 |
|------|------|
| `selection` | 选片模式，客户可提交选片 |
| `browse` | 浏览模式，仅供浏览 |

---

### 4.2 创建相册

**POST** `/api/admin/galleries`

**请求体**

```json
{
  "clientId": "uuid",
  "title": "张三婚礼精选",
  "selectionLimit": 30,
  "expiresAt": null
}
```

> `clientId` 和 `title` 必填。`selectionLimit` 为最多可选张数，`null` 表示不限制。

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | 创建成功，返回相册详情（含 client、photos、selections） |
| 400 | 参数错误或客户不存在 |

---

### 4.3 获取相册详情

**GET** `/api/admin/galleries/:id`

> 调用此接口时，若相册有未读选片记录，会自动标记为已读。

**响应 200**

```json
{
  "id": "uuid",
  "title": "张三婚礼精选",
  "status": "submitted",
  "mode": "selection",
  "shareToken": "uuid.signature",
  "client": {
    "id": "uuid",
    "name": "张三",
    "phone": "13800000000",
    "email": "client@example.com",
    "note": "",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "photos": [
    {
      "id": "uuid",
      "originalFileName": "DSC_0001.jpg",
      "title": "DSC_0001",
      "previewUrl": "https://cdn.example.com/...",
      "previewObjectKey": "photographers/.../previews/...",
      "originalUrl": "https://cdn.example.com/...",
      "originalObjectKey": "photographers/.../originals/...",
      "width": 1920,
      "height": 1280,
      "sortIndex": 0,
      "createdAt": "..."
    }
  ],
  "selections": [
    {
      "id": "uuid",
      "selectedPhotoIds": ["uuid1", "uuid2"],
      "customerName": "张三",
      "customerMessage": "这几张都很好！",
      "createdAt": "..."
    }
  ],
  "hasUnreadSelection": false
}
```

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 404 | 相册不存在 |

---

### 4.4 删除相册

**DELETE** `/api/admin/galleries/:id`

> 同时删除相册内所有照片的 R2 存储文件。

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | `{ "ok": true }` |
| 404 | 相册不存在 |

---

### 4.5 切换相册模式

**PATCH** `/api/admin/galleries/:id/mode`

**请求体**

```json
{ "mode": "browse" }
```

> `mode` 取值：`"selection"` 或 `"browse"`

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | 返回更新后的相册详情 |
| 400 | mode 值不合法 |
| 404 | 相册不存在 |

---

### 4.6 发布相册

**POST** `/api/admin/galleries/:id/publish`

> 将相册状态改为 `published`，并生成分享 Token。

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | 返回相册详情，包含 `shareToken` |
| 404 | 相册不存在 |

---

### 4.7 获取照片上传 URL

**POST** `/api/admin/galleries/:id/upload-url`

前端获取预签名 URL 后直接向 R2 上传文件，不经过本服务。

**请求体**

```json
{
  "fileName": "DSC_0001.jpg",
  "contentType": "image/jpeg",
  "variant": "preview"
}
```

> `variant` 取值：`"preview"`（预览图）或 `"original"`（原图）

**响应 200**

```json
{
  "objectKey": "photographers/uid/galleries/gid/previews/1234-DSC_0001.jpg",
  "uploadUrl": "https://r2.cloudflarestorage.com/...(预签名，5分钟有效)",
  "publicUrl": "https://cdn.example.com/photographers/..."
}
```

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 文件类型不是图片 / 缺少 variant |
| 404 | 相册不存在 |

---

### 4.8 批量入库照片

**POST** `/api/admin/galleries/:id/photos`

前端上传 R2 完成后调用此接口将照片信息写入数据库。

**请求体**

```json
{
  "photos": [
    {
      "originalFileName": "DSC_0001.jpg",
      "title": "第一张",
      "previewObjectKey": "photographers/uid/galleries/gid/previews/1234-DSC_0001.jpg",
      "previewUrl": "https://cdn.example.com/...",
      "previewSizeBytes": 204800,
      "width": 1920,
      "height": 1280,
      "originalObjectKey": "photographers/uid/galleries/gid/originals/1234-DSC_0001.jpg",
      "originalUrl": "https://cdn.example.com/...",
      "originalSizeBytes": 8388608,
      "originalWidth": 6000,
      "originalHeight": 4000
    }
  ]
}
```

> `originalFileName`、`previewObjectKey`、`previewUrl` 为必填；`title` 留空时自动取文件名（去掉扩展名）。

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | 返回已入库的照片数组 |
| 400 | photos 为空或字段缺失 |
| 404 | 相册不存在 |

---

### 4.9 删除照片

**DELETE** `/api/admin/galleries/:id/photos/:photoId`

> 同时删除 R2 上的预览图和原图。

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | `{ "ok": true }` |
| 404 | 照片不存在 |

---

### 4.10 导出选片 CSV

**GET** `/api/admin/galleries/:id/selection.csv`

返回最新一次选片结果的 CSV 文件（UTF-8 BOM，Excel 兼容）。

**响应 Header**

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="slug-selection.csv"
```

**CSV 列**

```
相册, 客户, 照片文件名, 照片标题, 是否已选, 提交人, 客户留言, 提交时间
```

| 状态码 | 说明 |
|--------|------|
| 200 | CSV 文件流 |
| 404 | 相册不存在 |

---

## 五、公开分享接口 `/api/share`

> 无需登录，通过分享 Token 访问。

### 5.1 获取公开相册

**GET** `/api/share/:token`

**响应 200**

```json
{
  "token": "uuid.signature",
  "title": "张三婚礼精选",
  "clientName": "张三",
  "photographerName": "PhotoZ",
  "shootDate": "2024-06-01",
  "selectionLimit": 30,
  "expiresAt": null,
  "status": "published",
  "mode": "selection",
  "note": "请勾选喜欢的照片并提交。提交后记得通知摄影师查看结果。",
  "photos": [
    {
      "id": "uuid",
      "originalFileName": "DSC_0001.jpg",
      "title": "DSC_0001",
      "previewUrl": "https://cdn.example.com/...",
      "originalUrl": "https://cdn.example.com/...",
      "width": 1920,
      "height": 1280
    }
  ]
}
```

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 404 | token 无效 / 相册是草稿或已归档 |

---

### 5.2 客户提交选片

**POST** `/api/share/:token/selection`

**请求体**

```json
{
  "selectedPhotoIds": ["uuid1", "uuid2", "uuid3"],
  "customerName": "张三",
  "customerMessage": "这几张我都很喜欢！"
}
```

> `customerName` 和 `customerMessage` 选填。提交后会异步发送邮件通知摄影师，邮件失败不影响主流程。

**响应**

| 状态码 | 说明 |
|--------|------|
| 200 | 返回选片记录 |
| 400 | 未选照片 / 超出限制数量 / 相册为浏览模式 |
| 404 | token 无效 |

```json
// 200
{
  "id": "uuid",
  "galleryId": "uuid",
  "selectedPhotoIds": ["uuid1", "uuid2"],
  "customerName": "张三",
  "customerMessage": "这几张我都很喜欢！",
  "createdAt": "2024-06-01T10:00:00.000Z"
}
```

---

## 六、错误格式

所有错误均返回统一 JSON 格式：

```json
{ "error": "错误描述" }
```

---

## 七、环境变量速查

| 变量 | 说明 |
|------|------|
| `APP_HOST` | 监听地址，默认 `localhost` |
| `APP_PORT` | 监听端口，默认 `3001` |
| `DATABASE_URL` | Supabase Postgres 连接串 |
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key（token 校验 + 登出） |
| `SUPABASE_ANON_KEY` | Anon Key（登录 / 注册） |
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key |
| `R2_BUCKET` | R2 存储桶名称 |
| `R2_PUBLIC_BASE_URL` | R2 公开访问 Base URL |
| `PUBLIC_SITE_URL` | 前端网站 URL（邮件链接使用） |
| `RESEND_API_KEY` | Resend API Key |
| `NOTIFICATION_FROM_EMAIL` | 邮件发件人地址 |
