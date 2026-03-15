# Nunchi Forum API 文档

## 概述

本文档描述 Nunchi Forum 的 RESTful API 接口。

**基础信息**
- 基础 URL: `http://localhost:3001/api/v1`
- 认证方式: JWT Bearer Token
- 数据格式: JSON

---

## 认证 API

### 1. 用户注册

**POST** `/auth/register`

注册用户账号。

**请求体**
```json
{
  "username": "string",    // 必填，3-20字符，仅允许字母数字下划线
  "email": "string",       // 必填，有效邮箱格式
  "password": "string"     // 必填，8-32字符，需包含字母和数字
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token_string",
    "refreshToken": "refresh_token_string"
  }
}
```

**错误码**
- `400` - 参数验证失败
- `409` - 用户名或邮箱已存在

---

### 2. 用户登录

**POST** `/auth/login`

用户登录获取访问令牌。

**请求体**
```json
{
  "email": "string",       // 必填
  "password": "string"     // 必填
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "avatar_url": "string",
      "role": "user"
    },
    "token": "jwt_token_string",
    "refreshToken": "refresh_token_string",
    "expiresIn": 3600
  }
}
```

**错误码**
- `401` - 邮箱或密码错误

---

### 3. 刷新令牌

**POST** `/auth/refresh`

使用刷新令牌获取新的访问令牌。

**请求体**
```json
{
  "refreshToken": "string"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

---

### 4. 登出

**POST** `/auth/logout`

用户登出，使当前令牌失效。

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

### 5. 获取当前用户信息

**GET** `/auth/me`

获取当前登录用户的信息。

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "avatar_url": "string",
    "bio": "string",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "post_count": 0,
    "reputation": 0
  }
}
```

---

## 板块 API

### 1. 获取板块列表

**GET** `/forums`

获取所有公开板块列表。

**查询参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20 |
| sort | string | 排序方式: `newest`, `popular`, `name` |

**响应**
```json
{
  "success": true,
  "data": {
    "forums": [
      {
        "id": "uuid",
        "name": "string",
        "slug": "string",
        "description": "string",
        "icon_url": "string",
        "thread_count": 100,
        "post_count": 500,
        "last_activity": "2024-01-01T00:00:00Z",
        "is_public": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 2. 获取板块详情

**GET** `/forums/{id}`

获取指定板块的详细信息。

**路径参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 板块 ID 或 slug |

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "description": "string",
    "rules": "string",
    "icon_url": "string",
    "banner_url": "string",
    "moderators": [
      {
        "id": "uuid",
        "username": "string",
        "avatar_url": "string"
      }
    ],
    "thread_count": 100,
    "post_count": 500,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. 创建板块

**POST** `/forums`

创建新板块（需要管理员权限）。

**请求头**
```
Authorization: Bearer {token}
```

**请求体**
```json
{
  "name": "string",        // 必填，2-50字符
  "slug": "string",        // 必填，唯一，URL友好格式
  "description": "string", // 可选，最多500字符
  "rules": "string",       // 可选
  "is_public": true        // 可选，默认 true
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "description": "string",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. 更新板块

**PUT** `/forums/{id}`

更新板块信息（需要管理员或版主权限）。

**请求头**
```
Authorization: Bearer {token}
```

**请求体**
```json
{
  "name": "string",
  "description": "string",
  "rules": "string",
  "icon_url": "string",
  "banner_url": "string",
  "is_public": true
}
```

---

### 5. 删除板块

**DELETE** `/forums/{id}`

删除板块（需要管理员权限）。

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "message": "Forum deleted successfully"
}
```

---

## 主题 API

### 1. 获取主题列表

**GET** `/forums/{forum_id}/threads`

获取指定板块下的主题列表。

**路径参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| forum_id | string | 板块 ID |

**查询参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20 |
| sort | string | 排序: `newest`, `popular`, `last_reply` |
| tag | string | 按标签筛选 |

**响应**
```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "id": "uuid",
        "title": "string",
        "author": {
          "id": "uuid",
          "username": "string",
          "avatar_url": "string"
        },
        "forum_id": "uuid",
        "reply_count": 10,
        "view_count": 100,
        "is_pinned": false,
        "is_locked": false,
        "last_reply_at": "2024-01-01T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "tags": ["tag1", "tag2"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

### 2. 获取主题详情

**GET** `/threads/{id}`

获取主题详情及回复列表。

**路径参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 主题 ID |

**查询参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| page | number | 回复页码，默认 1 |
| limit | number | 每页回复数，默认 20 |

**响应**
```json
{
  "success": true,
  "data": {
    "thread": {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "author": {
        "id": "uuid",
        "username": "string",
        "avatar_url": "string",
        "reputation": 100
      },
      "forum": {
        "id": "uuid",
        "name": "string",
        "slug": "string"
      },
      "reply_count": 10,
      "view_count": 100,
      "is_pinned": false,
      "is_locked": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "tags": ["tag1", "tag2"]
    },
    "replies": {
      "data": [...],
      "pagination": {...}
    }
  }
}
```

---

### 3. 创建主题

**POST** `/forums/{forum_id}/threads`

在指定板块创建新主题。

**请求头**
```
Authorization: Bearer {token}
```

**请求体**
```json
{
  "title": "string",       // 必填，5-100字符
  "content": "string",     // 必填，支持 Markdown
  "tags": ["string"]       // 可选，最多5个标签
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "author_id": "uuid",
    "forum_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. 更新主题

**PUT** `/threads/{id}`

更新主题内容（仅作者或管理员可编辑）。

**请求头**
```
Authorization: Bearer {token}
```

**请求体**
```json
{
  "title": "string",
  "content": "string",
  "tags": ["string"]
}
```

---

### 5. 删除主题

**DELETE** `/threads/{id}`

删除主题（仅作者或管理员可删除）。

**请求头**
```
Authorization: Bearer {token}
```

---

### 6. 置顶/取消置顶主题

**PATCH** `/threads/{id}/pin`

置顶或取消置顶主题（需要版主权限）。

**请求头**
```
Authorization: