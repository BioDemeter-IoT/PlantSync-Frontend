<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthenticationStore } from '@/iam/services/authentication.store';
import { AuthenticationApiService } from '@/iam/services/authentication-api.service';
import type { SignInRequest } from '@/iam/model/sign-in.request';

const router = useRouter();
const authStore = useAuthenticationStore();
const authApi = new AuthenticationApiService();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const emailTouched = ref(false);
const passwordTouched = ref(false);

const emailInvalid = computed(() => emailTouched.value && email.value.trim() === '');
const passwordInvalid = computed(() => passwordTouched.value && password.value.trim() === '');
const formValid = computed(() => email.value.trim() !== '' && password.value.trim() !== '');

function markEmailTouched() {
  emailTouched.value = true;
}

function markPasswordTouched() {
  passwordTouched.value = true;
}

async function onSubmit() {
  emailTouched.value = true;
  passwordTouched.value = true;

  if (!formValid.value) return;

  loading.value = true;
  errorMessage.value = '';

  const request: SignInRequest = {
    email: email.value.trim(),
    password: password.value,
  };

  try {
    const response = await authApi.signIn(request);
    authStore.signIn(response.data);
    await router.push('/plants');
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      errorMessage.value = 'Invalid email or password. Please try again.';
    } else {
      errorMessage.value = 'Connection error. Please check your internet and try again.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="ps-auth-page">
    <div class="ps-auth-card">
      <div class="ps-auth-card__logo">
        <i class="pi pi-leaf"></i>
        <span>PlantCare</span>
      </div>

      <h1>Welcome back</h1>
      <p class="ps-auth-card__subtitle">Sign in to your account</p>

      <form @submit.prevent="onSubmit" novalidate>
        <div v-if="errorMessage" class="ps-alert ps-alert--error" role="alert">
          {{ errorMessage }}
        </div>

        <div class="ps-input-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            :class="{ 'ps-input--error': emailInvalid }"
            @blur="markEmailTouched"
            :disabled="loading"
            autocomplete="email"
          />
          <p v-if="emailInvalid" class="ps-input-error">Email is required.</p>
        </div>

        <div class="ps-input-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            :class="{ 'ps-input--error': passwordInvalid }"
            @blur="markPasswordTouched"
            :disabled="loading"
            autocomplete="current-password"
          />
          <p v-if="passwordInvalid" class="ps-input-error">Password is required.</p>
        </div>

        <button type="submit" class="ps-btn-submit" :disabled="loading">
          <span v-if="loading">
            <i class="pi pi-spinner pi-spin"></i> Signing in...
          </span>
          <span v-else>Sign In</span>
        </button>

        <p class="ps-auth-card__footer">
          Don't have an account?
          <router-link to="/sign-up">Sign Up</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.ps-alert {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.ps-alert--error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.ps-auth-card__footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: var(--ps-text-secondary);
}

.ps-auth-card__footer a {
  color: var(--ps-primary);
  font-weight: 600;
}
</style>
