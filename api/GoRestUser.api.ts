import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import {
  CreateGoRestUserPayload,
  GoRestUserDto,
  UpdateGoRestUserPayload,
} from '../types/goRestUser.types';

// No leading slash: paths are resolved relative to the `api` project's baseURL
// (see playwright.config.ts) so the /public/v2 prefix is preserved.
const USERS_ENDPOINT = 'users';

/**
 * Orchestrates calls to the GoRest Users API (https://gorest.co.in/public/v2).
 * Mirrors the Page Object pattern used for UI tests: tests call these intention-revealing
 * methods and never touch `request.get/post/...` directly.
 */
export class GoRestUser {
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // GoRest's read endpoints (list/get) are public and need no token; only
  // write operations (create/update/delete) require the bearer token.
  async list(): Promise<GoRestUserDto[]> {
    const response = await this.request.get(USERS_ENDPOINT);
    await this.expectStatus(response, 200);
    return response.json();
  }

  async create(payload: CreateGoRestUserPayload): Promise<GoRestUserDto> {
    const response = await this.request.post(USERS_ENDPOINT, {
      headers: this.authHeaders(),
      data: payload,
    });
    await this.expectStatus(response, 201);
    return response.json();
  }

  // Write operations require a bearer token; the API must reject a request that omits it
  // rather than silently allowing it, so this hits the endpoint with no Authorization header.
  async expectCreateUnauthorized(payload: CreateGoRestUserPayload): Promise<void> {
    const response = await this.request.post(USERS_ENDPOINT, { data: payload });
    await this.expectStatus(response, 401);
  }

  // Unauthenticated GETs are served from a cache that lags behind recent writes: fetching a
  // just-created user without a token can 404 for several seconds even though the record
  // exists. Sending the token when available (without requiring it) reads the authoritative
  // data and avoids that lag.
  async get(id: number): Promise<GoRestUserDto> {
    const response = await this.request.get(`${USERS_ENDPOINT}/${id}`, {
      headers: this.optionalAuthHeaders(),
    });
    await this.expectStatus(response, 200);
    return response.json();
  }

  async update(id: number, payload: UpdateGoRestUserPayload): Promise<GoRestUserDto> {
    const response = await this.request.patch(`${USERS_ENDPOINT}/${id}`, {
      headers: this.authHeaders(),
      data: payload,
    });
    await this.expectStatus(response, 200);
    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await this.request.delete(`${USERS_ENDPOINT}/${id}`, {
      headers: this.authHeaders(),
    });
    await this.expectStatus(response, 204);
  }

  async expectNotFound(id: number): Promise<void> {
    const response = await this.request.get(`${USERS_ENDPOINT}/${id}`);
    await this.expectStatus(response, 404);
  }

  // Required for write operations, which the API rejects outright without a token.
  private authHeaders(): Record<string, string> {
    if (!process.env.GOREST_TOKEN) {
      throw new Error(
        'GOREST_TOKEN environment variable is required to create, update, or delete ' +
          'GoRest users. Copy .env.example to .env and set your GoRest access token.',
      );
    }
    return this.optionalAuthHeaders();
  }

  // For reads, which work without a token but read stale/cached data without one.
  private optionalAuthHeaders(): Record<string, string> {
    const token = process.env.GOREST_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async expectStatus(response: APIResponse, status: number): Promise<void> {
    expect(response.status(), await response.text()).toBe(status);
  }
}
