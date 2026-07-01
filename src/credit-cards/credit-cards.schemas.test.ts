import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CreateCreditCardTransactionRequestSchema,
  ListCreditCardPaymentsQuerySchema,
  ListCreditCardTransactionsQuerySchema,
  ResolveCreditCardTransactionRequestSchema,
} from './credit-cards.schemas.js';

const categoryId = '63bd5aa8-bb5b-420e-a054-97d7832efd42';
const paidByUserId = 'b605cfab-1b60-4e45-9b43-1b2a6d1b3c62';
const creditCardTransactionId = 'c85bdb55-c13e-4b4e-b5b1-9c6dfe5ca3d9';

describe('Credit card request schemas', () => {
  it('normalizes a valid create-credit-card-transaction request', () => {
    const result = CreateCreditCardTransactionRequestSchema.safeParse({
      amount: 350000,
      transactionDate: '2026-07-01',
      categoryId,
      paidByUserId,
      expectedPaymentDate: '2026-08-10',
      note: '  Siêu thị  ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        amount: 350000,
        transactionDate: '2026-07-01',
        categoryId,
        paidByUserId,
        expectedPaymentDate: '2026-08-10',
        note: 'Siêu thị',
      });
    }
  });

  it('rejects create requests whose expected payment date is before transaction date', () => {
    const result = CreateCreditCardTransactionRequestSchema.safeParse({
      amount: 350000,
      transactionDate: '2026-07-10',
      expectedPaymentDate: '2026-07-01',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /expectedPaymentDate/);
    }
  });

  it('parses list transaction filters', () => {
    assert.deepEqual(
      ListCreditCardTransactionsQuerySchema.parse({
        status: ['resolved'],
        fromDate: '2026-07-01',
        toDate: '2026-07-31',
        categoryId,
        paidByUserId,
        expectedPaymentFrom: '2026-08-01',
        expectedPaymentTo: '2026-08-31',
      }),
      {
        status: 'resolved',
        fromDate: '2026-07-01',
        toDate: '2026-07-31',
        categoryId,
        paidByUserId,
        expectedPaymentFrom: '2026-08-01',
        expectedPaymentTo: '2026-08-31',
      },
    );
  });

  it('rejects invalid resolve requests', () => {
    const result = ResolveCreditCardTransactionRequestSchema.safeParse({
      paymentDate: '2026-13-40',
      note: '',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.paymentDate);
      assert.ok(fieldErrors.note);
    }
  });

  it('parses payment list filters', () => {
    assert.deepEqual(
      ListCreditCardPaymentsQuerySchema.parse({
        creditCardTransactionId,
        fromDate: '2026-08-01',
        toDate: '2026-08-31',
      }),
      {
        creditCardTransactionId,
        fromDate: '2026-08-01',
        toDate: '2026-08-31',
      },
    );
  });
});
