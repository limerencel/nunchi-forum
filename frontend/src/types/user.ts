/**
 * User related type definitions
 */

export interface User {
  id: string
  username: string
  email: string
  avatar_url?: string
  bio?: string
  role: 'user' | 'moderator' | 'admin'
  created_at: string
  post_count: number
  reputation: number
}

export interface UserLoginRequest {
  email: string
  password: string
}

export interface UserRegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  expiresIn: number
}

export interface UserProfile extends User {
  updated_at?: string
}
