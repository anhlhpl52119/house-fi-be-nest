import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CreateInstallmentPlanRequestSchema,
  ListInstallmentPlansQuerySchema,
  ListUpcomingInstallmentPaymentsQuerySchema,
  PayInstallmentPaymentRequestSchema,
} from './installments.schemas.js';

const categoryId = '63bd5aa8-bb5b-420e-a054-97d7832efd42';
const paidByUserId = 'b605cfab-1b60-4e45-9b43-1b2a6d1b3c62';
const installmentPlanId = 'c85bdb55-c13e-4b4e-b5b1-9c6dfe5ca3d9';

describe('Installment request schemas', () => {
  it('normalizes a valid create-installment-plan request', () => {
    const result = CreateInstallmentPlanRequestSchema.safeParse({
      originalAmount: 12000000,
      purchaseDate: '2026-07-01',
      categoryId,
      paidByUserId,
      installmentCount: 6,
      monthlyAmount: 2000000,
      firstDueDate: '2026-08-10',
      note: '  Mua laptop trả góp  ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        originalAmount: 12000000,
        purchaseDate: '2026-07-01',
        categoryId,
        paidByUserId,
        installmentCount: 6,
        monthlyAmount: 2000000,
        firstDueDate: '2026-08-10',
        note: 'Mua laptop trả góp',
      });
    }
  });

  it('rejects create requests whose first due date is before purchase date', () => {
    const result = CreateInstallmentPlanRequestSchema.safeParse({
      originalAmount: 12000000,
      purchaseDate: '2026-07-10',
      installmentCount: 6,
      monthlyAmount: 2000000,
      firstDueDate: '2026-07-01',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /firstDueDate/);
    }
  });

  it('parses list installment-plan filters', () => {
    assert.deepEqual(
      ListInstallmentPlansQuerySchema.parse({
        status: ['completed'],
        fromDate: '2026-07-01',
        toDate: '2026-07-31',
        categoryId,
        paidByUserId,
      }),
      {
        status: 'completed',
        fromDate: '2026-07-01',
        toDate: '2026-07-31',
        categoryId,
        paidByUserId,
      },
    );
  });

  it('rejects inverted upcoming-payment date ranges', () => {
    const result = ListUpcomingInstallmentPaymentsQuerySchema.safeParse({
      installmentPlanId,
      dueFrom: '2026-09-01',
      dueTo: '2026-08-01',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /dueTo/);
    }
  });

  it('rejects invalid pay-installment requests', () => {
    const result = PayInstallmentPaymentRequestSchema.safeParse({
      paidDate: '2026-13-40',
      amount: 0,
      note: '',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.paidDate);
      assert.ok(fieldErrors.amount);
      assert.ok(fieldErrors.note);
    }
  });
});
