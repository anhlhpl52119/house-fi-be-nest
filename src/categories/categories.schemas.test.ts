import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CreateCategoryRequestSchema, ListCategoriesQuerySchema, UpdateCategoryRequestSchema } from './categories.schemas.js';

const parentId = '9b39285f-836a-4708-b98d-b38302997bf2';

describe('Category request schemas', () => {
  it('normalizes a valid create-category request', () => {
    const result = CreateCategoryRequestSchema.safeParse({
      name: '  Trường học  ',
      type: 'expense',
      parentId,
      icon: ' i-ph:student-duotone ',
      backgroundColor: '#EFF6FF',
      textColor: '#1D4ED8',
      borderColor: '#BFDBFE',
      description: '  Chi phí học tập và trường lớp.  ',
      sortOrder: 9,
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        name: 'Trường học',
        type: 'expense',
        parentId,
        icon: 'i-ph:student-duotone',
        backgroundColor: '#EFF6FF',
        textColor: '#1D4ED8',
        borderColor: '#BFDBFE',
        description: 'Chi phí học tập và trường lớp.',
        sortOrder: 9,
      });
    }
  });

  it('rejects invalid category fields', () => {
    const result = CreateCategoryRequestSchema.safeParse({
      name: '',
      type: 'transfer',
      parentId: 'not-a-uuid',
      backgroundColor: 'blue',
      sortOrder: -1,
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.name);
      assert.ok(fieldErrors.type);
      assert.ok(fieldErrors.parentId);
      assert.ok(fieldErrors.backgroundColor);
      assert.ok(fieldErrors.sortOrder);
    }
  });

  it('requires at least one update field', () => {
    const result = UpdateCategoryRequestSchema.safeParse({});

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /At least one/);
    }
  });

  it('parses list query type filters', () => {
    assert.deepEqual(ListCategoriesQuerySchema.parse({ type: 'income' }), { type: 'income' });
    assert.deepEqual(ListCategoriesQuerySchema.parse({ type: ['expense'] }), { type: 'expense' });
  });
});
