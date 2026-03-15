/**
 * Type definitions index file
 */

export * from './user'
export * from './board'
export * from './thread'
export * from './post'

// Common response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Notification types
export interface Notification {
  id: string
  type: 'reply' | 'mention' | 'like' | 'follow' | 'system'
  title: string
  content: string
  is_read: boolean
  sender?: {
    id: string
    username: string
    avatar_url?: string
  }
  target?: {
    type: 'thread' | 'post'
    id: string
    title: string
  }
  created_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  unread_count: number
  pagination: PaginationInfo
}
