import { test, expect } from '@playwright/test';
import { GoRestUser } from '../../api/GoRestUser.api';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_GENDERS = ['male', 'female'];
const VALID_STATUSES = ['active', 'inactive'];

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
});
