import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CreateCashTransactionRequestSchema,
  ListCashTransactionsQuerySchema,
  UpdateCashTransactionRequestSchema,
} from './cash-transactions.schemas.js';

const categoryId = '63bd5aa8-bb5b-420e-a054-97d7832efd42';
const paidByUserId = 'b605cfab-1b60-4e45-9b43-1b2a6d1b3c62';

describe('Cash transaction request schemas', () => {
  it('normalizes a valid create-cash-transaction request', () => {
    const result = CreateCashTransactionRequestSchema.safeParse({
      type: 'expense',
      amount: 120000,
      transactionDate: '2026-07-01',
      categoryId,
      paidByUserId,
      note: '  Ăn tối  ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        type: 'expense',
        amount: 120000,
        transactionDate: '2026-07-01',
        categoryId,
        paidByUserId,
        note: 'Ăn tối',
      });
    }
  });

  it('rejects invalid create-cash-transaction fields', () => {
    const result = CreateCashTransactionRequestSchema.safeParse({
      type: 'transfer',
      amount: 0,
      transactionDate: '2026-13-01',
      categoryId: 'not-a-uuid',
      paidByUserId: 'not-a-uuid',
      note: '',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.type);
      assert.ok(fieldErrors.amount);
      assert.ok(fieldErrors.transactionDate);
      assert.ok(fieldErrors.categoryId);
      assert.ok(fieldErrors.paidByUserId);
      assert.ok(fieldErrors.note);
    }
  });

  it('requires at least one update field', () => {
    const result = UpdateCashTransactionRequestSchema.safeParse({});

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /At least one/);
    }
  });

  it('parses list query filters', () => {
    assert.deepEqual(
      ListCashTransactionsQuerySchema.parse({
        type: ['income'],
        fromDate: '2026-07-01',
        toDate: '2026-07-31',
        categoryId,
        paidByUserId,
        sourceType: 'manual',
      }),
      {
        type: 'income',
        fromDate: '2026-07-01',
        toDate: '2026-07-31',
        categoryId,
        paidByUserId,
        sourceType: 'manual',
      },
    );
  });

  it('rejects inverted date range filters', () => {
    const result = ListCashTransactionsQuerySchema.safeParse({
      fromDate: '2026-08-01',
      toDate: '2026-07-01',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /toDate/);
    }
  });
});
