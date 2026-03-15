<template>
  <div class="login-view">
    <div class="auth-container">
      <div class="auth-tabs">
        <button
          :class="['tab', { active: activeTab === 'login' }]"
          @click="activeTab = 'login'"
        >
          Login
        </button>
        <button
          :class="['tab', { active: activeTab === 'register' }]"
          @click="activeTab = 'register'"
        >
          Register
        </button>
      </div>

      <!-- Login Form -->
      <form v-if="activeTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
        <h2>Welcome Back</h2>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <div class="form-group">
          <label for="login-email">Email</label>
          <input
            id="login-email"
            v-model="loginForm.email"
            type="email"
            required
            placeholder="Enter your email"
          >
        </div>

        <div class="form-group">
          <label for="login-password">Password</label>
          <input
            id="login-password"
            v-model="loginForm.password"
            type="password"
            required
            placeholder="Enter your password"
          >
        </div>

        <button
          type="submit"
          class="btn-primary"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <!-- Register Form -->
      <form v-else class="auth-form" @submit.prevent="handleRegister">
        <h2>Create Account</h2>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <div class="form-group">
          <label for="register-username">Username</label>
          <input
            id="register-username"
            v-model="registerForm.username"
            type="text"
            required
            minlength="3"
            maxlength="30"
            placeholder="Choose a username"
          >
        </div>

        <div class="form-group">
          <label for="register-email">Email</label>
          <input
            id="register-email"
            v-model="registerForm.email"
            type="email"
            required
            placeholder="Enter your email"
          >
        </div>

        <div class="form-group">
          <label for="register-password">Password</label>
          <input
            id="register-password"
            v-model="registerForm.password"
            type="password"
            required
            minlength="6"
            placeholder="Create a password (min 6 characters)"
          >
        </div>

        <button
          type="submit"
          class="btn-primary"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? 'Creating account...' : 'Register' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'login' | 'register'>('login')

const loginForm = ref({
  email: '',
  password: '',
})

const registerForm = ref({
  username: '',
  email: '',
  password: '',
})

// Clear error when switching tabs
watch(activeTab, () => {
  authStore.clearError()
})

async function handleLogin() {
  try {
    await authStore.login({
      email: loginForm.value.email,
      password: loginForm.value.password,
    })
    router.push('/')
  } catch (err) {
    // Error is handled by store
  }
}

async function handleRegister() {
  try {
    await authStore.register({
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password,
    })
    router.push('/')
  } catch (err) {
    // Error is handled by store
  }
}
</script>

<style scoped>
.login-view {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f5f5f5;
}

.auth-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: #f8f9fa;
}

.tab.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  margin-bottom: -1px;
}

.auth-form {
  padding: 2rem;
}

.auth-form h2 {
  margin: 0 0 1.5rem 0;
  text-align: center;
  color: #333;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.btn-primary {
  width: 100%;
  background: #007bff;
  color: #fff;
  border: none;
  padding: 0.875rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
