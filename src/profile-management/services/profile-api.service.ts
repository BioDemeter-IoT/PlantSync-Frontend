import http from '@/shared/services/http-common';
import type { Profile, UpdateProfileRequest } from '../model/profile.entity';

/**
 * Profile API Service
 */
export class ProfileApiService {
  private readonly basePath = '/profiles';

  /**
   * Fetch a profile by user ID.
   * Uses GET /profiles and filters by userId since /by-user-id may not work.
   */
  async getByUserId(userId: number): Promise<Profile> {
    const response = await http.get(this.basePath);
    const profiles: Profile[] = Array.isArray(response.data) ? response.data : [response.data];
    const profile = profiles.find(p => p.userId === userId);
    if (!profile) {
      throw new Error(`Profile not found for userId ${userId}`);
    }
    return profile;
  }

  /**
   * Update an existing profile.
   */
  update(profileId: number, request: UpdateProfileRequest): Promise<Profile> {
    return http.put(`${this.basePath}/${profileId}`, request).then(r => r.data);
  }

  /**
   * Create a new profile.
   */
  create(request: any): Promise<Profile> {
    return http.post(this.basePath, request).then(r => r.data);
  }
}
