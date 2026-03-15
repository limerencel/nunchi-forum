# Nunchi Forum 数据库表结构文档

## 概述

- **数据库类型**: PostgreSQL
- **ORM**: Drizzle ORM
- **编码**: UTF-8

---

## 表结构详情

### 1. users (用户表)

存储用户账户信息

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| username | varchar(32) | NOT NULL, UNIQUE | - | 用户名 |
| email | varchar(255) | NOT NULL, UNIQUE | - | 邮箱 |
| password_hash | varchar(255) | NOT NULL | - | 密码哈希 |
| avatar_url | varchar(500) | - | NULL | 头像URL |
| bio | text | - | NULL | 个人简介 |
| role | enum | NOT NULL | 'user' | 角色: admin/moderator/user |
| status | enum | NOT NULL | 'inactive' | 状态: active/banned/inactive |
| last_login | timestamp | - | NULL | 最后登录时间 |
| created_at | timestamp | NOT NULL | now() | 创建时间 |
| updated_at | timestamp | NOT NULL | now() | 更新时间 |

**索引:**
- `idx_users_username` on username
- `idx_users_email` on email
- `idx_users_status` on status

---

### 2. boards (板块表)

存储论坛板块信息

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| name | varchar(100) | NOT NULL | - | 板块名称 |
| slug | varchar(100) | NOT NULL, UNIQUE | - | URL友好的标识 |
| description | text | - | NULL | 板块描述 |
| sort_order | integer | NOT NULL | 0 | 排序顺序 |
| thread_count | integer | NOT NULL | 0 | 主题数统计 |
| post_count | integer | NOT NULL | 0 | 回复数统计 |
| created_at | timestamp | NOT NULL | now() | 创建时间 |
| updated_at | timestamp | NOT NULL | now() | 更新时间 |

**索引:**
- `idx_boards_slug` on slug
- `idx_boards_sort_order` on sort_order

---

### 3. threads (主题表)

存储主题帖信息

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| board_id | uuid | NOT NULL, FK → boards | - | 所属板块 |
| author_id | uuid | NOT NULL, FK → users | - | 作者 |
| title | varchar(200) | NOT NULL | - | 标题 |
| content | text | NOT NULL | - | 内容 |
| view_count | integer | NOT NULL | 0 | 浏览次数 |
| reply_count | integer | NOT NULL | 0 | 回复数统计 |
| like_count | integer | NOT NULL | 0 | 点赞数统计 |
| bookmark_count | integer | NOT NULL | 0 | 收藏数统计 |
| is_pinned | boolean | NOT NULL | false | 是否置顶 |
| is_locked | boolean | NOT NULL | false | 是否锁定 |
| is_deleted | boolean | NOT NULL | false | 是否删除 |
| last_reply_at | timestamp | - | NULL | 最后回复时间 |
| last_reply_user_id | uuid | FK → users | NULL | 最后回复用户 |
| created_at | timestamp | NOT NULL | now() | 创建时间 |
| updated_at | timestamp | NOT NULL | now() | 更新时间 |

**索引:**
- `idx_threads_board_id` on board_id
- `idx_threads_author_id` on author_id
- `idx_threads_created_at` on created_at
- `idx_threads_is_pinned` on is_pinned
- `idx_threads_last_reply_at` on last_reply_at

---

### 4. posts (回复表)

存储主题回复信息

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| thread_id | uuid | NOT NULL, FK → threads | - | 所属主题 |
| author_id | uuid | NOT NULL, FK → users | - | 作者 |
| parent_id | uuid | FK → posts | NULL | 父回复ID(引用) |
| content | text | NOT NULL | - | 内容 |
| like_count | integer | NOT NULL | 0 | 点赞数统计 |
| is_deleted | boolean | NOT NULL | false | 是否删除 |
| created_at | timestamp | NOT NULL | now() | 创建时间 |
| updated_at | timestamp | NOT NULL | now() | 更新时间 |

**索引:**
- `idx_posts_thread_id` on thread_id
- `idx_posts_author_id` on author_id
- `idx_posts_parent_id` on parent_id
- `idx_posts_created_at` on created_at

---

### 5. likes (点赞表)

存储用户点赞记录

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| user_id | uuid | NOT NULL, FK → users | - | 点赞用户 |
| target_type | enum | NOT NULL | - | 目标类型: thread/post |
| target_id | uuid | NOT NULL | - | 目标ID |
| created_at | timestamp | NOT NULL | now() | 创建时间 |

**索引:**
- `idx_likes_user_id` on user_id
- `idx_likes_target` on (target_type, target_id)
- `idx_likes_unique` UNIQUE on (user_id, target_type, target_id)

---

### 6. bookmarks (收藏表)

存储用户收藏记录

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| user_id | uuid | NOT NULL, FK → users | - | 收藏用户 |
| thread_id | uuid | NOT NULL, FK → threads | - | 收藏主题 |
| created_at | timestamp | NOT NULL | now() | 创建时间 |

**索引:**
- `idx_bookmarks_user_id` on user_id
- `idx_bookmarks_thread_id` on thread_id
- `idx_bookmarks_unique` UNIQUE on (user_id, thread_id)

---

### 7. notifications (通知表)

存储用户通知

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| user_id | uuid | NOT NULL, FK → users | - | 接收用户 |
| actor_id | uuid | FK → users | NULL | 触发用户 |
| type | enum | NOT NULL | - | 类型: reply/like/mention/system |
| target_type | varchar(50) | - | NULL | 目标类型 |
| target_id | uuid | - | NULL | 目标ID |
| message | varchar(500) | NOT NULL | - | 通知内容 |
| is_read | boolean | NOT NULL | false | 是否已读 |
| created_at | timestamp | NOT NULL | now() | 创建时间 |

**索引:**
- `idx_notifications_user_id` on user_id
- `idx_notifications_is_read` on is_read
- `idx_notifications_created_at` on created_at

---

## 外键关系

| 子表 | 字段 | 父表 | 字段 | 删除行为 |
|------|------|------|------|----------|
| threads | board_id | boards | id | CASCADE |
| threads | author_id | users | id | CASCADE |
| threads | last_reply_user_id | users | id | SET NULL |
| posts | thread_id | threads | id | CASCADE |
| posts | author_id | users | id | CASCADE |
| posts | parent_id | posts | id | SET NULL |
| likes | user_id | users | id | CASCADE |
| bookmarks | user_id | users | id | CASCADE |
| bookmarks | thread_id | threads | id | CASCADE |
| notifications | user_id | users | id | CASCADE |
| notifications | actor_id | users | id | SET NULL |

---

## 触发器

### 自动更新时间戳

所有表都有 `updated_at` 字段，通过触发器自动更新：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 统计字段自动更新

- threads.reply_count 在 posts 插入/删除时自动更新
- threads.like_count 在 likes 插入/删除时自动更新
- threads.bookmark_count 在 bookmarks 插入/删除时自动更新
- boards.thread_count 在 threads 插入/删除时自动更新
- boards.post_count 在 posts 插入/删除时自动更新
