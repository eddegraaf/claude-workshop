import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { CreateGoRestCommentPayload, GoRestCommentDto } from '../types/goRestComment.types';

// No leading slash: paths are resolved relative to the `api` project's baseURL
// (see playwright.config.ts) so the /public/v2 prefix is preserved.
const COMMENTS_ENDPOINT = 'comments';

function postCommentsEndpoint(postId: number): string {
  return `posts/${postId}/comments`;
}

/**
 * Orchestrates calls to the GoRest Comments API (https://gorest.co.in/public/v2).
 * Mirrors the Page Object pattern used for UI tests: tests call these intention-revealing
 * methods and never touch `request.get/post/...` directly.
 */
export class GoRestComment {
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // Nested under the post: GoRest derives post_id from the URL, not the request body.
  async create(postId: number, payload: CreateGoRestCommentPayload): Promise<GoRestCommentDto> {
    const response = await this.request.post(postCommentsEndpoint(postId), {
      headers: this.authHeaders(),
      data: payload,
    });
    await this.expectStatus(response, 201);
    return response.json();
  }

  // Unauthenticated GETs are served from a cache that lags behind recent writes: listing a
  // post's comments right after creating one can come back empty for several seconds even
  // though the comment exists (mirrors GoRestUser.get's caching note). Sending the token when
  // available reads the authoritative data and avoids that lag.
  async listForPost(postId: number): Promise<GoRestCommentDto[]> {
    const response = await this.request.get(postCommentsEndpoint(postId), {
      headers: this.optionalAuthHeaders(),
    });
    await this.expectStatus(response, 200);
    return response.json();
  }

  async expectNotFound(id: number): Promise<void> {
    const response = await this.request.get(`${COMMENTS_ENDPOINT}/${id}`);
    await this.expectStatus(response, 404);
  }

  // Required for write operations, which the API rejects outright without a token.
  private authHeaders(): Record<string, string> {
    if (!process.env.GOREST_TOKEN) {
      throw new Error(
        'GOREST_TOKEN environment variable is required to create GoRest comments. ' +
          'Copy .env.example to .env and set your GoRest access token.',
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
