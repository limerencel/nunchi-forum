<template>
  <div class="board-view">
    <div v-if="forumStore.isLoading" class="loading">
      Loading board...
    </div>

    <div v-else-if="forumStore.error" class="error">
      {{ forumStore.error }}
    </div>

    <template v-else-if="forumStore.activeBoard">
      <div class="board-header">
        <div class="board-info">
          <img v-if="forumStore.activeBoard.icon_url" :src="forumStore.activeBoard.icon_url" :alt="forumStore.activeBoard.name" class="board-icon">
          <div v-else class="board-icon-placeholder">📋</div>
          <div>
            <h1>{{ forumStore.activeBoard.name }}</h1>
            <p class="board-description">{{ forumStore.activeBoard.description }}</p>
          </div>
        </div>
        <div class="board-actions">
          <button v-if="authStore.isAuthenticated" class="btn-primary" @click="showCreateThread = true">
            New Thread
          </button>
        </div>
      </div>

      <div v-if="forumStore.activeBoard.rules" class="board-rules">
        <h3>Rules</h3>
        <p>{{ forumStore.activeBoard.rules }}</p>
      </div>

      <div class="threads-list">
        <div class="threads-header">
          <h2>Threads</h2>
          <div class="sort-options">
            <select v-model="sortBy" @change="handleSortChange">
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="last_reply">Last Reply</option>
            </select>
          </div>
        </div>

        <div v-if="forumStore.threadList.length === 0" class="empty">
          No threads yet. Be the first to create one!
        </div>

        <div
          v-for="thread in forumStore.threadList"
          :key="thread.id"
          class="thread-card"
          :class="{ pinned: thread.is_pinned }"
          @click="navigateToThread(thread.id)"
        >
          <div class="thread-status">
            <span v-if="thread.is_pinned" class="badge pinned-badge">📌 Pinned</span>
            <span v-if="thread.is_locked" class="badge locked-badge">🔒 Locked</span>
          </div>
          <div class="thread-content">
            <h3 class="thread-title">{{ thread.title }}</h3>
            <div class="thread-meta">
              <span class="author">
                <img v-if="thread.author.avatar_url" :src="thread.author.avatar_url" :alt="thread.author.username" class="avatar">
                <span v-else class="avatar-placeholder">👤</span>
                {{ thread.author.username }}
              </span>
              <span class="thread-stats">
                {{ thread.reply_count }} replies • {{ thread.view_count }} views
              </span>
              <span v-if="thread.last_reply_at" class="last-reply">
                Last reply: {{ formatDate(thread.last_reply_at) }}
              </span>
            </div>
            <div v-if="thread.tags.length > 0" class="thread-tags">
              <span v-for="tag in thread.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>

        <div v-if="forumStore.threadsPagination" class="pagination">
          <button
            :disabled="!forumStore.threadsPagination.hasPrev"
            @click="changePage(forumStore.threadsPagination.page - 1)"
          >
            Previous
          </button>
          <span>Page {{ forumStore.threadsPagination.page }} of {{ forumStore.threadsPagination.totalPages }}</span>
          <button
            :disabled="!forumStore.threadsPagination.hasNext"
            @click="changePage(forumStore.threadsPagination.page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </template>

    <div v-else class="not-found">
      Board not found
    </div>

    <!-- Create Thread Modal -->
    <div v-if="showCreateThread" class="modal-overlay" @click.self="showCreateThread = false">
      <div class="modal">
        <h2>Create New Thread</h2>
        <form @submit.prevent="createThread">
          <div class="form-group">
            <label>Title</label>
            <input v-model="newThread.title" type="text" required maxlength="200">
          </div>
          <div class="form-group">
            <label>Content</label>
            <textarea v-model="newThread.content" rows="6" required></textarea>
          </div>
          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input v-model="newThread.tagsInput" type="text" placeholder="tag1, tag2, tag3">
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="showCreateThread = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="forumStore.isLoading">
              {{ forumStore.isLoading ? 'Creating...' : 'Create Thread' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForumStore } from '@/stores/forum'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const forumStore = useForumStore()
const authStore = useAuthStore()

const sortBy = ref<'newest' | 'popular' | 'last_reply'>('newest')
const showCreateThread = ref(false)
const newThread = ref({
  title: '',
  content: '',
  tagsInput: '',
})

const boardIdOrSlug = route.params.id as string

onMounted(() => {
  loadBoard()
})

watch(() => route.params.id, () => {
  loadBoard()
})

async function loadBoard() {
  const id = route.params.id as string
  if (id) {
    await forumStore.fetchBoard(id)
    await forumStore.fetchThreads(id, { sort: sortBy.value })
  }
}

function handleSortChange() {
  forumStore.fetchThreads(boardIdOrSlug, { sort: sortBy.value })
}

function changePage(page: number) {
  forumStore.fetchThreads(boardIdOrSlug, { page, sort: sortBy.value })
}

function navigateToThread(threadId: string) {
  router.push(`/thread/${threadId}`)
}

async function createThread() {
  const tags = newThread.value.tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)

  try {
    await forumStore.createThread(boardIdOrSlug, {
      title: newThread.value.title,
      content: newThread.value.content,
      tags,
    })
    showCreateThread.value = false
    newThread.value = { title: '', content: '', tagsInput: '' }
  } catch (err) {
    // Error is handled by store
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>

<style scoped>
.board-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.loading,
.error,
.empty,
.not-found {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error {
  color: #dc3545;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.board-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.board-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
}

.board-icon-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.board-description {
  color: #666;
  margin: 0.5rem 0 0 0;
}

.board-rules {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.board-rules h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.threads-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.threads-header h2 {
  margin: 0;
}

.sort-options select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.thread-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.thread-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thread-card.pinned {
  border-left: 4px solid #007bff;
}

.thread-status {
  margin-bottom: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 0.5rem;
}

.pinned-badge {
  background: #007bff;
  color: #fff;
}

.locked-badge {
  background: #dc3545;
  color: #fff;
}

.thread-title {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1.1rem;
}

.thread-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 1rem;
}

.thread-tags {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 1.5rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>