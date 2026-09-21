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
  private readonly headers: Record<string, string>;

  constructor(request: APIRequestContext) {
    this.request = request;

    const token = process.env.GOREST_TOKEN;
    if (!token) {
      throw new Error(
        'GOREST_TOKEN environment variable is required to call the GoRest API. ' +
          'Copy .env.example to .env and set your GoRest access token.',
      );
    }
    this.headers = { Authorization: `Bearer ${token}` };
  }

  async list(): Promise<GoRestUserDto[]> {
    const response = await this.request.get(USERS_ENDPOINT, {
      headers: this.headers,
    });
    await this.expectStatus(response, 200);
    return response.json();
  }

  async create(payload: CreateGoRestUserPayload): Promise<GoRestUserDto> {
    const response = await this.request.post(USERS_ENDPOINT, {
      headers: this.headers,
      data: payload,
    });
    await this.expectStatus(response, 201);
    return response.json();
  }

  async get(id: number): Promise<GoRestUserDto> {
    const response = await this.request.get(`${USERS_ENDPOINT}/${id}`, {
      headers: this.headers,
    });
    await this.expectStatus(response, 200);
    return response.json();
  }

  async update(id: number, payload: UpdateGoRestUserPayload): Promise<GoRestUserDto> {
    const response = await this.request.patch(`${USERS_ENDPOINT}/${id}`, {
      headers: this.headers,
      data: payload,
    });
    await this.expectStatus(response, 200);
    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await this.request.delete(`${USERS_ENDPOINT}/${id}`, {
      headers: this.headers,
    });
    await this.expectStatus(response, 204);
  }

  async expectNotFound(id: number): Promise<void> {
    const response = await this.request.get(`${USERS_ENDPOINT}/${id}`, {
      headers: this.headers,
    });
    await this.expectStatus(response, 404);
  }

  private async expectStatus(response: APIResponse, status: number): Promise<void> {
    expect(response.status(), await response.text()).toBe(status);
  }
}
