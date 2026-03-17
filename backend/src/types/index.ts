// 通用类型定义

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 请求体类型
export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface CreateBoardBody {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateBoardBody {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateThreadBody {
  title: string;
  content: string;
}

export interface UpdateThreadBody {
  title?: string;
  content?: string;
}

export interface CreatePostBody {
  content: string;
  parentId?: string;
}

export interface UpdatePostBody {
  content: string;
}
