import http from '@/shared/services/http-common';
import type { SignUpRequest } from '@/iam/model/sign-up.request';
import type { SignUpResponse } from '@/iam/model/sign-up.response';
import type { SignInRequest } from '@/iam/model/sign-in.request';
import type { SignInResponse } from '@/iam/model/sign-in.response';
import type { AxiosResponse } from 'axios';

/**
 * Authentication API Service.
 * @summary
 * Provides methods for user registration and authentication
 * against the backend REST API.
 */
export class AuthenticationApiService {
  /**
   * Register a new user account.
   * @param request - The sign-up request payload.
   * @returns A promise resolving to the sign-up response.
   */
  signUp(request: SignUpRequest): Promise<AxiosResponse<SignUpResponse>> {
    return http.post<SignUpResponse>('/authentication/sign-up', request);
  }

  /**
   * Authenticate an existing user.
   * @param request - The sign-in request payload.
   * @returns A promise resolving to the sign-in response containing token and user info.
   */
  signIn(request: SignInRequest): Promise<AxiosResponse<SignInResponse>> {
    return http.post<SignInResponse>('/authentication/sign-in', request);
  }
}
