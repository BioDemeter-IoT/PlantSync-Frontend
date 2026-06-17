import { describe, it, expect, beforeEach } from 'vitest';
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { requestInterceptor } from '../services/request.interceptor';

function createMockConfig(): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;
}

describe('Request Interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should attach Authorization header when token exists in localStorage', () => {
    localStorage.setItem('token', 'my-test-token');
    const config = createMockConfig();

    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe('Bearer my-test-token');
  });

  it('should not attach Authorization header when no token in localStorage', () => {
    const config = createMockConfig();

    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should not attach Authorization header when token is null', () => {
    // localStorage.getItem returns null for missing keys
    const config = createMockConfig();

    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should return the config object', () => {
    const config = createMockConfig();

    const result = requestInterceptor(config);

    expect(result).toBe(config);
  });
});
