# Nunchi Forum ER 图

## 实体关系图

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     users       │         │     boards      │         │    threads      │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ PK id           │         │ PK id           │         │ PK id           │
│    username     │         │    name         │         │ FK board_id     │
│    email        │         │    slug         │         │ FK author_id    │
│    password_hash│         │    description  │         │    title        │
│    avatar_url   │         │    sort_order   │         │    content      │
│    role         │         │    created_at   │         │    view_count   │
│    status       │         │    updated_at   │         │    is_pinned    │
│    last_login   │         └────────┬────────┘         │    is_locked    │
│    created_at   │                  │                  │    created_at   │
│    updated_at   │                  │                  │    updated_at   │
└────────┬────────┘                  │                  └────────┬────────┘
         │                          │                           │
         │                          │         ┌─────────────────┘
         │                          │         │
         │         ┌────────────────┘         │
         │         │                          │
         │    ┌────┴────┐                     │
         │    │         │                     │
┌────────┴────┴──┐ ┌────┴────┐          ┌────┴────┐
│     posts      │ │  likes  │          │bookmarks│
├────────────────┤ ├─────────┤          ├─────────┤
│ PK id          │ │ PK id   │          │ PK id   │
│ FK thread_id   │ │ FK user_id         │ FK user_id
│ FK author_id   │ │ FK target_type     │ FK thread_id
│ FK parent_id   │ │ FK target_id       │    created_at
│    content     │ │    type            │         │
│    is_deleted  │ │    created_at      │         │
│    created_at  │ └─────────┘          │         │
│    updated_at  │                      │         │
└────────────────┘                      │         │
                                        │         │
                              ┌─────────┴─────────┴─────────┐
                              │       notifications         │
                              ├─────────────────────────────┤
                              │ PK id                       │
                              │ FK user_id                  │
                              │ FK actor_id                 │
                              │    type                     │
                              │    target_type              │
                              │    target_id                │
                              │    message                  │
                              │    is_read                  │
                              │    created_at               │
                              └─────────────────────────────┘
```

## 关系说明

### 1. users (用户)
- **一对多** → threads: 用户可以创建多个主题帖
- **一对多** → posts: 用户可以发表多个回复
- **一对多** → likes: 用户可以点赞多个内容
- **一对多** → bookmarks: 用户可以收藏多个主题
- **一对多** → notifications: 用户可以接收多个通知

### 2. boards (板块)
- **一对多** → threads: 一个板块包含多个主题帖

### 3. threads (主题帖)
- **多对一** → boards: 主题属于一个板块
- **多对一** → users: 主题由用户创建
- **一对多** → posts: 主题包含多个回复
- **一对多** → bookmarks: 主题可以被多个用户收藏

### 4. posts (回复)
- **多对一** → threads: 回复属于一个主题
- **多对一** → users: 回复由用户创建
- **自引用** → posts: 回复可以引用其他回复 (parent_id)

### 5. likes (点赞)
- **多对一** → users: 点赞由用户创建
- **多态关联** → threads/posts: 可以点赞主题或回复

### 6. bookmarks (收藏)
- **多对一** → users: 收藏由用户创建
- **多对一** → threads: 收藏指向主题

### 7. notifications (通知)
- **多对一** → users: 通知接收者
- **多对一** → users (actor): 触发通知的用户

## 枚举类型

### user_role
- `admin` - 管理员
- `moderator` - 版主
- `user` - 普通用户

### user_status
- `active` - 活跃
- `banned` - 封禁
- `inactive` - 未激活

### notification_type
- `reply` - 回复通知
- `like` - 点赞通知
- `mention` - 提及通知
- `system` - 系统通知

### like_type
- `thread` - 点赞主题
- `post` - 点赞回复
