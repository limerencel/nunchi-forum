import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== Enums ====================

export const userRoleEnum = pgEnum('user_role', ['admin', 'moderator', 'user']);
export const userStatusEnum = pgEnum('user_status', ['active', 'banned', 'inactive']);
export const notificationTypeEnum = pgEnum('notification_type', [
  'reply',
  'like',
  'mention',
  'system',
]);
export const likeTargetTypeEnum = pgEnum('like_target_type', ['thread', 'post']);

// ==================== Tables ====================

/**
 * 用户表
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 32 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    bio: text('bio'),
    role: userRoleEnum('role').notNull().default('user'),
    status: userStatusEnum('status').notNull().default('inactive'),
    lastLogin: timestamp('last_login', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_users_username').on(table.username),
    index('idx_users_email').on(table.email),
    index('idx_users_status').on(table.status),
  ]
);

/**
 * 板块表
 */
export const boards = pgTable(
  'boards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    threadCount: integer('thread_count').notNull().default(0),
    postCount: integer('post_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_boards_slug').on(table.slug),
    index('idx_boards_sort_order').on(table.sortOrder),
  ]
);

/**
 * 主题表
 */
export const threads = pgTable(
  'threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    boardId: uuid('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    viewCount: integer('view_count').notNull().default(0),
    replyCount: integer('reply_count').notNull().default(0),
    likeCount: integer('like_count').notNull().default(0),
    bookmarkCount: integer('bookmark_count').notNull().default(0),
    isPinned: boolean('is_pinned').notNull().default(false),
    isLocked: boolean('is_locked').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    lastReplyAt: timestamp('last_reply_at', { withTimezone: true }),
    lastReplyUserId: uuid('last_reply_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_threads_board_id').on(table.boardId),
    index('idx_threads_author_id').on(table.authorId),
    index('idx_threads_created_at').on(table.createdAt),
    index('idx_threads_is_pinned').on(table.isPinned),
    index('idx_threads_last_reply_at').on(table.lastReplyAt),
  ]
);

/**
 * 回复表
 */
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    content: text('content').notNull(),
    likeCount: integer('like_count').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_posts_thread_id').on(table.threadId),
    index('idx_posts_author_id').on(table.authorId),
    index('idx_posts_parent_id').on(table.parentId),
    index('idx_posts_created_at').on(table.createdAt),
  ]
);

/**
 * 点赞表
 */
export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: likeTargetTypeEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_likes_user_id').on(table.userId),
    index('idx_likes_target').on(table.targetType, table.targetId),
    uniqueIndex('idx_likes_unique').on(table.userId, table.targetType, table.targetId),
  ]
);

/**
 * 收藏表
 */
export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_bookmarks_user_id').on(table.userId),
    index('idx_bookmarks_thread_id').on(table.threadId),
    uniqueIndex('idx_bookmarks_unique').on(table.userId, table.threadId),
  ]
);

/**
 * 通知表
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    type: notificationTypeEnum('type').notNull(),
    targetType: varchar('target_type', { length: 50 }),
    targetId: uuid('target_id'),
    message: varchar('message', { length: 500 }).notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_notifications_user_id').on(table.userId),
    index('idx_notifications_is_read').on(table.isRead),
    index('idx_notifications_created_at').on(table.createdAt),
  ]
);

// ==================== Relations ====================

export const usersRelations = relations(users, ({ many }) => ({
  threads: many(threads),
  posts: many(posts),
  likes: many(likes),
  bookmarks: many(bookmarks),
  notifications: many(notifications, { relationName: 'userNotifications' }),
  actorNotifications: many(notifications, { relationName: 'actorNotifications' }),
}));

export const boardsRelations = relations(boards, ({ many }) => ({
  threads: many(threads),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  board: one(boards, {
    fields: [threads.boardId],
    references: [boards.id],
  }),
  author: one(users, {
    fields: [threads.authorId],
    references: [users.id],
  }),
  posts: many(posts),
  bookmarks: many(bookmarks),
  lastReplyUser: one(users, {
    fields: [threads.lastReplyUserId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  thread: one(threads, {
    fields: [posts.threadId],
    references: [threads.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  parent: one(posts, {
    fields: [posts.parentId],
    references: [posts.id],
  }),
  children: many(posts),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  thread: one(threads, {
    fields: [bookmarks.threadId],
    references: [threads.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: 'userNotifications',
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: 'actorNotifications',
  }),
}));

// ==================== Types ====================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
