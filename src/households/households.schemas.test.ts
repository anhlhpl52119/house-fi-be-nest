import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CreateHouseholdMemberRequestSchema, UpdateCurrentHouseholdRequestSchema } from './households.schemas.js';

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

describe('UpdateCurrentHouseholdRequestSchema', () => {
  it('trims a valid household name', () => {
    const result = UpdateCurrentHouseholdRequestSchema.safeParse({
      name: '  Gia đình An  ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        name: 'Gia đình An',
      });
    }
  });

  it('rejects blank, too long, and unknown household setting fields', () => {
    const blankResult = UpdateCurrentHouseholdRequestSchema.safeParse({ name: '   ' });
    const tooLongResult = UpdateCurrentHouseholdRequestSchema.safeParse({ name: 'a'.repeat(161) });
    const unknownFieldResult = UpdateCurrentHouseholdRequestSchema.safeParse({ name: 'Home', timezone: 'Asia/Ho_Chi_Minh' });

    assert.equal(blankResult.success, false);
    assert.equal(tooLongResult.success, false);
    assert.equal(unknownFieldResult.success, false);

    if (!blankResult.success) {
      assert.ok(blankResult.error.flatten().fieldErrors.name);
    }

    if (!tooLongResult.success) {
      assert.ok(tooLongResult.error.flatten().fieldErrors.name);
    }
  });
});
