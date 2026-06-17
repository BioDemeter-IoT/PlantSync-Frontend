import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SignInResponse } from '@/iam/model/sign-in.response';

const TOKEN_KEY = 'token';

/**
 * Authentication store (Pinia setup store).
 *
 * Manages authentication state: signedIn flag, userId, email, and userRole.
 * Persists the JWT token to localStorage and provides signIn/signOut actions.
 */
export const useAuthenticationStore = defineStore('authentication', () => {
  // --- State ---
  const signedIn = ref<boolean>(false);
  const userId = ref<number | null>(null);
  const email = ref<string>('');
  const userRole = ref<'user' | 'admin' | ''>('');
  const profileId = ref<number | null>(null);

  // --- Initialization ---
  // If a token already exists in localStorage, mark the user as signed in
  // and restore userId/email from stored values.
  const existingToken = localStorage.getItem(TOKEN_KEY);
  if (existingToken) {
    signedIn.value = true;
    const storedUserId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('userEmail');
    const storedProfileId = localStorage.getItem('profileId');
    if (storedUserId) userId.value = Number(storedUserId);
    if (storedEmail) email.value = storedEmail;
    if (storedProfileId) profileId.value = Number(storedProfileId);
  }

  // --- Actions ---

  /**
   * Processes a successful sign-in response.
   * Persists the token to localStorage and updates store state.
   */
  function signIn(response: SignInResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem('userId', String(response.id));
    localStorage.setItem('userEmail', response.email);
    signedIn.value = true;
    userId.value = response.id;
    email.value = response.email;
  }

  /**
   * Signs the user out.
   * Removes the token from localStorage, resets all state to defaults,
   * and navigates to the sign-in page.
   */
  function signOut(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('profileId');
    signedIn.value = false;
    userId.value = null;
    email.value = '';
    userRole.value = '';
    profileId.value = null;
    window.location.href = '/sign-in';
  }

  return {
    signedIn,
    userId,
    email,
    userRole,
    profileId,
    signIn,
    signOut,
  };
});
