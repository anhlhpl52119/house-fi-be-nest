import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CreateAssetRequestSchema,
  CreateAssetTransactionRequestSchema,
  ListAssetsQuerySchema,
  ListAssetTransactionsQuerySchema,
} from './assets.schemas.js';

const assetId = '63bd5aa8-bb5b-420e-a054-97d7832efd42';
const paidByUserId = 'b605cfab-1b60-4e45-9b43-1b2a6d1b3c62';

describe('Asset request schemas', () => {
  it('normalizes a valid create-asset request', () => {
    const result = CreateAssetRequestSchema.safeParse({
      type: 'gold',
      symbol: ' SJC ',
      name: '  Vàng SJC  ',
      unit: ' chỉ ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        type: 'gold',
        symbol: 'SJC',
        name: 'Vàng SJC',
        unit: 'chỉ',
      });
    }
  });

  it('rejects invalid asset fields', () => {
    const result = CreateAssetRequestSchema.safeParse({
      type: 'cash',
      symbol: '',
      name: '',
      unit: '',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.type);
      assert.ok(fieldErrors.symbol);
      assert.ok(fieldErrors.name);
      assert.ok(fieldErrors.unit);
    }
  });

  it('normalizes a valid create-asset-transaction request', () => {
    const result = CreateAssetTransactionRequestSchema.safeParse({
      type: 'buy',
      quantity: '0002.5000000000',
      unitPrice: 8000000,
      totalAmount: 20000000,
      transactionDate: '2026-07-10',
      paidByUserId,
      note: '  Mua vàng  ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        type: 'buy',
        quantity: '2.5',
        unitPrice: 8000000,
        totalAmount: 20000000,
        transactionDate: '2026-07-10',
        paidByUserId,
        note: 'Mua vàng',
      });
    }
  });

  it('rejects invalid asset transaction fields', () => {
    const result = CreateAssetTransactionRequestSchema.safeParse({
      type: 'transfer',
      quantity: '1.12345678901',
      unitPrice: 0,
      totalAmount: Number.MAX_SAFE_INTEGER + 1,
      transactionDate: '2026-13-40',
      paidByUserId: 'not-a-uuid',
      note: '',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.type);
      assert.ok(fieldErrors.quantity);
      assert.ok(fieldErrors.unitPrice);
      assert.ok(fieldErrors.totalAmount);
      assert.ok(fieldErrors.transactionDate);
      assert.ok(fieldErrors.paidByUserId);
      assert.ok(fieldErrors.note);
    }
  });

  it('parses asset list filters', () => {
    assert.deepEqual(ListAssetsQuerySchema.parse({ type: ['crypto'] }), { type: 'crypto' });
  });

  it('rejects inverted asset transaction date ranges', () => {
    const result = ListAssetTransactionsQuerySchema.safeParse({
      assetId,
      type: 'sell',
      fromDate: '2026-08-01',
      toDate: '2026-07-01',
      paidByUserId,
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /toDate/);
    }
  });
});
