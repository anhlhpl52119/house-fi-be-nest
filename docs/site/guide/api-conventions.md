# API conventions

## Common field formats

| Field kind | Format |
| --- | --- |
| UUID | RFC 4122 UUID string |
| Date | ISO date string, `YYYY-MM-DD` |
| Month | `YYYY-MM` |
| Timestamp | ISO-like timestamp string returned by the server |
| Money | Integer VND amount, positive for request amounts |
| Quantity | Decimal string, up to 20 integer digits and 10 fractional digits |
| Nullable owner/user refs | `paidByUserId` may be `null` or omitted to default to the current user in many create flows |

## Household scope

Business records include `householdId` in responses, but authenticated clients do not send `householdId`. The API resolves household scope from the caller's active membership.

## Created and paid-by users

- `createdByUserId` records who entered the data.
- `paidByUserId` records who paid/performed the financial action.
- Both members can see household records in the MVP.

## Date range filters

Date-range query pairs reject inverted ranges. For example `toDate` must be on or after `fromDate`, and `maturityTo` must be on or after `maturityFrom`.

## Generated cash flows

Some workflows create generated cash transactions instead of asking clients to create manual cash rows:

- credit-card settlement: `sourceType = credit_card_payment`
- installment payment: `sourceType = installment_payment`
- asset buy/sell: `sourceType = asset_transaction`
- saving deposit: `sourceType = saving_deposit`
- saving maturity: `sourceType = saving_maturity`

Generated flows affect cash balance but are excluded from spending-incurred reports when the original business record already represents the spending event.
