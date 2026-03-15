/**
 * Forum Store
 * Manages forum data state including boards, threads, and posts
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { boardApi, threadApi, postApi } from '@/services/api'
import type {
  Board,
  BoardDetail,
  Thread,
  ThreadDetail,
  Post,
  BoardQueryParams,
  ThreadQueryParams,
  PostQueryParams,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateThreadRequest,
  UpdateThreadRequest,
  CreatePostRequest,
  UpdatePostRequest,
  PaginationInfo,
} from '@/types'

export const useForumStore = defineStore('forum', () => {
  // State - Boards
  const boards = ref<Board[]>([])
  const currentBoard = ref<BoardDetail | null>(null)
  const boardsPagination = ref<PaginationInfo | null>(null)

  // State - Threads
  const threads = ref<Thread[]>([])
  const currentThread = ref<ThreadDetail | null>(null)
  const threadsPagination = ref<PaginationInfo | null>(null)

  // State - Posts
  const posts = ref<Post[]>([])
  const postsPagination = ref<PaginationInfo | null>(null)

  // State - UI
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const boardList = computed(() => boards.value)
  const activeBoard = computed(() => currentBoard.value)
  const threadList = computed(() => threads.value)
  const activeThread = computed(() => currentThread.value)
  const postList = computed(() => posts.value)

  // Actions - Boards
  async function fetchBoards(params?: BoardQueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await boardApi.getBoards(params)
      boards.value = response.forums
      boardsPagination.value = {
        ...response.pagination,
        hasNext: response.pagination.page < response.pagination.totalPages,
        hasPrev: response.pagination.page > 1,
      }
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch boards'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchBoard(idOrSlug: string) {
    isLoading.value = true
    error.value = null

    try {
      const board = await boardApi.getBoard(idOrSlug)
      currentBoard.value = board
      return board
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch board'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createBoard(boardData: CreateBoardRequest) {
    isLoading.value = true
    error.value = null

    try {
      const board = await boardApi.createBoard(boardData)
      boards.value.unshift(board)
      return board
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create board'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateBoard(id: string, boardData: UpdateBoardRequest) {
    isLoading.value = true
    error.value = null

    try {
      const board = await boardApi.updateBoard(id, boardData)
      // Update in list
      const index = boards.value.findIndex(b => b.id === id)
      if (index !== -1) {
        boards.value[index] = { ...boards.value[index], ...board }
      }
      // Update current if matches
      if (currentBoard.value?.id === id) {
        currentBoard.value = { ...currentBoard.value, ...board }
      }
      return board
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update board'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteBoard(id: string) {
    isLoading.value = true
    error.value = null

    try {
      await boardApi.deleteBoard(id)
      boards.value = boards.value.filter(b => b.id !== id)
      if (currentBoard.value?.id === id) {
        currentBoard.value = null
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete board'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Actions - Threads
  async function fetchThreads(forumId: string, params?: ThreadQueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await threadApi.getThreads(forumId, params)
      threads.value = response.threads
      threadsPagination.value = {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: Math.ceil(response.pagination.total / response.pagination.limit),
        hasNext: response.pagination.page * response.pagination.limit < response.pagination.total,
        hasPrev: response.pagination.page > 1,
      }
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch threads'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchThread(id: string, page?: number, limit?: number) {
    isLoading.value = true
    error.value = null

    try {
      const response = await threadApi.getThread(id, page, limit)
      currentThread.value = response.thread
      posts.value = response.replies.data as Post[]
      postsPagination.value = {
        ...response.replies.pagination,
        totalPages: Math.ceil(response.replies.pagination.total / response.replies.pagination.limit),
        hasNext: response.replies.pagination.page * response.replies.pagination.limit < response.replies.pagination.total,
        hasPrev: response.replies.pagination.page > 1,
      }
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch thread'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createThread(forumId: string, threadData: CreateThreadRequest) {
    isLoading.value = true
    error.value = null

    try {
      const thread = await threadApi.createThread(forumId, threadData)
      threads.value.unshift(thread)
      // Update board thread count
      if (currentBoard.value) {
        currentBoard.value.thread_count++
      }
      return thread
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create thread'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateThread(id: string, threadData: UpdateThreadRequest) {
    isLoading.value = true
    error.value = null

    try {
      const thread = await threadApi.updateThread(id, threadData)
      const index = threads.value.findIndex(t => t.id === id)
      if (index !== -1) {
        threads.value[index] = { ...threads.value[index], ...thread }
      }
      if (currentThread.value?.id === id) {
        // Only update if the returned thread has the same structure
        if ('content' in thread) {
          currentThread.value = { ...currentThread.value, ...(thread as unknown as ThreadDetail) }
        }
      }
      return thread
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update thread'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteThread(id: string) {
    isLoading.value = true
    error.value = null

    try {
      await threadApi.deleteThread(id)
      threads.value = threads.value.filter(t => t.id !== id)
      if (currentThread.value?.id === id) {
        currentThread.value = null
      }
      // Update board thread count
      if (currentBoard.value) {
        currentBoard.value.thread_count--
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete thread'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function pinThread(id: string, isPinned: boolean) {
    isLoading.value = true
    error.value = null

    try {
      const thread = await threadApi.pinThread(id, { is_pinned: isPinned })
      const index = threads.value.findIndex(t => t.id === id)
      if (index !== -1) {
        threads.value[index] = { ...threads.value[index], ...thread }
      }
      if (currentThread.value?.id === id) {
        if ('content' in thread) {
          currentThread.value = { ...currentThread.value, ...(thread as unknown as ThreadDetail) }
        }
      }
      return thread
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pin thread'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function lockThread(id: string, isLocked: boolean) {
    isLoading.value = true
    error.value = null

    try {
      const thread = await threadApi.lockThread(id, { is_locked: isLocked })
      const index = threads.value.findIndex(t => t.id === id)
      if (index !== -1) {
        threads.value[index] = { ...threads.value[index], ...thread }
      }
      if (currentThread.value?.id === id) {
        if ('content' in thread) {
          currentThread.value = { ...currentThread.value, ...(thread as unknown as ThreadDetail) }
        }
      }
      return thread
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to lock thread'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Actions - Posts
  async function fetchPosts(threadId: string, params?: PostQueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await postApi.getPosts(threadId, params)
      posts.value = response.replies
      postsPagination.value = {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: Math.ceil(response.pagination.total / response.pagination.limit),
        hasNext: response.pagination.page * response.pagination.limit < response.pagination.total,
        hasPrev: response.pagination.page > 1,
      }
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createPost(threadId: string, postData: CreatePostRequest) {
    isLoading.value = true
    error.value = null

    try {
      const post = await postApi.createPost(threadId, postData)
      posts.value.push(post)
      // Update thread reply count
      if (currentThread.value) {
        currentThread.value.reply_count++
      }
      return post
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updatePost(id: string, postData: UpdatePostRequest) {
    isLoading.value = true
    error.value = null

    try {
      const post = await postApi.updatePost(id, postData)
      const index = posts.value.findIndex(p => p.id === id)
      if (index !== -1) {
        posts.value[index] = { ...posts.value[index], ...post }
      }
      return post
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update post'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deletePost(id: string) {
    isLoading.value = true
    error.value = null

    try {
      await postApi.deletePost(id)
      posts.value = posts.value.filter(p => p.id !== id)
      // Update thread reply count
      if (currentThread.value) {
        currentThread.value.reply_count--
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete post'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function likePost(id: string, action: 'like' | 'unlike') {
    try {
      const result = await postApi.likePost(id, action)
      const index = posts.value.findIndex(p => p.id === id)
      if (index !== -1 && posts.value[index]) {
        posts.value[index] = { ...posts.value[index], like_count: result.like_count }
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to like post'
      error.value = message
      throw err
    }
  }

  // Utility Actions
  function clearError() {
    error.value = null
  }

  function resetState() {
    boards.value = []
    currentBoard.value = null
    threads.value = []
    currentThread.value = null
    posts.value = []
    boardsPagination.value = null
    threadsPagination.value = null
    postsPagination.value = null
    error.value = null
  }

  return {
    // State
    boards,
    currentBoard,
    threads,
    currentThread,
    posts,
    boardsPagination,
    threadsPagination,
    postsPagination,
    isLoading,
    error,

    // Getters
    boardList,
    activeBoard,
    threadList,
    activeThread,
    postList,

    // Actions - Boards
    fetchBoards,
    fetchBoard,
    createBoard,
    updateBoard,
    deleteBoard,

    // Actions - Threads
    fetchThreads,
    fetchThread,
    createThread,
    updateThread,
    deleteThread,
    pinThread,
    lockThread,

    // Actions - Posts
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    likePost,

    // Utility
    clearError,
    resetState,
  }
})