<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <div class="app">
    <header class="navbar">
      <div class="container">
        <RouterLink to="/" class="logo">
          <span class="logo-icon">💬</span>
          <span class="logo-text">Nunchi Forum</span>
        </RouterLink>

        <nav class="nav-links">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/about" class="nav-link">About</RouterLink>
        </nav>

        <div class="nav-actions">
          <template v-if="authStore.isAuthenticated">
            <span class="user-greeting">
              <img
                v-if="authStore.currentUser?.avatar_url"
                :src="authStore.currentUser.avatar_url"
                :alt="authStore.currentUser.username"
                class="user-avatar"
              >
              <span v-else class="user-avatar-placeholder">👤</span>
              {{ authStore.currentUser?.username }}
            </span>
            <button class="btn-logout" @click="handleLogout">Logout</button>
          </template>
          <RouterLink v-else to="/login" class="btn-login">Login</RouterLink>
        </div>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 Nunchi Forum. Built with Vue 3 + Fastify.</p>
      </div>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

/* Navbar */
.navbar {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #333;
  font-weight: 600;
  font-size: 1.25rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #007bff;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  font-size: 1.25rem;
}

.btn-login,
.btn-logout {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login {
  background: #007bff;
  color: #fff;
  text-decoration: none;
}

.btn-login:hover {
  background: #0056b3;
}

.btn-logout {
  background: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.btn-logout:hover {
  background: #dc3545;
  color: #fff;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 1rem 0;
}

/* Footer */
.footer {
  background: #fff;
  border-top: 1px solid #e0e0e0;
  padding: 1.5rem 0;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}
</style>
