<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { AuthenticationApiService } from '@/iam/services/authentication-api.service';
import type { SignUpRequest } from '@/iam/model/sign-up.request';

const router = useRouter();
const authService = new AuthenticationApiService();

const form = reactive<SignUpRequest>({
  name: '',
  email: '',
  password: '',
  subscriptionPlan: 'BASIC',
});

const fieldErrors = reactive<Record<string, string>>({});
const generalError = ref<string | null>(null);
const loading = ref(false);
const success = ref(false);

function clearErrors() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  generalError.value = null;
}

function validate(): boolean {
  clearErrors();
  let isValid = true;

  if (!form.name.trim()) {
    fieldErrors['name'] = 'Name is required';
    isValid = false;
  }

  if (!form.email.trim()) {
    fieldErrors['email'] = 'Email is required';
    isValid = false;
  } else if (!form.email.includes('@') || !form.email.includes('.')) {
    fieldErrors['email'] = 'Please enter a valid email address';
    isValid = false;
  }

  if (!form.password.trim()) {
    fieldErrors['password'] = 'Password is required';
    isValid = false;
  } else if (form.password.length < 8) {
    fieldErrors['password'] = 'Password must be at least 8 characters';
    isValid = false;
  }

  return isValid;
}

async function handleSubmit() {
  if (!validate()) return;

  loading.value = true;
  clearErrors();

  try {
    await authService.signUp(form);
    success.value = true;
    setTimeout(() => router.push({ name: 'sign-in' }), 2000);
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      if (status === 400) {
        const data = error.response.data;
        if (data && typeof data === 'object') {
          for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
              fieldErrors[key] = value;
            }
          }
          if (Object.keys(fieldErrors).length === 0) {
            generalError.value = data.message || 'Validation error. Please check your input.';
          }
        } else {
          generalError.value = 'Validation error. Please check your input.';
        }
      } else {
        generalError.value = 'Something went wrong. Please try again.';
      }
    } else {
      generalError.value = 'Connection error. Please check your internet.';
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

      <h1>Create Account</h1>
      <p class="ps-auth-card__subtitle">Join PlantCare today</p>

      <!-- Success message -->
      <div v-if="success" class="ps-success-box">
        <i class="pi pi-check-circle"></i>
        <p class="ps-success-box__title">Account created successfully!</p>
        <p class="ps-success-box__text">Redirecting to sign-in...</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" novalidate>
        <div v-if="generalError" class="ps-alert ps-alert--error" role="alert">
          {{ generalError }}
        </div>

        <div class="ps-input-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Enter your name"
            :class="{ 'ps-input--error': fieldErrors['name'] }"
            :disabled="loading"
          />
          <p v-if="fieldErrors['name']" class="ps-input-error">{{ fieldErrors['name'] }}</p>
        </div>

        <div class="ps-input-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="Enter your email"
            :class="{ 'ps-input--error': fieldErrors['email'] }"
            :disabled="loading"
            autocomplete="email"
          />
          <p v-if="fieldErrors['email']" class="ps-input-error">{{ fieldErrors['email'] }}</p>
        </div>

        <div class="ps-input-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Min 8 characters"
            :class="{ 'ps-input--error': fieldErrors['password'] }"
            :disabled="loading"
            autocomplete="new-password"
          />
          <p v-if="fieldErrors['password']" class="ps-input-error">{{ fieldErrors['password'] }}</p>
        </div>

        <div class="ps-input-group">
          <label>Subscription Plan</label>
          <div class="ps-plan-select">
            <label class="ps-plan-option" :class="{ 'ps-plan-option--active': form.subscriptionPlan === 'BASIC' }">
              <input type="radio" v-model="form.subscriptionPlan" value="BASIC" :disabled="loading" />
              <span>Basic (Free)</span>
            </label>
            <label class="ps-plan-option" :class="{ 'ps-plan-option--active': form.subscriptionPlan === 'PRO' }">
              <input type="radio" v-model="form.subscriptionPlan" value="PRO" :disabled="loading" />
              <span>Pro</span>
            </label>
          </div>
        </div>

        <button type="submit" class="ps-btn-submit" :disabled="loading">
          <span v-if="loading">
            <i class="pi pi-spinner pi-spin"></i> Creating account...
          </span>
          <span v-else>Sign Up</span>
        </button>

        <p class="ps-auth-card__footer">
          Already have an account?
          <router-link to="/sign-in">Sign In</router-link>
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

.ps-success-box {
  text-align: center;
  padding: 2rem 1rem;
}

.ps-success-box i {
  font-size: 2.5rem;
  color: var(--ps-primary);
  margin-bottom: 0.75rem;
}

.ps-success-box__title {
  font-weight: 600;
  color: var(--ps-text);
  margin: 0 0 0.25rem;
}

.ps-success-box__text {
  font-size: 0.85rem;
  color: var(--ps-text-secondary);
  margin: 0;
}

.ps-plan-select {
  display: flex;
  gap: 0.75rem;
}

.ps-plan-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--ps-border);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.ps-plan-option--active {
  border-color: var(--ps-primary);
  background: rgba(107, 124, 62, 0.05);
}

.ps-plan-option input[type="radio"] {
  width: auto;
  accent-color: var(--ps-primary);
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
