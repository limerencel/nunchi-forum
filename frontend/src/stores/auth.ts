/**
 * Authentication Store
 * Manages user authentication state using Pinia
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi, tokenManager } from '@/services/api'
import type { User, UserLoginRequest, UserRegisterRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!tokenManager.getToken())
  const currentUser = computed(() => user.value)
  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isModerator = computed(() => user.value?.role === 'moderator' || user.value?.role === 'admin')

  // Actions
  async function initialize() {
    if (isInitialized.value) return

    const token = tokenManager.getToken()
    if (token) {
      try {
        isLoading.value = true
        const userData = await authApi.getCurrentUser()
        user.value = userData
      } catch (err) {
        // Token invalid, clear it
        tokenManager.clearTokens()
        user.value = null
      } finally {
        isLoading.value = false
        isInitialized.value = true
      }
    } else {
      isInitialized.value = true
    }
  }

  async function login(credentials: UserLoginRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login(credentials)
      user.value = response.user
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function register(userData: UserRegisterRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.register(userData)
      user.value = response.user
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true

    try {
      await authApi.logout()
    } finally {
      user.value = null
      isLoading.value = false
    }
  }

  async function fetchCurrentUser() {
    if (!tokenManager.getToken()) return

    isLoading.value = true
    try {
      const userData = await authApi.getCurrentUser()
      user.value = userData
      return userData
    } catch (err) {
      user.value = null
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    isLoading,
    error,
    isInitialized,

    // Getters
    isAuthenticated,
    currentUser,
    userRole,
    isAdmin,
    isModerator,

    // Actions
    initialize,
    login,
    register,
    logout,
    fetchCurrentUser,
    clearError,
  }
})
