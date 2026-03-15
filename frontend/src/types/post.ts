/**
 * Post (Reply) related type definitions
 */

export interface PostAuthor {
  id: string
  username: string
  avatar_url?: string
  reputation: number
}

export interface Post {
  id: string
  content: string
  author: PostAuthor
  thread_id: string
  parent_id?: string
  like_count: number
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface CreatePostRequest {
  content: string
  parent_id?: string
}

export interface UpdatePostRequest {
  content: string
}

export interface PostListResponse {
  replies: Post[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface PostQueryParams {
  page?: number
  limit?: number
  sort?: 'oldest' | 'newest'
}

export interface LikePostRequest {
  action: 'like' | 'unlike'
}

export interface LikePostResponse {
  success: boolean
  like_count: number
}
