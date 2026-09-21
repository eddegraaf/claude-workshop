import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { GoRestUser } from '../../api/GoRestUser.api';
import {
  CreateGoRestUserPayload,
  GoRestUserGender,
  GoRestUserStatus,
} from '../../types/goRestUser.types';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_GENDERS: GoRestUserGender[] = ['male', 'female'];
const VALID_STATUSES: GoRestUserStatus[] = ['active', 'inactive'];

function randomFrom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function buildUserPayload(): CreateGoRestUserPayload {
  return {
    name: 'QA Automation User',
    email: `qa.${randomUUID()}@example.com`,
    gender: randomFrom(VALID_GENDERS),
    status: randomFrom(VALID_STATUSES),
  };
}

test.describe('GoRest Users API', () => {
  test('returns the default list of users with valid fields', async ({ request }) => {
    const goRestUser = new GoRestUser(request);

    const users = await goRestUser.list();
    expect(users.length).toBeGreaterThan(0);

    for (const user of users) {
      expect(typeof user.id).toBe('number');
      expect(typeof user.name).toBe('string');
      expect(user.name.length).toBeGreaterThan(0);
      expect(typeof user.email).toBe('string');
      expect(user.email).toMatch(EMAIL_FORMAT);
      expect(VALID_GENDERS).toContain(user.gender);
      expect(VALID_STATUSES).toContain(user.status);
    }
  });

  test('creates a user and confirms it is retrievable by id', async ({ request }) => {
    const goRestUser = new GoRestUser(request);
    const payload = buildUserPayload();

    const created = await goRestUser.create(payload);
    expect(created.id).toBeGreaterThan(0);
    expect(created).toMatchObject(payload);

    const fetched = await goRestUser.get(created.id);
    expect(fetched).toEqual(created);

    await goRestUser.delete(created.id);
  });

  test('rejects user creation without a valid authorization token', async ({ request }) => {
    const goRestUser = new GoRestUser(request);
    const payload = buildUserPayload();

    await goRestUser.expectCreateUnauthorized(payload);
  });
});
