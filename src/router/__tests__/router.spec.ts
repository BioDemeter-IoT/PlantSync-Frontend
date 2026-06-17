import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// We test the route definitions and guard logic by importing the module
// and validating its configuration.

// Mock all lazy-loaded page components
vi.mock('@/iam/pages/sign-in.page.vue', () => ({ default: { template: '<div>Sign In</div>' } }));
vi.mock('@/iam/pages/sign-up.page.vue', () => ({ default: { template: '<div>Sign Up</div>' } }));
vi.mock('@/plant-management/pages/plants.page.vue', () => ({ default: { template: '<div>Plants</div>' } }));
vi.mock('@/plant-management/pages/plant-detail.page.vue', () => ({ default: { template: '<div>Plant Detail</div>' } }));
vi.mock('@/task-management/pages/tasks-timeline.page.vue', () => ({ default: { template: '<div>Tasks</div>' } }));
vi.mock('@/iot-management/pages/iot-dashboard.page.vue', () => ({ default: { template: '<div>IoT</div>' } }));
vi.mock('@/chatbot/pages/chatbot.page.vue', () => ({ default: { template: '<div>Chatbot</div>' } }));
vi.mock('@/profile-management/pages/profile.page.vue', () => ({ default: { template: '<div>Profile</div>' } }));
vi.mock('@/analytics/pages/analytics-dashboard.page.vue', () => ({ default: { template: '<div>Analytics</div>' } }));
vi.mock('@/shared/pages/access-denied.page.vue', () => ({ default: { template: '<div>Access Denied</div>' } }));
vi.mock('@/shared/pages/not-found.page.vue', () => ({ default: { template: '<div>Not Found</div>' } }));

// Import after mocks
import router from '@/router/index';
import { useAuthenticationStore } from '@/iam/services/authentication.store';

describe('Router', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  describe('Route definitions', () => {
    it('should define all expected named routes', () => {
      const routeNames = router.getRoutes().map((r) => r.name).filter(Boolean);
      const expectedNames = [
        'sign-in',
        'sign-up',
        'dashboard',
        'plants',
        'plant-detail',
        'tasks-timeline',
        'iot-dashboard',
        'chatbot',
        'profile',
        'analytics',
        'access-denied',
        'not-found',
      ];
      for (const name of expectedNames) {
        expect(routeNames).toContain(name);
      }
    });

    it('should mark sign-in and sign-up as public (requiresAuth: false)', () => {
      const signIn = router.getRoutes().find((r) => r.name === 'sign-in');
      const signUp = router.getRoutes().find((r) => r.name === 'sign-up');
      expect(signIn?.meta.requiresAuth).toBe(false);
      expect(signUp?.meta.requiresAuth).toBe(false);
    });

    it('should mark protected routes with requiresAuth: true', () => {
      const protectedRoutes = ['dashboard', 'plants', 'plant-detail', 'tasks-timeline', 'iot-dashboard', 'chatbot', 'profile', 'analytics'];
      for (const name of protectedRoutes) {
        const route = router.getRoutes().find((r) => r.name === name);
        expect(route?.meta.requiresAuth, `Route ${name} should require auth`).toBe(true);
      }
    });

    it('should set minimumRole to admin for analytics route', () => {
      const analytics = router.getRoutes().find((r) => r.name === 'analytics');
      expect(analytics?.meta.minimumRole).toBe('admin');
    });

    it('should set minimumRole to user for standard protected routes', () => {
      const userRoutes = ['dashboard', 'plants', 'plant-detail', 'tasks-timeline', 'iot-dashboard', 'chatbot', 'profile'];
      for (const name of userRoutes) {
        const route = router.getRoutes().find((r) => r.name === name);
        expect(route?.meta.minimumRole, `Route ${name} should have minimumRole user`).toBe('user');
      }
    });

    it('should set minimumRole to guest for public routes', () => {
      const guestRoutes = ['sign-in', 'sign-up', 'access-denied', 'not-found'];
      for (const name of guestRoutes) {
        const route = router.getRoutes().find((r) => r.name === name);
        expect(route?.meta.minimumRole, `Route ${name} should have minimumRole guest`).toBe('guest');
      }
    });

    it('should have every route with meta.requiresAuth and meta.minimumRole defined', () => {
      const allRoutes = router.getRoutes().filter((r) => r.name);
      for (const route of allRoutes) {
        expect(typeof route.meta.requiresAuth, `Route ${String(route.name)} should have requiresAuth`).toBe('boolean');
        expect(['guest', 'user', 'admin'], `Route ${String(route.name)} should have valid minimumRole`).toContain(route.meta.minimumRole);
      }
    });
  });

  describe('Navigation guards', () => {
    it('should redirect to sign-in when accessing a protected route without token', async () => {
      localStorage.removeItem('token');
      await router.push('/plants');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('sign-in');
    });

    it('should redirect authenticated users away from sign-in to plants', async () => {
      localStorage.setItem('token', 'test-token');
      // Navigate to a neutral route first to avoid same-route no-op
      await router.push('/access-denied');
      await router.push('/sign-in');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('plants');
    });

    it('should redirect authenticated users away from sign-up to plants', async () => {
      localStorage.setItem('token', 'test-token');
      await router.push('/sign-up');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('plants');
    });

    it('should allow access to protected route when token exists', async () => {
      localStorage.setItem('token', 'test-token');
      await router.push('/plants');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('plants');
    });

    it('should redirect non-admin users to access-denied when accessing analytics', async () => {
      localStorage.setItem('token', 'test-token');
      const authStore = useAuthenticationStore();
      authStore.userRole = 'user';
      await router.push('/analytics');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('access-denied');
    });

    it('should allow admin users to access analytics', async () => {
      localStorage.setItem('token', 'test-token');
      const authStore = useAuthenticationStore();
      authStore.userRole = 'admin';
      await router.push('/analytics');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('analytics');
    });

    it('should allow access to access-denied page without token', async () => {
      localStorage.removeItem('token');
      await router.push('/access-denied');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('access-denied');
    });

    it('should redirect / to /plants', async () => {
      localStorage.setItem('token', 'test-token');
      await router.push('/');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('plants');
    });
  });
});
