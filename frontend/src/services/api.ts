/**
 * API Service Layer
 * Handles HTTP requests with interceptors for authentication and error handling
 */

import type {
  ApiResponse,
  ApiError,
  User,
  UserLoginRequest,
  UserRegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  Board,
  BoardDetail,
  BoardListResponse,
  BoardQueryParams,
  CreateBoardRequest,
  UpdateBoardRequest,
  Thread,
  ThreadDetail,
  ThreadListResponse,
  ThreadDetailResponse,
  ThreadQueryParams,
  CreateThreadRequest,
  UpdateThreadRequest,
  PinThreadRequest,
  LockThreadRequest,
  Post,
  PostListResponse,
  PostQueryParams,
  CreatePostRequest,
  UpdatePostRequest,
  LikePostRequest,
  Notification,
  NotificationListResponse,
} from '@/types'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

// Token storage keys
const TOKEN_KEY = 'nunchi_token'
const REFRESH_TOKEN_KEY = 'nunchi_refresh_token'

// Custom error class for API errors
export class ApiErrorClass extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Token management
export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// Request helper with interceptors
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  // Default headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  // Add auth token if available
  const token = tokenManager.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle 401 - Token expired
    if (response.status === 401 && retry) {
      const refreshToken = tokenManager.getRefreshToken()
      if (refreshToken) {
        try {
          const newToken = await authApi.refreshToken({ refreshToken })
          tokenManager.setToken(newToken.token)
          // Retry the original request
          return apiRequest(endpoint, options, false)
        } catch {
          // Refresh failed, clear tokens and throw
          tokenManager.clearTokens()
          window.location.href = '/login'
          throw new ApiErrorClass('TOKEN_EXPIRED', 'Session expired, please login again', 401)
        }
      }
    }

    // Parse response
    let data: ApiResponse<T> | ApiError
    try {
      data = await response.json()
    } catch {
      // Non-JSON response
      if (!response.ok) {
        throw new ApiErrorClass('HTTP_ERROR', `HTTP ${response.status}: ${response.statusText}`, response.status)
      }
      return {} as T
    }

    // Handle error response
    if (!response.ok || !data.success) {
      const errorData = data as ApiError
      throw new ApiErrorClass(
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.message || 'An error occurred',
        response.status,
        errorData.error?.details,
      )
    }

    return (data as ApiResponse<T>).data
  } catch (error) {
    if (error instanceof ApiErrorClass) {
      throw error
    }
    // Network or other errors
    throw new ApiErrorClass('NETWORK_ERROR', error instanceof Error ? error.message : 'Network error')
  }
}

// Auth API
export const authApi = {
  async login(credentials: UserLoginRequest): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    // Store tokens
    tokenManager.setToken(data.token)
    tokenManager.setRefreshToken(data.refreshToken)
    return data
  },

  async register(userData: UserRegisterRequest): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    // Store tokens
    tokenManager.setToken(data.token)
    tokenManager.setRefreshToken(data.refreshToken)
    return data
  },

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return apiRequest<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      tokenManager.clearTokens()
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiRequest<User>('/auth/me')
  },
}

// Board (Forum) API
export const boardApi = {
  async getBoards(params?: BoardQueryParams): Promise<BoardListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sort) queryParams.append('sort', params.sort)

    const query = queryParams.toString()
    return apiRequest<BoardListResponse>(`/boards${query ? `?${query}` : ''}`)
  },

  async getBoard(idOrSlug: string): Promise<BoardDetail> {
    return apiRequest<BoardDetail>(`/boards/${idOrSlug}`)
  },

  async createBoard(boardData: CreateBoardRequest): Promise<Board> {
    return apiRequest<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify(boardData),
    })
  },

  async updateBoard(id: string, boardData: UpdateBoardRequest): Promise<Board> {
    return apiRequest<Board>(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(boardData),
    })
  },

  async deleteBoard(id: string): Promise<void> {
    return apiRequest<void>(`/boards/${id}`, { method: 'DELETE' })
  },
}

// Thread API
export const threadApi = {
  async getThreads(forumId: string, params?: ThreadQueryParams): Promise<ThreadListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.tag) queryParams.append('tag', params.tag)

    const query = queryParams.toString()
    return apiRequest<ThreadListResponse>(`/boards/${forumId}/threads${query ? `?${query}` : ''}`)
  },

  async getThread(id: string, page?: number, limit?: number): Promise<ThreadDetailResponse> {
    const queryParams = new URLSearchParams()
    if (page) queryParams.append('page', page.toString())
    if (limit) queryParams.append('limit', limit.toString())

    const query = queryParams.toString()
    return apiRequest<ThreadDetailResponse>(`/threads/${id}${query ? `?${query}` : ''}`)
  },

  async createThread(forumId: string, threadData: CreateThreadRequest): Promise<Thread> {
    return apiRequest<Thread>(`/boards/${forumId}/threads`, {
      method: 'POST',
      body: JSON.stringify(threadData),
    })
  },

  async updateThread(id: string, threadData: UpdateThreadRequest): Promise<Thread> {
    return apiRequest<Thread>(`/threads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(threadData),
    })
  },

  async deleteThread(id: string): Promise<void> {
    return apiRequest<void>(`/threads/${id}`, { method: 'DELETE' })
  },

  async pinThread(id: string, data: PinThreadRequest): Promise<Thread> {
    return apiRequest<Thread>(`/threads/${id}/pin`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async lockThread(id: string, data: LockThreadRequest): Promise<Thread> {
    return apiRequest<Thread>(`/threads/${id}/lock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

// Post (Reply) API
export const postApi = {
  async getPosts(threadId: string, params?: PostQueryParams): Promise<PostListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sort) queryParams.append('sort', params.sort)

    const query = queryParams.toString()
    return apiRequest<PostListResponse>(`/threads/${threadId}/replies${query ? `?${query}` : ''}`)
  },

  async createPost(threadId: string, postData: CreatePostRequest): Promise<Post> {
    return apiRequest<Post>(`/threads/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  },

  async updatePost(id: string, postData: UpdatePostRequest): Promise<Post> {
    return apiRequest<Post>(`/replies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    })
  },

  async deletePost(id: string): Promise<void> {
    return apiRequest<void>(`/replies/${id}`, { method: 'DELETE' })
  },

  async likePost(id: string, action: 'like' | 'unlike'): Promise<{ like_count: number }> {
    return apiRequest<{ like_count: number }>(`/replies/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
  },
}

// Notification API
export const notificationApi = {
  async getNotifications(page?: number, limit?: number, unreadOnly?: boolean): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams()
    if (page) queryParams.append('page', page.toString())
    if (limit) queryParams.append('limit', limit.toString())
    if (unreadOnly) queryParams.append('unread_only', 'true')

    const query = queryParams.toString()
    return apiRequest<NotificationListResponse>(`/notifications${query ? `?${query}` : ''}`)
  },

  async markAsRead(id: string): Promise<void> {
    return apiRequest<void>(`/notifications/${id}/read`, { method: 'PATCH' })
  },

  async markAllAsRead(): Promise<{ marked_count: number }> {
    return apiRequest<{ marked_count: number }>('/notifications/read-all', { method: 'PATCH' })
  },

  async deleteNotification(id: string): Promise<void> {
    return apiRequest<void>(`/notifications/${id}`, { method: 'DELETE' })
  },
}

// Export all APIs
export default {
  auth: authApi,
  board: boardApi,
  thread: threadApi,
  post: postApi,
  notification: notificationApi,
  tokenManager,
  ApiError: ApiErrorClass,
}
