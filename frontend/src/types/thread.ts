/**
 * Thread related type definitions
 */

import type { User } from './user'
import type { Board } from './board'

export interface ThreadAuthor {
  id: string
  username: string
  avatar_url?: string
}

export interface Thread {
  id: string
  title: string
  author: ThreadAuthor
  forum_id: string
  reply_count: number
  view_count: number
  is_pinned: boolean
  is_locked: boolean
  last_reply_at?: string
  created_at: string
  tags: string[]
}

export interface ThreadDetail {
  id: string
  title: string
  content: string
  author: ThreadAuthor & { reputation: number }
  forum: {
    id: string
    name: string
    slug: string
  }
  reply_count: number
  view_count: number
  is_pinned: boolean
  is_locked: boolean
  created_at: string
  updated_at: string
  tags: string[]
}

export interface CreateThreadRequest {
  title: string
  content: string
  tags?: string[]
}

export interface UpdateThreadRequest {
  title?: string
  content?: string
  tags?: string[]
}

export interface ThreadListResponse {
  threads: Thread[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface ThreadDetailResponse {
  thread: ThreadDetail
  replies: {
    data: unknown[] // Will be replaced with Post[] when imported
    pagination: {
      page: number
      limit: number
      total: number
    }
  }
}

export interface ThreadQueryParams {
  page?: number
  limit?: number
  sort?: 'newest' | 'popular' | 'last_reply'
  tag?: string
}

export interface PinThreadRequest {
  is_pinned: boolean
}

export interface LockThreadRequest {
  is_locked: boolean
}
