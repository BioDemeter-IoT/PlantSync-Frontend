import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import type { ApiErrorResponse } from '@/shared/model/api-response.model';

/**
 * Response error interceptor that handles HTTP error status codes:
 * - 401: Clears token from localStorage and redirects to sign-in
 * - 403: Logs access-denied warning (component layer handles UI)
 * - 404: Logs not-found warning (component layer handles UI)
 * - 400: Parses response body as ApiErrorResponse and re-throws with structured data
 * - All other errors: Re-throws the error as-is
 */
export const responseErrorInterceptor = (error: AxiosError): Promise<never> => {
  const status = error.response?.status;

  switch (status) {
    case 401:
      // Do NOT auto-redirect on 401. The backend returns 401 for various
      // reasons (missing profile, endpoint permissions) that don't mean
      // the session is invalid. Let each component handle 401 errors.
      // The navigation guard already handles unauthenticated access.
      break;

    case 403:
      console.warn('[Http_Client] Access denied: You do not have permission to access this resource.');
      break;

    case 404:
      // Silently handle 404 - components handle empty states
      break;

    case 400: {
      const data = error.response?.data as ApiErrorResponse | undefined;
      if (data && typeof data === 'object' && 'message' in data) {
        const apiError: ApiErrorResponse = {
          message: data.message,
          errors: data.errors,
        };
        const enrichedError = Object.assign(error, { apiErrorResponse: apiError });
        return Promise.reject(enrichedError);
      }
      // If response body cannot be parsed as valid ApiErrorResponse, emit generic error
      const genericError: ApiErrorResponse = {
        message: 'A validation error occurred.',
        errors: [],
      };
      const enrichedGenericError = Object.assign(error, { apiErrorResponse: genericError });
      return Promise.reject(enrichedGenericError);
    }
  }

  return Promise.reject(error);
};

/**
 * Registers the response interceptor on the provided Axios instance.
 * The success handler passes the response through unchanged.
 */
export function registerResponseInterceptor(http: AxiosInstance): void {
  http.interceptors.response.use(
    (response: AxiosResponse) => response,
    responseErrorInterceptor
  );
}
