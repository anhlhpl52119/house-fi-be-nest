import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CashFlowQuerySchema,
  MonthlySpendingQuerySchema,
  SavingsSummaryQuerySchema,
  UpcomingObligationsQuerySchema,
} from './reports.schemas.js';

const paidByUserId = 'b605cfab-1b60-4e45-9b43-1b2a6d1b3c62';

describe('Report request schemas', () => {
  it('parses monthly spending filters', () => {
    assert.deepEqual(MonthlySpendingQuerySchema.parse({ month: ['2026-07'], paidByUserId }), {
      month: '2026-07',
      paidByUserId,
    });
  });

  it('rejects invalid monthly spending filters', () => {
    const result = MonthlySpendingQuerySchema.safeParse({ month: '2026-13', paidByUserId: 'not-a-uuid' });

    assert.equal(result.success, false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.month);
      assert.ok(fieldErrors.paidByUserId);
    }
  });

  it('parses cash-flow date range filters', () => {
    assert.deepEqual(CashFlowQuerySchema.parse({ from: ['2026-07-01'], to: '2026-07-31' }), {
      from: '2026-07-01',
      to: '2026-07-31',
    });
  });

  it('rejects inverted cash-flow date ranges', () => {
    const result = CashFlowQuerySchema.safeParse({ from: '2026-08-01', to: '2026-07-01' });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /to/);
    }
  });

  it('uses the same date-range validation for upcoming obligations', () => {
    const result = UpcomingObligationsQuerySchema.safeParse({ from: '2026-08-01', to: '2026-08-31' });

    assert.equal(result.success, true);
  });

  it('parses savings summary maturity window filters', () => {
    assert.deepEqual(
      SavingsSummaryQuerySchema.parse({ maturityFrom: '2027-01-01', maturityTo: ['2027-12-31'] }),
      {
        maturityFrom: '2027-01-01',
        maturityTo: '2027-12-31',
      },
    );
  });

  it('rejects inverted savings summary maturity windows', () => {
    const result = SavingsSummaryQuerySchema.safeParse({ maturityFrom: '2027-12-31', maturityTo: '2027-01-01' });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /maturityTo/);
    }
  });
});
