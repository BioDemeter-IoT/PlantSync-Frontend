import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthenticationStore } from '@/iam/services/authentication.store';

const routes: RouteRecordRaw[] = [
  // Public routes
  {
    path: '/sign-in',
    name: 'sign-in',
    component: () => import('@/iam/pages/sign-in.page.vue'),
    meta: { requiresAuth: false, minimumRole: 'guest' },
  },
  {
    path: '/sign-up',
    name: 'sign-up',
    component: () => import('@/iam/pages/sign-up.page.vue'),
    meta: { requiresAuth: false, minimumRole: 'guest' },
  },

  // Protected routes (User)
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/plant-management/pages/plants.page.vue'),
    meta: { requiresAuth: true, minimumRole: 'user' },
  },
  {
    path: '/plants',
    name: 'plants',
    component: () => import('@/plant-management/pages/plants.page.vue'),
    meta: { requiresAuth: true, minimumRole: 'user' },
  },
  {
    path: '/plants/:id',
    name: 'plant-detail',
    component: () => import('@/plant-management/pages/plant-detail.page.vue'),
    meta: { requiresAuth: true, minimumRole: 'user' },
  },
  {
    path: '/tasks',
    name: 'tasks-timeline',
    component: () => import('@/task-management/pages/tasks-timeline.page.vue'),
    meta: { requiresAuth: true, minimumRole: 'user' },
  },
  {
    path: '/iot',
    name: 'iot-dashboard',
    component: () => import('@/iot-management/pages/iot-dashboard.page.vue'),
    meta: { requiresAuth: true, minimumRole: 'user' },
  },
  {
    path: '/chatbot',
    name: 'chatbot',
    component: () => import('@/chatbot/pages/chatbot.page.vue'),
    meta: { requiresAuth: true, minimumRole: 'user' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/profile-management/pages/profile.page.vue'),
    meta: { requiresAuth: true, minimumRole: 'user' },
  },

  // Protected routes (Admin)
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/analytics/pages/analytics-dashboard.page.vue'),
    meta: { requiresAuth: true, minimumRole: 'admin' },
  },

  // Fallbacks
  {
    path: '/access-denied',
    name: 'access-denied',
    component: () => import('@/shared/pages/access-denied.page.vue'),
    meta: { requiresAuth: false, minimumRole: 'guest' },
  },
  {
    path: '/',
    redirect: '/plants',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/shared/pages/not-found.page.vue'),
    meta: { requiresAuth: false, minimumRole: 'guest' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * Navigation guard implementing route protection logic:
 * 1. Redirect authenticated users away from sign-in/sign-up pages
 * 2. Redirect unauthenticated users to sign-in for protected routes
 * 3. Redirect users without sufficient role to access-denied page
 */
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const requiresAuth = to.meta.requiresAuth as boolean;
  const minimumRole = to.meta.minimumRole as 'guest' | 'user' | 'admin';

  // Redirect authenticated users away from auth pages
  if (!requiresAuth && token && (to.name === 'sign-in' || to.name === 'sign-up')) {
    return next({ name: 'plants' });
  }

  // Redirect unauthenticated users to sign-in
  if (requiresAuth && !token) {
    return next({ name: 'sign-in' });
  }

  // Role-based check for admin routes
  if (requiresAuth && minimumRole === 'admin') {
    const authStore = useAuthenticationStore();
    if (authStore.userRole !== 'admin') {
      return next({ name: 'access-denied' });
    }
  }

  next();
});

export default router;
