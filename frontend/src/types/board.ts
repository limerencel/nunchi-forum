/**
 * Board (Forum) related type definitions
 */

export interface Moderator {
  id: string
  username: string
  avatar_url?: string
}

export interface Board {
  id: string
  name: string
  slug: string
  description: string
  icon_url?: string
  thread_count: number
  post_count: number
  last_activity?: string
  is_public: boolean
}

export interface BoardDetail extends Board {
  rules?: string
  banner_url?: string
  moderators: Moderator[]
  created_at: string
}

export interface CreateBoardRequest {
  name: string
  slug: string
  description: string
  rules?: string
  is_public: boolean
}

export interface UpdateBoardRequest {
  name?: string
  description?: string
  rules?: string
  icon_url?: string
  banner_url?: string
  is_public?: boolean
}

export interface BoardListResponse {
  forums: Board[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface BoardQueryParams {
  page?: number
  limit?: number
  sort?: 'newest' | 'popular' | 'name'
}
