import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CurrentHouseholdResponseSchema } from './households.types.js';

describe('CurrentHouseholdResponseSchema', () => {
  it('parses a valid current-household response', () => {
    assert.deepEqual(
      CurrentHouseholdResponseSchema.parse({
        id: '79eb57a6-f6f5-4f47-827b-fd0527468132',
        name: 'Home',
        role: 'owner',
      }),
      {
        id: '79eb57a6-f6f5-4f47-827b-fd0527468132',
        name: 'Home',
        role: 'owner',
      },
    );
  });

  it('rejects invalid current-household roles', () => {
    const result = CurrentHouseholdResponseSchema.safeParse({
      id: '79eb57a6-f6f5-4f47-827b-fd0527468132',
      name: 'Home',
      role: 'admin',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.role);
    }
  });
});
