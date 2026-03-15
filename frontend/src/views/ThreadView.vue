<template>
  <div class="thread-view">
    <div v-if="forumStore.isLoading" class="loading">
      Loading thread...
    </div>

    <div v-else-if="forumStore.error" class="error">
      {{ forumStore.error }}
    </div>

    <template v-else-if="forumStore.activeThread">
      <div class="thread-header">
        <div class="breadcrumbs">
          <router-link to="/">Home</router-link>
          <span>/</span>
          <router-link :to="`/board/${forumStore.activeThread.forum.slug}`">
            {{ forumStore.activeThread.forum.name }}
          </router-link>
          <span>/</span>
          <span class="current">{{ forumStore.activeThread.title }}</span>
        </div>
        <h1>{{ forumStore.activeThread.title }}</h1>
        <div class="thread-actions">
          <span v-if="forumStore.activeThread.is_pinned" class="badge pinned">📌 Pinned</span>
          <span v-if="forumStore.activeThread.is_locked" class="badge locked">🔒 Locked</span>
        </div>
      </div>

      <!-- Original Post -->
      <div class="post-card original-post">
        <div class="post-author">
          <img
            v-if="forumStore.activeThread.author.avatar_url"
            :src="forumStore.activeThread.author.avatar_url"
            :alt="forumStore.activeThread.author.username"
            class="author-avatar"
          >
          <div v-else class="author-avatar-placeholder">👤</div>
          <div class="author-info">
            <span class="author-name">{{ forumStore.activeThread.author.username }}</span>
            <span class="author-reputation">⭐ {{ forumStore.activeThread.author.reputation }}</span>
          </div>
        </div>
        <div class="post-content">
          <div class="post-body">{{ forumStore.activeThread.content }}</div>
          <div class="post-meta">
            <span>Posted: {{ formatDate(forumStore.activeThread.created_at) }}</span>
            <span v-if="forumStore.activeThread.updated_at !== forumStore.activeThread.created_at">
              (edited)
            </span>
          </div>
          <div v-if="forumStore.activeThread.tags.length > 0" class="post-tags">
            <span v-for="tag in forumStore.activeThread.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- Replies -->
      <div class="replies-section">
        <h2>{{ forumStore.activeThread.reply_count }} Replies</h2>

        <div v-if="forumStore.postList.length === 0" class="empty">
          No replies yet. Be the first to reply!
        </div>

        <div
          v-for="post in forumStore.postList"
          :key="post.id"
          class="post-card"
          :id="`post-${post.id}`"
        >
          <div class="post-author">
            <img
              v-if="post.author.avatar_url"
              :src="post.author.avatar_url"
              :alt="post.author.username"
              class="author-avatar"
            >
            <div v-else class="author-avatar-placeholder">👤</div>
            <div class="author-info">
              <span class="author-name">{{ post.author.username }}</span>
              <span class="author-reputation">⭐ {{ post.author.reputation }}</span>
            </div>
          </div>
          <div class="post-content">
            <div class="post-body">{{ post.content }}</div>
            <div class="post-meta">
              <span>Posted: {{ formatDate(post.created_at) }}</span>
              <span v-if="post.is_edited">(edited)</span>
            </div>
            <div class="post-actions">
              <button
                v-if="authStore.isAuthenticated && !forumStore.activeThread.is_locked"
                class="btn-link"
                @click="replyToPost(post.id)"
              >
                Reply
              </button>
              <button
                v-if="authStore.isAuthenticated"
                class="btn-link"
                @click="likePost(post.id)"
              >
                👍 {{ post.like_count }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="forumStore.postsPagination" class="pagination">
          <button
            :disabled="!forumStore.postsPagination.hasPrev"
            @click="changePage(forumStore.postsPagination.page - 1)"
          >
            Previous
          </button>
          <span>Page {{ forumStore.postsPagination.page }} of {{ forumStore.postsPagination.totalPages }}</span>
          <button
            :disabled="!forumStore.postsPagination.hasNext"
            @click="changePage(forumStore.postsPagination.page + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Reply Form -->
      <div v-if="authStore.isAuthenticated && !forumStore.activeThread.is_locked" class="reply-section">
        <h3>Post a Reply</h3>
        <form @submit.prevent="submitReply">
          <div class="form-group">
            <textarea
              v-model="replyContent"
              rows="4"
              placeholder="Write your reply..."
              required
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="forumStore.isLoading || !replyContent.trim()">
              {{ forumStore.isLoading ? 'Posting...' : 'Post Reply' }}
            </button>
          </div>
        </form>
      </div>

      <div v-else-if="!authStore.isAuthenticated" class="login-prompt">
        <router-link to="/login">Login</router-link> to post a reply
      </div>

      <div v-else-if="forumStore.activeThread.is_locked" class="locked-notice">
        🔒 This thread is locked. No new replies can be posted.
      </div>
    </template>

    <div v-else class="not-found">
      Thread not found
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

const replyContent = ref('')
const replyToId = ref<string | undefined>(undefined)

onMounted(() => {
  loadThread()
})

watch(() => route.params.id, () => {
  loadThread()
})

async function loadThread() {
  const threadId = route.params.id as string
  if (threadId) {
    await forumStore.fetchThread(threadId)
  }
}

function changePage(page: number) {
  const threadId = route.params.id as string
  forumStore.fetchThread(threadId, page)
}

function replyToPost(postId: string) {
  replyToId.value = postId
  replyContent.value = `@${forumStore.postList.find(p => p.id === postId)?.author.username} `
  // Scroll to reply form
  document.querySelector('.reply-section')?.scrollIntoView({ behavior: 'smooth' })
}

async function submitReply() {
  const threadId = route.params.id as string
  if (!replyContent.value.trim()) return

  try {
    await forumStore.createPost(threadId, {
      content: replyContent.value,
      parent_id: replyToId.value,
    })
    replyContent.value = ''
    replyToId.value = undefined
  } catch (err) {
    // Error is handled by store
  }
}

async function likePost(postId: string) {
  try {
    await forumStore.likePost(postId, 'like')
  } catch (err) {
    // Error is handled by store
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>

<style scoped>
.thread-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.loading,
.error,
.empty,
.not-found,
.locked-notice,
.login-prompt {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error {
  color: #dc3545;
}

.locked-notice {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  color: #856404;
}

.thread-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.breadcrumbs a {
  color: #007bff;
  text-decoration: none;
}

.breadcrumbs a:hover {
  text-decoration: underline;
}

.breadcrumbs .current {
  color: #333;
  font-weight: 500;
}

.thread-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.thread-actions {
  display: flex;
  gap: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.pinned {
  background: #007bff;
  color: #fff;
}

.badge.locked {
  background: #dc3545;
  color: #fff;
}

.post-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 1.5rem;
}

.post-card.original-post {
  background: #f8f9fa;
  border-left: 4px solid #007bff;
}

.post-author {
  flex-shrink: 0;
  width: 120px;
  text-align: center;
}

.author-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.5rem;
}

.author-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 0.5rem;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.author-name {
  font-weight: 600;
  color: #333;
}

.author-reputation {
  font-size: 0.85rem;
  color: #666;
}

.post-content {
  flex: 1;
}

.post-body {
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 1rem;
}

.post-meta {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.post-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-link {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.replies-section {
  margin-top: 2rem;
}

.replies-section h2 {
  margin-bottom: 1rem;
  color: #333;
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

.reply-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.reply-section h3 {
  margin: 0 0 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
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

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
