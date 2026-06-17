<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthenticationStore } from '@/iam/services/authentication.store';
import { useThemeStore } from '@/shared/services/theme.store';
import { ProfileApiService } from '@/profile-management/services/profile-api.service';

const route = useRoute();
const router = useRouter();
const authStore = useAuthenticationStore();
const themeStore = useThemeStore();
const profileApi = new ProfileApiService();

const isDark = computed(() => themeStore.preference === 'dark');
const profileName = ref('');
const profilePlan = ref('');

const isAuthPage = computed(() => {
  return route.name === 'sign-in' || route.name === 'sign-up';
});

const showShell = computed(() => {
  return authStore.signedIn && !isAuthPage.value;
});

const currentPageTitle = computed(() => {
  const map: Record<string, string> = {
    'plants': 'Mis Plantas',
    'dashboard': 'Mis Plantas',
    'plant-detail': 'Plant Detail',
    'tasks-timeline': 'Tareas',
    'chatbot': 'Chatbot',
    'profile': 'Perfil',
    'iot-dashboard': 'IoT Dashboard',
    'analytics': 'Analytics',
  };
  return map[route.name as string] || 'PlantCare';
});

const navItems = computed(() => {
  const items = [
    { label: 'Mis Plantas', to: '/plants', icon: 'pi pi-leaf', name: 'plants' },
    { label: 'Tareas', to: '/tasks', icon: 'pi pi-check-square', name: 'tasks-timeline' },
    { label: 'Chatbot', to: '/chatbot', icon: 'pi pi-comments', name: 'chatbot' },
    { label: 'IoT', to: '/iot', icon: 'pi pi-microchip', name: 'iot-dashboard' },
    { label: 'Perfil', to: '/profile', icon: 'pi pi-user', name: 'profile' },
  ];
  return items;
});

function isActive(item: { name: string; to: string }): boolean {
  if (route.name === item.name) return true;
  if (item.name === 'plants' && (route.name === 'dashboard' || route.name === 'plant-detail')) return true;
  return false;
}

function toggleTheme() {
  themeStore.applyTheme(isDark.value ? 'light' : 'dark');
}

function signOut() {
  authStore.signOut();
  router.push({ name: 'sign-in' });
}

function getInitial(): string {
  if (profileName.value) return profileName.value.charAt(0).toUpperCase();
  if (authStore.email) return authStore.email.charAt(0).toUpperCase();
  return 'U';
}

onMounted(async () => {
  themeStore.applyTheme(themeStore.preference);
  if (authStore.signedIn && authStore.userId) {
    try {
      const profile = await profileApi.getByUserId(authStore.userId);
      profileName.value = profile.personName;
      profilePlan.value = profile.subscriptionPlan;
    } catch {
      // Silent fail — profile will show fallback
    }
  }
});
</script>

<template>
  <pv-toast />
  <pv-confirm-dialog />

  <!-- Auth pages: no shell -->
  <div v-if="!showShell">
    <router-view />
  </div>

  <!-- Authenticated layout with sidebar + header -->
  <div v-else class="ps-layout">
    <!-- Sidebar -->
    <aside class="ps-sidebar">
      <router-link to="/plants" class="ps-sidebar__logo">
        <i class="pi pi-leaf"></i>
        <span>PlantCare</span>
      </router-link>

      <nav class="ps-sidebar__nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="ps-sidebar__link"
          :class="{ 'ps-sidebar__link--active': isActive(item) }"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="ps-sidebar__bottom">
        <button class="ps-sidebar__link" @click="toggleTheme" style="background:none;border:none;cursor:pointer;width:100%;text-align:left;">
          <i class="pi pi-moon"></i>
          <span>Dark Mode</span>
        </button>
        <button class="ps-sidebar__link" @click="signOut" style="background:none;border:none;cursor:pointer;width:100%;text-align:left;">
          <i class="pi pi-sign-out"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Header -->
    <header class="ps-header">
      <span class="ps-header__title">{{ currentPageTitle }}</span>
      <div class="ps-header__user">
        <span class="ps-header__name">{{ profileName || authStore.email }}</span>
        <span v-if="profilePlan" class="ps-header__badge">{{ profilePlan }}</span>
        <div class="ps-header__avatar">{{ getInitial() }}</div>
      </div>
    </header>

    <!-- Main content -->
    <main class="ps-main">
      <router-view />
    </main>
  </div>
</template>

<style>
/* Remove old page-content padding since new layout handles it */
</style>
