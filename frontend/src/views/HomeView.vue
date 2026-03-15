<template>
  <div class="home">
    <h1>Nunchi Forum</h1>
    <p>Welcome to the community discussion platform</p>

    <div v-if="forumStore.isLoading" class="loading">
      Loading boards...
    </div>

    <div v-else-if="forumStore.error" class="error">
      {{ forumStore.error }}
    </div>

    <div v-else class="boards-list">
      <h2>Boards</h2>
      <div v-if="forumStore.boardList.length === 0" class="empty">
        No boards available
      </div>
      <div
        v-for="board in forumStore.boardList"
        :key="board.id"
        class="board-card"
        @click="navigateToBoard(board.slug)"
      >
        <div class="board-header">
          <img v-if="board.icon_url" :src="board.icon_url" :alt="board.name" class="board-icon">
          <div v-else class="board-icon-placeholder">📋</div>
          <div class="board-info">
            <h3>{{ board.name }}</h3>
            <p class="board-description">{{ board.description }}</p>
          </div>
        </div>
        <div class="board-stats">
          <span>{{ board.thread_count }} threads</span>
          <span>{{ board.post_count }} posts</span>
          <span v-if="board.last_activity" class="last-activity">
            Last activity: {{ formatDate(board.last_activity) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useForumStore } from '@/stores/forum'

const router = useRouter()
const forumStore = useForumStore()

onMounted(() => {
  forumStore.fetchBoards()
})

function navigateToBoard(slug: string) {
  router.push(`/board/${slug}`)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 0.5rem;
}

h2 {
  margin-bottom: 1rem;
  color: #333;
}

.loading,
.error,
.empty {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error {
  color: #dc3545;
}

.boards-list {
  margin-top: 2rem;
}

.board-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.board-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.board-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.board-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.board-icon-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.board-info h3 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.board-description {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

.board-stats {
  display: flex;
  gap: 1rem;
  color: #888;
  font-size: 0.85rem;
}

.last-activity {
  margin-left: auto;
}
</style>
