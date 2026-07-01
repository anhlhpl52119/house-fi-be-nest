import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CreateSavingDepositRequestSchema,
  ListSavingDepositsQuerySchema,
  MatureSavingDepositRequestSchema,
} from './savings.schemas.js';

const paidByUserId = 'b605cfab-1b60-4e45-9b43-1b2a6d1b3c62';

describe('Savings request schemas', () => {
  it('normalizes a valid create-saving-deposit request', () => {
    const result = CreateSavingDepositRequestSchema.safeParse({
      bankName: '  Techcombank  ',
      principalAmount: 100000000,
      interestRate: '06.5000',
      startDate: '2026-07-01',
      maturityDate: '2027-01-01',
      termMonths: 6,
      expectedInterestAmount: 3250000,
      paidByUserId,
      note: '  Tiết kiệm 6 tháng  ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        bankName: 'Techcombank',
        principalAmount: 100000000,
        interestRate: '6.5',
        startDate: '2026-07-01',
        maturityDate: '2027-01-01',
        termMonths: 6,
        expectedInterestAmount: 3250000,
        paidByUserId,
        note: 'Tiết kiệm 6 tháng',
      });
    }
  });

  it('rejects invalid create-saving-deposit fields', () => {
    const result = CreateSavingDepositRequestSchema.safeParse({
      bankName: '',
      principalAmount: 0,
      interestRate: '10000.00001',
      startDate: '2026-13-01',
      maturityDate: '2026-01-01',
      termMonths: 0,
      expectedInterestAmount: -1,
      paidByUserId: 'not-a-uuid',
      note: '',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.bankName);
      assert.ok(fieldErrors.principalAmount);
      assert.ok(fieldErrors.interestRate);
      assert.ok(fieldErrors.startDate);
      assert.ok(fieldErrors.maturityDate);
      assert.ok(fieldErrors.termMonths);
      assert.ok(fieldErrors.expectedInterestAmount);
      assert.ok(fieldErrors.paidByUserId);
      assert.ok(fieldErrors.note);
    }
  });

  it('parses saving deposit list filters', () => {
    assert.deepEqual(
      ListSavingDepositsQuerySchema.parse({
        status: ['matured'],
        startFrom: '2026-01-01',
        startTo: '2026-12-31',
        maturityFrom: '2026-07-01',
        maturityTo: '2027-01-01',
        paidByUserId,
      }),
      {
        status: 'matured',
        startFrom: '2026-01-01',
        startTo: '2026-12-31',
        maturityFrom: '2026-07-01',
        maturityTo: '2027-01-01',
        paidByUserId,
      },
    );
  });

  it('rejects inverted saving deposit list date ranges', () => {
    const result = ListSavingDepositsQuerySchema.safeParse({
      startFrom: '2026-08-01',
      startTo: '2026-07-01',
      maturityFrom: '2027-02-01',
      maturityTo: '2027-01-01',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.equal(result.error.issues.length, 2);
    }
  });

  it('normalizes a valid mature-saving-deposit request', () => {
    const result = MatureSavingDepositRequestSchema.safeParse({
      maturityDate: '2027-01-01',
      actualInterestAmount: 3250000,
      note: '  Tất toán tiết kiệm  ',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.deepEqual(result.data, {
        maturityDate: '2027-01-01',
        actualInterestAmount: 3250000,
        note: 'Tất toán tiết kiệm',
      });
    }
  });

  it('rejects invalid mature-saving-deposit fields', () => {
    const result = MatureSavingDepositRequestSchema.safeParse({
      maturityDate: '2027-13-01',
      actualInterestAmount: -1,
      note: '',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.maturityDate);
      assert.ok(fieldErrors.actualInterestAmount);
      assert.ok(fieldErrors.note);
    }
  });
});
