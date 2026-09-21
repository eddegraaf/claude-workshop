import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { CreateGoRestPostPayload, GoRestPostDto } from '../types/goRestPost.types';

// No leading slash: paths are resolved relative to the `api` project's baseURL
// (see playwright.config.ts) so the /public/v2 prefix is preserved.
const POSTS_ENDPOINT = 'posts';

/**
 * Orchestrates calls to the GoRest Posts API (https://gorest.co.in/public/v2).
 * Mirrors the Page Object pattern used for UI tests: tests call these intention-revealing
 * methods and never touch `request.get/post/...` directly.
 */
export class GoRestPost {
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async create(payload: CreateGoRestPostPayload): Promise<GoRestPostDto> {
    const response = await this.request.post(POSTS_ENDPOINT, {
      headers: this.authHeaders(),
      data: payload,
    });
    await this.expectStatus(response, 201);
    return response.json();
  }

  // GoRest deletes a post's comments along with the post itself; verified against the
  // live API rather than assumed.
  async delete(id: number): Promise<void> {
    const response = await this.request.delete(`${POSTS_ENDPOINT}/${id}`, {
      headers: this.authHeaders(),
    });
    await this.expectStatus(response, 204);
  }

  async expectNotFound(id: number): Promise<void> {
    const response = await this.request.get(`${POSTS_ENDPOINT}/${id}`);
    await this.expectStatus(response, 404);
  }

  // Required for write operations, which the API rejects outright without a token.
  private authHeaders(): Record<string, string> {
    if (!process.env.GOREST_TOKEN) {
      throw new Error(
        'GOREST_TOKEN environment variable is required to create or delete GoRest posts. ' +
          'Copy .env.example to .env and set your GoRest access token.',
      );
    }
    return { Authorization: `Bearer ${process.env.GOREST_TOKEN}` };
  }

  private async expectStatus(response: APIResponse, status: number): Promise<void> {
    expect(response.status(), await response.text()).toBe(status);
  }
}
