import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CreateHouseholdMemberRequestSchema } from './households.schemas.js';

describe('CreateHouseholdMemberRequestSchema', () => {
  it('normalizes a valid create-member request', () => {
    const result = CreateHouseholdMemberRequestSchema.safeParse({
      email: 'Spouse@Example.com',
      password: 'strong-password',
      displayName: '  Spouse  ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        email: 'spouse@example.com',
        password: 'strong-password',
        displayName: 'Spouse',
      });
    }
  });

  it('rejects invalid member request fields', () => {
    const result = CreateHouseholdMemberRequestSchema.safeParse({
      email: 'not-an-email',
      password: 'short',
      displayName: '',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.email);
      assert.ok(fieldErrors.password);
      assert.ok(fieldErrors.displayName);
    }
  });
});
