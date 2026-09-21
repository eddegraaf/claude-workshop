import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { GoRestUser } from '../../api/GoRestUser.api';
import { GoRestPost } from '../../api/GoRestPost.api';
import { GoRestComment } from '../../api/GoRestComment.api';
import {
  CreateGoRestUserPayload,
  GoRestUserGender,
  GoRestUserStatus,
} from '../../types/goRestUser.types';

const VALID_GENDERS: GoRestUserGender[] = ['male', 'female'];
const VALID_STATUSES: GoRestUserStatus[] = ['active', 'inactive'];

function randomFrom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function buildUserPayload(label: string): CreateGoRestUserPayload {
  return {
    name: `QA ${label} ${randomUUID()}`,
    email: `qa.${label.toLowerCase()}.${randomUUID()}@example.com`,
    gender: randomFrom(VALID_GENDERS),
    status: randomFrom(VALID_STATUSES),
  };
}

test.describe('GoRest post deletion cascades to its comments', () => {
  test('removing a post also removes the comments left on it', async ({ request }) => {
    const goRestUser = new GoRestUser(request);
    const goRestPost = new GoRestPost(request);
    const goRestComment = new GoRestComment(request);

    const author = await goRestUser.create(buildUserPayload('Author'));
    const commenter = await goRestUser.create(buildUserPayload('Commenter'));

    const post = await goRestPost.create({
      user_id: author.id,
      title: 'A post worth commenting on',
      body: 'Created by the first user for this test.',
    });

    const comment = await goRestComment.create(post.id, {
      name: commenter.name,
      email: commenter.email,
      body: 'Left by the second user.',
    });

    const commentsBeforeDelete = await goRestComment.listForPost(post.id);
    expect(commentsBeforeDelete.map((c) => c.id)).toContain(comment.id);

    await goRestPost.delete(post.id);

    await goRestPost.expectNotFound(post.id);
    await goRestComment.expectNotFound(comment.id);

    const commentsAfterDelete = await goRestComment.listForPost(post.id);
    expect(commentsAfterDelete).toEqual([]);

    await goRestUser.delete(commenter.id);
    await goRestUser.delete(author.id);
  });
});
