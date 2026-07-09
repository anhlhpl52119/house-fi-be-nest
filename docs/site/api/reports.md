# Reports API

Reports are derived projections over business and ledger records. Routes require bearer auth.

## `GET /reports/monthly-spending`

Returns spending incurred for a month.

### Counts as spending

- Manual cash expenses
- Credit-card transactions when swiped
- Original installment plan purchases

Generated credit-card payments, installment payments, asset buys, and saving deposits are not double-counted as lifestyle spending here.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `month` | string | Required `YYYY-MM` |
| `paidByUserId` | UUID | Optional |

### Response highlights

`totalAmount`, `bySource`, and `byCategory` in VND.

## `GET /reports/cash-flow`

Returns actual cash movement for a date range.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `from` | date | Required |
| `to` | date | Required; on or after `from` |

### Response highlights

`incomeAmount`, `expenseAmount`, `netAmount`, and `bySourceType`.

## `GET /reports/upcoming-obligations`

Returns pending credit-card and installment obligations due in a date range.

### Query

Same as cash-flow: required `from` and `to` dates.

### Response highlights

`totalAmount`, `items`, and `bySource` where source is `credit_card` or `installment`.

## `GET /reports/assets/summary`

Returns asset holdings and recorded buy/sell totals.

### Response highlights

Each asset includes `currentQuantity`, `totalBuyQuantity`, `totalSellQuantity`, `totalBuyAmount`, and `totalSellAmount`.

## `GET /reports/savings/summary`

Returns saving totals and upcoming maturities.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `maturityFrom` | date | Optional |
| `maturityTo` | date | Optional; on or after `maturityFrom` |

### Response highlights

`activePrincipalAmount`, expected and actual interest totals, and `upcomingMaturities`.
