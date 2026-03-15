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
  "username": "string",
  "email": "string",
  "password": "string"
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
  "email": "string",
  "password": "string"
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
| sort | string | 排序方式: newest, popular, name |

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
  "name": "string",
  "slug": "string",
  "description": "string",
  "rules": "string",
  "is_public": true
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
| sort | string | 排序: newest, popular, last_reply |
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
      "data": [],
      "pagination": {}
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
  "title": "string",
  "content": "string",
  "tags": ["string"]
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
Authorization: Bearer {token}
```

**请求体**
```json
{
  "is_pinned": true
}
```

---

### 7. 锁定/解锁主题

**PATCH** `/threads/{id}/lock`

锁定或解锁主题（需要版主权限）。

**请求头**
```
Authorization: Bearer {token}
```

**请求体**
```json
{
  "is_locked": true
}
```

---

## 回复 API

### 1. 获取回复列表

**GET** `/threads/{thread_id}/replies`

获取指定主题下的回复列表。

**路径参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| thread_id | string | 主题 ID |

**查询参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20 |
| sort | string | 排序: oldest, newest |

**响应**
```json
{
  "success": true,
  "data": {
    "replies": [
      {
        "id": "uuid",
        "content": "string",
        "author": {
          "id": "uuid",
          "username": "string",
          "avatar_url": "string",
          "reputation": 100
        },
        "thread_id": "uuid",
        "parent_id": "uuid",
        "like_count": 10,
        "is_edited": false,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
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

### 2. 创建回复

**POST** `/threads/{thread_id}/replies`

在指定主题下创建回复。

**请求头**
```
Authorization: Bearer {token}
```

**请求体**
```json
{
  "content": "string",
  "parent_id": "uuid"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "string",
    "author_id": "uuid",
    "thread_id": "uuid",
    "parent_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. 更新回复

**PUT** `/replies/{id}`

更新回复内容（仅作者可编辑，且创建时间30分钟内）。

**请求头**
```
Authorization: Bearer {token}
```

**请求体**
```json
{
  "content": "string"
}
```

---

### 4. 删除回复

**DELETE** `/replies/{id}`

删除回复（仅作者或管理员可删除）。

**请求头**
```
Authorization: Bearer {token}
```

---

### 5. 点赞/取消点赞回复

**POST** `/replies/{id}/like`

点赞或取消点赞回复。

**请求头**
```
Authorization: Bearer {token}
```

**请求体**
```json
{
  "action": "like"
}
```

---

## 通知 API

### 1. 获取通知列表

**GET** `/notifications`

获取当前用户的通知列表。

**请求头**
```
Authorization: Bearer {token}
```

**查询参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20 |
| unread_only | boolean | 仅显示未读，默认 false |

**响应**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "reply",
        "title": "string",
        "content": "string",
        "is_read": false,
        "sender": {
          "id": "uuid",
          "username": "string",
          "avatar_url": "string"
        },
        "target": {
          "type": "thread",
          "id": "uuid",
          "title": "string"
        },
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "unread_count": 5,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

**通知类型**
- `reply` - 回复通知
- `mention` - @提及通知
- `like` - 点赞通知
- `follow` - 关注通知
- `system` - 系统通知

---

### 2. 标记通知为已读

**PATCH** `/notifications/{id}/read`

将指定通知标记为已读。

**请求头**
```
Authorization: Bearer {token}
```

---

### 3. 标记所有通知为已读

**PATCH** `/notifications/read-all`

将所有通知标记为已读。

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "marked_count": 10
}
```

---

### 4. 删除通知

**DELETE** `/notifications/{id}`

删除指定通知。

**请求头**
```
Authorization: Bearer {token}
```

---

## 通用错误响应

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### HTTP 状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 验证失败 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 错误码列表

| 错误码 | 描述 |
|--------|------|
| INVALID_REQUEST | 请求格式错误 |
| UNAUTHORIZED | 未提供认证信息 |
| TOKEN_EXPIRED | 令牌已过期 |
| FORBIDDEN | 权限不足 |
| RESOURCE_NOT_FOUND | 资源不存在 |
| VALIDATION_ERROR | 数据验证失败 |
| RATE_LIMITED | 请求频率超限 |
| INTERNAL_ERROR | 服务器内部错误 |

---

## 分页说明

列表接口均支持分页，默认每页 20 条记录。

**请求参数**
- `page`: 页码，从 1 开始
- `limit`: 每页数量，最大 100

**响应格式**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```
