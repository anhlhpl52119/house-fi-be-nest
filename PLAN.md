# Personal Finance Backend MVP Plan

> Backend project quản lý tài chính cá nhân cho 2 vợ chồng.  
> Stack: NestJS + TypeScript + PostgreSQL/Supabase + Drizzle ORM + Zod + JWT.  
> Storage Cloudflare R2 sẽ để phase sau, chưa implement trong MVP.

---

## 1. Product Context

Ứng dụng dùng cho 2 vợ chồng cùng quản lý tài chính gia đình.

Mục tiêu chính:

1. Ghi lại dòng tiền hằng ngày.
2. Theo dõi chi tiêu, thu nhập theo người, category, thời gian.
3. Quản lý giao dịch thẻ tín dụng, bao gồm chi tiêu pending và resolve từng giao dịch.
4. Quản lý trả góp qua thẻ tín dụng.
5. Quản lý tài sản: vàng, stock, crypto.
6. Quản lý các khoản tiết kiệm ngân hàng.
7. Tạo nền tảng schema dễ mở rộng cho các phase sau.

Ứng dụng không phải SaaS public trong MVP, nhưng database vẫn nên có `households` để sau này có thể mở rộng multi-household mà không refactor lớn.

---

## 2. Confirmed Product Decisions

### 2.1 Users and Visibility

- Có 2 người dùng chính: vợ và chồng.
- Cả 2 đều có thể nhìn thấy giao dịch của nhau.
- UI/API cần hỗ trợ filter theo người.
- Mỗi giao dịch nên lưu:
  - `paid_by_user_id`: giao dịch thuộc về / do ai thực hiện.
  - `created_by_user_id`: ai nhập dữ liệu vào app.

### 2.2 Currency

- Phase đầu chỉ dùng một loại tiền tệ duy nhất: `VND`.
- Không cần bảng currencies trong MVP.
- Tất cả amount VND lưu bằng integer/bigint theo đơn vị đồng.
- Không dùng float/double cho tiền.

### 2.3 Cash Account

- Không quản lý nhiều tài khoản ngân hàng/ví điện tử/tiền mặt riêng lẻ.
- Chỉ cần một khái niệm cash tổng cho gia đình.
- Không cần `opening_balance`.
- Cash balance được tính từ ledger:
  - cash income
  - cash expense
  - credit card payments
  - saving deposits/maturity
  - asset buy/sell linked cash movements

### 2.4 Transaction Types

Cash flow chỉ có:

- `income`
- `expense`

Không dùng:

- `transfer`
- `adjustment`

Lý do:

- App chỉ cho 2 người dùng chung tài chính.
- Việc chuyển qua lại giữa các tài khoản cùng bản chất không có nhiều ý nghĩa trong MVP.
- Tránh làm schema và báo cáo phức tạp.

### 2.5 Credit Card

Credit card là nghiệp vụ riêng, không nên ép hoàn toàn vào cash transaction.

Luồng đúng:

- Khi quẹt thẻ:
  - ghi nhận một khoản chi phí phát sinh.
  - chưa trừ vào cash chính.
  - transaction ở trạng thái pending.
- Khi tháng sau trả thẻ:
  - thực sự trừ cash.
  - resolve theo từng giao dịch credit card cụ thể.
  - không tính lại là một expense mới trong báo cáo chi tiêu phát sinh.

Báo cáo cần tách:

- Chi tiêu phát sinh: cash expenses + credit card expenses.
- Dòng tiền thực tế: cash income - cash expenses - credit card payments.
- Nợ/cảnh báo tháng sau: credit card pending + installment pending.

### 2.6 Installments

Trả góp là nghiệp vụ riêng.

Khi mua món hàng trả góp:

- Ghi nhận một expense gốc với tổng số tiền mua hàng.
- Không trừ cash ngay.
- Tạo lịch trả góp nhiều tháng.
- Mỗi tháng payment thực tế sẽ trừ cash.
- Không tính các payment hằng tháng là expense mới.

Không cần quan tâm tách phí/lãi trả góp. Chỉ cần tổng số tiền trả mỗi tháng.

### 2.7 Assets

Quản lý các loại tài sản:

- gold
- stock
- crypto

Asset transaction chỉ cần:

- `buy`
- `sell`

Không dùng:

- transfer in/out
- adjustment
- live price snapshots

Khi mua tài sản:

- Cash bị trừ.
- Asset quantity tăng.

Khi bán tài sản:

- Cash tăng theo số tiền thu về.
- Asset quantity giảm.

MVP chỉ cần ghi nhận số tiền thu về khi bán, chưa cần backend tự tính lời/lỗ.

Frontend có thể tính:

- tổng lượng đã mua
- tổng lượng đã bán
- lượng còn lại
- tổng tiền đã bỏ ra
- giá trị bán ra

### 2.8 Asset Price

- Không lưu giá live vào database.
- Không cần bảng `asset_price_snapshots` trong MVP.
- Giá hiện tại nếu cần thì frontend/backend gọi API bên thứ ba.
- Database chỉ lưu giá tại thời điểm mua/bán, do frontend gửi lên.

### 2.9 Savings

Quản lý nhiều khoản tiết kiệm ngân hàng.

Mục tiêu:

1. Tập trung hóa các khoản tiết kiệm.
2. Biết lãi suất, ngày gửi, ngày đáo hạn, tiền lời dự kiến/thực tế.
3. Hợp thức hóa dòng tiền: khi gửi tiết kiệm cash bị trừ; khi đáo hạn cash tăng lại.

Khi gửi tiết kiệm:

- Tạo cash transaction `expense` với category `Gửi tiết kiệm`.
- Tạo saving deposit tương ứng.

Khi đáo hạn:

- Tạo cash transaction `income` với amount = `gốc + lãi`.
- Update saving deposit thành matured.

Lý do ghi `gốc + lãi` là income: lúc gửi tiết kiệm, cash đã bị trừ ra khỏi dòng tiền.

### 2.10 Categories

- Category có phân cấp tối đa 2 cấp.
- Category có thể dùng cho income hoặc expense.
- Không cho phép category sâu hơn 2 cấp.

### 2.11 Attachments / R2

- Chưa cần trong MVP.
- Có thể thiết kế module sau cho hóa đơn, sao kê, file import/export.

### 2.12 Enum Policy

Quan trọng: không sử dụng PostgreSQL enum hoặc Drizzle enum.

Thay vào đó:

- Dùng string/varchar column.
- Dùng database `CHECK` constraints để giới hạn giá trị hợp lệ.
- Dùng TypeScript union types + Zod enum ở application layer.

Lý do:

- Dễ mở rộng và migration hơn enum native.
- Tránh khó khăn khi đổi/xóa/rename enum value trên PostgreSQL.

---

## 3. Technical Stack

### 3.1 Backend

- NestJS
- TypeScript
- Modular architecture
- REST API first
- OpenAPI/Swagger optional but recommended

### 3.2 Database

- PostgreSQL
- Supabase for phase đầu deployment
- Drizzle ORM
- Drizzle migrations

### 3.3 Validation

- Zod for:
  - request body validation
  - query params validation
  - env validation
- Use DTO schemas generated/defined with Zod, not class-validator.

### 3.4 Auth

- JWT access token.
- Refresh token recommended.
- Password hashing with argon2 or bcrypt.
- MVP can use email/password auth.

### 3.5 Storage

- Cloudflare R2 planned but not implemented in MVP.

---

## 4. Suggested NestJS Modules

```txt
src/
  app.module.ts
  config/
  database/
  auth/
  users/
  households/
  categories/
  cash-transactions/
  credit-cards/
  installments/
  assets/
  savings/
  reports/
  common/
```

### Module Responsibilities

#### `auth`

- register
- login
- refresh token
- logout
- current user

#### `users`

- user profile
- list household members

#### `households`

- create default household
- manage household members
- MVP may auto-create one household on first user registration

#### `categories`

- CRUD categories
- enforce max 2 levels
- filter by type

#### `cash-transactions`

- CRUD normal cash income/expense
- list transactions
- filter by date, category, paid_by_user_id, type

#### `credit-cards`

- create credit card expense
- list pending credit card transactions
- resolve individual credit card transaction
- list credit card payments

#### `installments`

- create installment plan
- generate installment schedule
- mark installment payment paid
- upcoming installment warnings

#### `assets`

- CRUD assets
- buy/sell asset
- asset holdings summary

#### `savings`

- create saving deposit
- mature saving deposit
- list active/matured deposits
- upcoming maturity warnings

#### `reports`

- monthly expense report
- cash flow report
- upcoming obligations report
- asset summary
- saving summary

---

## 5. Database Design Principles

1. Use UUID primary keys.
2. Every business table should have `household_id`.
3. Every user-created record should have `created_by_user_id`.
4. Soft delete is optional for MVP, but recommended for financial records.
5. Avoid destructive deletes for financial ledgers.
6. Store money as `bigint` in VND.
7. Store asset quantities as numeric decimal, not float.
8. Store timestamps as `timestamptz`.
9. Store business dates as `date` where time-of-day is not needed.
10. Do not use native enum. Use string + CHECK constraint.
11. Prefer ledger records over mutable balance fields.
12. Reports should be derived from transaction data.

---

## 6. Database Schema Draft

The following schema is a conceptual design. Implement with Drizzle using PostgreSQL tables and check constraints.

---

## 6.1 `users`

Purpose: app users.

```txt
users
- id uuid pk
- email varchar unique not null
- password_hash text not null
- display_name varchar not null
- avatar_url text nullable
- is_active boolean not null default true
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

Notes:

- Email/password MVP.
- Password hash should never be returned from API.

---

## 6.2 `households`

Purpose: financial group/family.

```txt
households
- id uuid pk
- name varchar not null
- created_by_user_id uuid not null references users(id)
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

---

## 6.3 `household_members`

Purpose: relation between users and households.

```txt
household_members
- id uuid pk
- household_id uuid not null references households(id)
- user_id uuid not null references users(id)
- role varchar not null
- joined_at timestamptz not null default now()
- is_active boolean not null default true

unique(household_id, user_id)
check(role in ('owner', 'member'))
```

MVP behavior:

- First user is owner.
- Second user can be added as member.

---

## 6.4 `categories`

Purpose: income/expense classification.

```txt
categories
- id uuid pk
- household_id uuid not null references households(id)
- parent_id uuid nullable references categories(id)
- name varchar not null
- type varchar not null
- icon varchar nullable
- color varchar nullable
- sort_order integer not null default 0
- is_active boolean not null default true
- created_by_user_id uuid not null references users(id)
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

check(type in ('income', 'expense'))
```

Business rules:

- Max depth: 2 levels.
- Parent category must belong to same household.
- Parent category must have same type.
- A child category cannot have another child.
- Category deletion should be soft-delete if used by transactions.

Suggested default expense categories:

- Ăn uống
- Đi chợ
- Hóa đơn
- Di chuyển
- Nhà cửa
- Sức khỏe
- Giải trí
- Mua sắm
- Mua tài sản
- Gửi tiết kiệm
- Khác

Suggested default income categories:

- Lương
- Kinh doanh
- Bán tài sản
- Đáo hạn tiết kiệm
- Lãi tiết kiệm
- Khác

---

## 6.5 `cash_transactions`

Purpose: real cash-impacting income/expense.

This table records transactions that affect the family cash balance immediately.

Examples:

- salary income
- daily expense paid by cash
- buying asset using cash
- receiving money from selling asset
- sending money into saving deposit
- receiving principal + interest from matured saving deposit

It should NOT record credit card spending at swipe time, because that does not affect cash yet.

```txt
cash_transactions
- id uuid pk
- household_id uuid not null references households(id)
- type varchar not null
- amount bigint not null
- transaction_date date not null
- category_id uuid nullable references categories(id)
- paid_by_user_id uuid nullable references users(id)
- created_by_user_id uuid not null references users(id)
- note text nullable
- source_type varchar nullable
- source_id uuid nullable
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

check(type in ('income', 'expense'))
check(amount > 0)
check(source_type is null or source_type in (
  'asset_transaction',
  'saving_deposit',
  'saving_maturity',
  'credit_card_payment',
  'manual'
))
```

Important convention:

- `amount` is always positive.
- Direction is determined by `type`.
- Cash balance formula:

```txt
cash_balance = sum(income amounts) - sum(expense amounts)
```

`source_type` and `source_id` allow linking this cash transaction to business records without requiring polymorphic foreign keys.

Examples:

- asset buy cash expense:
  - `type = expense`
  - `source_type = asset_transaction`
- saving deposit cash expense:
  - `type = expense`
  - `source_type = saving_deposit`
- credit card payment cash expense:
  - `type = expense`
  - `source_type = credit_card_payment`

---

## 6.6 `credit_card_transactions`

Purpose: credit card spending that has occurred but does not immediately affect cash.

```txt
credit_card_transactions
- id uuid pk
- household_id uuid not null references households(id)
- amount bigint not null
- transaction_date date not null
- category_id uuid nullable references categories(id)
- paid_by_user_id uuid nullable references users(id)
- created_by_user_id uuid not null references users(id)
- note text nullable
- status varchar not null default 'pending'
- expected_payment_date date nullable
- resolved_payment_id uuid nullable
- resolved_at timestamptz nullable
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

check(amount > 0)
check(status in ('pending', 'resolved', 'cancelled'))
```

Business rules:

- Pending transaction contributes to upcoming debt warning.
- Resolved transaction is linked to one `credit_card_payments` record.
- Resolving this transaction creates a real cash expense through `credit_card_payments` and `cash_transactions`.
- Credit card transaction itself should be included in expense-by-category reports based on `transaction_date`.
- Credit card transaction itself should not affect cash balance.

---

## 6.7 `credit_card_payments`

Purpose: cash payment used to settle exactly one credit card transaction.

User decision: resolve credit card by individual transaction.

```txt
credit_card_payments
- id uuid pk
- household_id uuid not null references households(id)
- credit_card_transaction_id uuid not null unique references credit_card_transactions(id)
- amount bigint not null
- payment_date date not null
- cash_transaction_id uuid not null unique references cash_transactions(id)
- created_by_user_id uuid not null references users(id)
- note text nullable
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

check(amount > 0)
```

Business rules:

- `amount` usually equals credit card transaction amount.
- When created:
  1. Create cash transaction:
     - type = `expense`
     - amount = payment amount
     - source_type = `credit_card_payment`
  2. Create credit card payment row.
  3. Update credit card transaction:
     - status = `resolved`
     - resolved_payment_id = payment id
     - resolved_at = now

Reporting rules:

- `credit_card_payments` affect cash flow.
- They should not be counted as new spending in expense category reports, otherwise spending is double-counted.

---

## 6.8 `installment_plans`

Purpose: represent original installment purchase.

```txt
installment_plans
- id uuid pk
- household_id uuid not null references households(id)
- original_amount bigint not null
- purchase_date date not null
- category_id uuid nullable references categories(id)
- paid_by_user_id uuid nullable references users(id)
- created_by_user_id uuid not null references users(id)
- note text nullable
- installment_count integer not null
- monthly_amount bigint not null
- status varchar not null default 'active'
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

check(original_amount > 0)
check(installment_count > 0)
check(monthly_amount > 0)
check(status in ('active', 'completed', 'cancelled'))
```

Business rules:

- The original purchase is included in expense reports using `purchase_date` and `original_amount`.
- The original purchase does not affect cash immediately.
- Do not create a `cash_transaction` at purchase time.
- Ignore interest/fee separation; only store monthly payment amount.

---

## 6.9 `installment_payments`

Purpose: monthly schedule and payment status for installment plans.

```txt
installment_payments
- id uuid pk
- household_id uuid not null references households(id)
- installment_plan_id uuid not null references installment_plans(id)
- sequence_no integer not null
- amount bigint not null
- due_date date not null
- status varchar not null default 'pending'
- paid_date date nullable
- cash_transaction_id uuid nullable unique references cash_transactions(id)
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

unique(installment_plan_id, sequence_no)
check(sequence_no > 0)
check(amount > 0)
check(status in ('pending', 'paid', 'cancelled'))
```

Business rules:

- On creating an installment plan, generate N payment rows.
- When paying one installment:
  1. Create cash transaction:
     - type = `expense`
     - amount = installment payment amount
     - source_type = `installment_payment`
  2. Mark installment payment as paid.
  3. If all payments are paid, mark plan as completed.

Important reporting rule:

- Installment plan original amount counts as spending.
- Installment payment cash transactions count as cash outflow.
- Installment payment cash transactions must not be counted again in spending category reports.

Note: add `installment_payment` to allowed `cash_transactions.source_type` check if using this flow.

Recommended final `source_type` allowed list:

```txt
'asset_transaction',
'saving_deposit',
'saving_maturity',
'credit_card_payment',
'installment_payment',
'manual'
```

---

## 6.10 `assets`

Purpose: master data for asset instruments.

```txt
assets
- id uuid pk
- household_id uuid not null references households(id)
- type varchar not null
- symbol varchar nullable
- name varchar not null
- unit varchar not null
- is_active boolean not null default true
- created_by_user_id uuid not null references users(id)
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

check(type in ('gold', 'stock', 'crypto'))
```

Examples:

```txt
Gold:
- type = gold
- symbol = SJC
- name = Vàng SJC
- unit = tael

Crypto:
- type = crypto
- symbol = BTC
- name = Bitcoin
- unit = BTC

Stock:
- type = stock
- symbol = VNM
- name = Vinamilk
- unit = share
```

---

## 6.11 `asset_transactions`

Purpose: buy/sell ledger for assets.

```txt
asset_transactions
- id uuid pk
- household_id uuid not null references households(id)
- asset_id uuid not null references assets(id)
- type varchar not null
- quantity numeric(30, 10) not null
- unit_price bigint not null
- total_amount bigint not null
- transaction_date date not null
- cash_transaction_id uuid nullable unique references cash_transactions(id)
- paid_by_user_id uuid nullable references users(id)
- created_by_user_id uuid not null references users(id)
- note text nullable
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

check(type in ('buy', 'sell'))
check(quantity > 0)
check(unit_price >= 0)
check(total_amount > 0)
```

Business rules:

### Asset Buy

Create asset transaction:

- type = `buy`
- quantity = bought quantity
- unit_price = submitted price
- total_amount = submitted total amount

Create linked cash transaction:

- type = `expense`
- amount = total_amount
- source_type = `asset_transaction`
- source_id = asset transaction id

### Asset Sell

Create asset transaction:

- type = `sell`
- quantity = sold quantity
- unit_price = submitted price
- total_amount = money received

Create linked cash transaction:

- type = `income`
- amount = total_amount
- source_type = `asset_transaction`
- source_id = asset transaction id

MVP does not require backend to calculate realized PnL.

Frontend/backend can calculate holdings:

```txt
current_quantity = sum(buy.quantity) - sum(sell.quantity)
total_buy_amount = sum(buy.total_amount)
total_sell_amount = sum(sell.total_amount)
```

Validation:

- On sell, prevent selling more than current holding unless product explicitly allows negative holding later.

---

## 6.12 `saving_deposits`

Purpose: track bank saving deposits.

```txt
saving_deposits
- id uuid pk
- household_id uuid not null references households(id)
- bank_name varchar not null
- principal_amount bigint not null
- interest_rate numeric(8, 4) not null
- start_date date not null
- maturity_date date not null
- term_months integer nullable
- expected_interest_amount bigint nullable
- actual_interest_amount bigint nullable
- status varchar not null default 'active'
- deposit_cash_transaction_id uuid not null unique references cash_transactions(id)
- maturity_cash_transaction_id uuid nullable unique references cash_transactions(id)
- paid_by_user_id uuid nullable references users(id)
- created_by_user_id uuid not null references users(id)
- note text nullable
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

check(principal_amount > 0)
check(interest_rate >= 0)
check(maturity_date >= start_date)
check(term_months is null or term_months > 0)
check(expected_interest_amount is null or expected_interest_amount >= 0)
check(actual_interest_amount is null or actual_interest_amount >= 0)
check(status in ('active', 'matured', 'withdrawn', 'cancelled'))
```

Business rules:

### Create Saving Deposit

Create cash transaction:

- type = `expense`
- amount = principal_amount
- category = `Gửi tiết kiệm`
- source_type = `saving_deposit`

Create saving deposit:

- status = `active`
- link `deposit_cash_transaction_id`

### Mature Saving Deposit

Create cash transaction:

- type = `income`
- amount = principal_amount + actual_interest_amount
- category = `Đáo hạn tiết kiệm`
- source_type = `saving_maturity`

Update saving deposit:

- status = `matured`
- actual_interest_amount = provided amount
- maturity_cash_transaction_id = new cash transaction id

Reporting:

- Active savings total = sum principal of active deposits.
- Upcoming maturity = active deposits where maturity_date is within selected window.

---

## 6.13 `refresh_tokens`

Purpose: JWT refresh token persistence.

```txt
refresh_tokens
- id uuid pk
- user_id uuid not null references users(id)
- token_hash text not null
- expires_at timestamptz not null
- revoked_at timestamptz nullable
- created_at timestamptz not null default now()

index(user_id)
```

Rules:

- Store only hash of refresh token.
- Revoke on logout.
- Rotate refresh token on use if desired.

---

## 7. Check Constraint Implementation Notes for Drizzle

Do not use native enums.

Use string columns plus check constraints.

Example style:

```ts
import { check, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const cashTransactions = pgTable(
  'cash_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 20 }).notNull(),
  },
  (table) => ({
    typeCheck: check(
      'cash_transactions_type_check',
      sql`${table.type} in ('income', 'expense')`,
    ),
  }),
);
```

Application layer should still define TypeScript union types:

```ts
export const CashTransactionTypeSchema = z.enum(['income', 'expense']);
export type CashTransactionType = z.infer<typeof CashTransactionTypeSchema>;
```

This gives:

- database-level safety
- application-level validation
- easier future migrations than native enum

---

## 8. Core Business Calculations

### 8.1 Cash Balance

```txt
cash_balance =
  sum(cash_transactions.amount where type = income)
  - sum(cash_transactions.amount where type = expense)
```

Credit card transactions do not affect cash until paid.

Installment plans do not affect cash until installment payments are paid.

---

### 8.2 Spending Report

Spending report should include expenses when they are incurred, not when cash is paid.

```txt
spending =
  cash_transactions where type = expense and source_type is null/manual/business-spending
  + credit_card_transactions
  + installment_plans original_amount
```

Important exclusions:

- Exclude cash transactions with `source_type = credit_card_payment` from spending report.
- Exclude cash transactions with `source_type = installment_payment` from spending report.

Otherwise reports will double-count spending.

Recommended approach:

- Build reports explicitly from business tables.
- Do not blindly sum all cash expenses for spending report.

---

### 8.3 Cash Flow Report

Cash flow report should include actual money movement.

```txt
cash inflow = cash_transactions income
cash outflow = cash_transactions expense
net cash flow = inflow - outflow
```

This includes:

- real cash expenses
- asset buys
- saving deposits
- credit card payments
- installment payments

---

### 8.4 Upcoming Obligations

Used for alerting next month expenses.

```txt
upcoming_obligations =
  pending credit_card_transactions by expected_payment_date
  + pending installment_payments by due_date
```

Optional later:

- recurring bills
- insurance
- subscriptions

---

### 8.5 Asset Holdings

```txt
quantity_remaining =
  sum(asset_transactions.quantity where type = buy)
  - sum(asset_transactions.quantity where type = sell)
```

```txt
total_buy_amount = sum(total_amount where type = buy)
total_sell_amount = sum(total_amount where type = sell)
```

Live value can be calculated outside DB using third-party price API.

---

### 8.6 Saving Summary

```txt
active_saving_principal = sum(principal_amount where status = active)
expected_interest = sum(expected_interest_amount where status = active)
```

Upcoming maturity:

```txt
active deposits where maturity_date between start_date and end_date
```

---

## 9. API Design Draft

Base path example: `/api/v1`

---

## 9.1 Auth APIs

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

---

## 9.2 Household APIs

```txt
GET  /households/current
POST /households/invite
GET  /households/members
```

MVP can simplify invite flow.

---

## 9.3 Category APIs

```txt
GET    /categories?type=expense|income
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id
```

Validation:

- parent category same household
- parent category same type
- max depth 2

---

## 9.4 Cash Transaction APIs

```txt
GET    /cash-transactions
POST   /cash-transactions
GET    /cash-transactions/:id
PATCH  /cash-transactions/:id
DELETE /cash-transactions/:id
```

Query filters:

```txt
type
from_date
to_date
category_id
paid_by_user_id
source_type
```

POST body example:

```json
{
  "type": "expense",
  "amount": 120000,
  "transactionDate": "2026-07-01",
  "categoryId": "uuid",
  "paidByUserId": "uuid",
  "note": "Ăn tối"
}
```

---

## 9.5 Credit Card APIs

```txt
GET  /credit-card/transactions
POST /credit-card/transactions
GET  /credit-card/transactions/pending
POST /credit-card/transactions/:id/resolve
POST /credit-card/transactions/:id/cancel
GET  /credit-card/payments
```

Create credit card transaction:

```json
{
  "amount": 2000000,
  "transactionDate": "2026-07-01",
  "categoryId": "uuid",
  "paidByUserId": "uuid",
  "expectedPaymentDate": "2026-08-10",
  "note": "Quẹt thẻ mua đồ"
}
```

Resolve transaction:

```json
{
  "paymentDate": "2026-08-10",
  "amount": 2000000,
  "note": "Thanh toán thẻ"
}
```

Resolve behavior:

- Validate credit card transaction is pending.
- Create cash transaction expense with source_type `credit_card_payment`.
- Create credit_card_payment.
- Mark credit_card_transaction resolved.
- Use DB transaction.

---

## 9.6 Installment APIs

```txt
GET  /installments/plans
POST /installments/plans
GET  /installments/plans/:id
GET  /installments/payments/upcoming
POST /installments/payments/:id/pay
POST /installments/plans/:id/cancel
```

Create installment plan:

```json
{
  "originalAmount": 12000000,
  "purchaseDate": "2026-07-01",
  "categoryId": "uuid",
  "paidByUserId": "uuid",
  "installmentCount": 6,
  "monthlyAmount": 2000000,
  "firstDueDate": "2026-08-10",
  "note": "Mua laptop trả góp"
}
```

Backend should generate payment schedule:

```txt
payment 1 due firstDueDate
payment 2 due firstDueDate + 1 month
...
payment N due firstDueDate + N-1 months
```

Pay installment:

```json
{
  "paidDate": "2026-08-10",
  "amount": 2000000,
  "note": "Thanh toán kỳ 1"
}
```

Behavior:

- Validate payment pending.
- Create cash transaction expense with source_type `installment_payment`.
- Mark installment payment paid.
- If all payments paid, mark plan completed.
- Use DB transaction.

---

## 9.7 Asset APIs

```txt
GET    /assets
POST   /assets
PATCH  /assets/:id
DELETE /assets/:id
GET    /assets/:id/transactions
POST   /assets/:id/buy
POST   /assets/:id/sell
GET    /assets/summary
```

Create asset:

```json
{
  "type": "crypto",
  "symbol": "BTC",
  "name": "Bitcoin",
  "unit": "BTC"
}
```

Buy asset:

```json
{
  "quantity": "0.05",
  "unitPrice": 1500000000,
  "totalAmount": 75000000,
  "transactionDate": "2026-07-01",
  "paidByUserId": "uuid",
  "note": "Mua BTC"
}
```

Sell asset:

```json
{
  "quantity": "0.02",
  "unitPrice": 1600000000,
  "totalAmount": 32000000,
  "transactionDate": "2026-08-01",
  "paidByUserId": "uuid",
  "note": "Bán BTC"
}
```

Behavior:

- Buy creates asset_transaction + cash expense.
- Sell creates asset_transaction + cash income.
- Sell must validate sufficient quantity.
- Use DB transaction.

---

## 9.8 Saving APIs

```txt
GET  /savings/deposits
POST /savings/deposits
GET  /savings/deposits/active
GET  /savings/deposits/upcoming-maturity
POST /savings/deposits/:id/mature
POST /savings/deposits/:id/cancel
```

Create saving deposit:

```json
{
  "bankName": "VCB",
  "principalAmount": 100000000,
  "interestRate": "5.2000",
  "startDate": "2026-07-01",
  "maturityDate": "2027-01-01",
  "termMonths": 6,
  "expectedInterestAmount": 2600000,
  "paidByUserId": "uuid",
  "note": "Gửi tiết kiệm 6 tháng"
}
```

Mature saving deposit:

```json
{
  "actualInterestAmount": 2600000,
  "maturityDate": "2027-01-01",
  "note": "Đáo hạn"
}
```

Behavior:

- Create deposit creates cash expense.
- Mature deposit creates cash income with amount = principal + actual interest.
- Use DB transaction.

---

## 9.9 Report APIs

```txt
GET /reports/monthly-spending?month=2026-07
GET /reports/cash-flow?from=2026-07-01&to=2026-07-31
GET /reports/upcoming-obligations?from=2026-08-01&to=2026-08-31
GET /reports/assets/summary
GET /reports/savings/summary
```

---

## 10. Transactional Integrity Requirements

Use database transactions for multi-step operations:

1. Resolve credit card transaction.
2. Pay installment payment.
3. Buy asset.
4. Sell asset.
5. Create saving deposit.
6. Mature saving deposit.

If any step fails, rollback all changes.

Examples:

### Asset Buy Transaction

```txt
BEGIN
  insert asset_transactions
  insert cash_transactions
  update asset_transactions.cash_transaction_id
COMMIT
```

### Credit Card Resolve Transaction

```txt
BEGIN
  validate credit_card_transaction pending
  insert cash_transactions
  insert credit_card_payments
  update credit_card_transactions status resolved
COMMIT
```

---

## 11. Authorization Rules

Every request must be scoped by authenticated user's household.

Rules:

- User can only access data in households they belong to.
- Every query must filter by `household_id`.
- Do not trust household_id from request body unless verified.
- Prefer deriving current household from auth context or selected household header.

MVP simplification:

- User belongs to one household.
- Resolve household from current user membership.

---

## 12. Validation Rules with Zod

Common validation:

```txt
amount: positive integer
date: ISO date string yyyy-mm-dd
uuid: valid UUID
note: optional string max length
```

Money:

```ts
z.number().int().positive()
```

Asset quantity:

```ts
z.string().regex(/^\d+(\.\d+)?$/)
```

Reason: decimal precision should not rely on JavaScript floating point.

Type strings:

```ts
z.enum(['income', 'expense'])
z.enum(['pending', 'resolved', 'cancelled'])
z.enum(['gold', 'stock', 'crypto'])
z.enum(['buy', 'sell'])
```

Even though DB does not use enum, Zod enum is fine at application boundary.

---

## 13. Reporting Semantics

This is critical. Do not mix up spending and cash flow.

### 13.1 Spending

Means: expenses incurred by the family.

Includes:

- cash expense for normal spending
- credit card transaction amount
- original installment amount

May include:

- asset purchase if user wants total outflow spending view
- saving deposit if user wants cash allocation view

But for lifestyle expense report, exclude:

- asset purchases
- saving deposits
- credit card payments
- installment payments

Recommended: support report modes later.

```txt
spending_report_mode:
- lifestyle_expense
- all_expense_commitments
- cash_outflow
```

MVP can start with two reports:

1. Spending incurred report.
2. Cash flow report.

### 13.2 Cash Flow

Means: actual VND movement in/out of cash.

Includes all `cash_transactions`.

### 13.3 Upcoming Obligations

Means: expected future cash outflow.

Includes:

- pending credit card transactions
- pending installment payments

---

## 14. Suggested Implementation Order

### Phase 0: Project Setup

1. Create NestJS project.
2. Setup env validation with Zod.
3. Setup Drizzle connection.
4. Setup migration scripts.
5. Setup global exception filter.
6. Setup request validation pipe for Zod.

### Phase 1: Auth and Household

1. Implement users table.
2. Implement households table.
3. Implement household_members table.
4. Register/login/JWT.
5. Auto-create default household for first user.
6. Add second member flow.

### Phase 2: Categories

1. Implement categories schema.
2. Seed default categories.
3. CRUD category.
4. Enforce max depth 2.

### Phase 3: Cash Transactions

1. Implement cash_transactions table.
2. Create/list/update/delete cash transactions.
3. Basic filters.
4. Basic cash balance endpoint.

### Phase 4: Credit Card

1. Implement credit_card_transactions.
2. Implement credit_card_payments.
3. Create pending credit card transactions.
4. Resolve individual transaction.
5. Upcoming pending warning endpoint.

### Phase 5: Installments

1. Implement installment_plans.
2. Implement installment_payments.
3. Create plan and generate schedule.
4. Pay installment.
5. Upcoming installment endpoint.

### Phase 6: Assets

1. Implement assets.
2. Implement asset_transactions.
3. Buy asset.
4. Sell asset.
5. Asset holdings summary.

### Phase 7: Savings

1. Implement saving_deposits.
2. Create saving deposit.
3. Mature saving deposit.
4. Active deposits summary.
5. Upcoming maturity endpoint.

### Phase 8: Reports

1. Monthly spending incurred.
2. Cash flow.
3. Upcoming obligations.
4. Asset summary.
5. Saving summary.

---

## 15. Non-Goals for MVP

Do not implement in MVP unless explicitly requested:

- Multi-currency.
- Bank account sync.
- Multiple cash/bank/e-wallet accounts.
- Native PostgreSQL enums.
- Asset live price history.
- Asset transfer between accounts.
- Asset adjustment.
- Cash transfer.
- Opening balance.
- Receipt upload/R2.
- Recurring transactions.
- Budgeting.
- Advanced PnL calculation.
- Tax calculation.
- Stock split/dividend.
- Partial credit card payment across multiple transactions.
- Credit card statement cycle automation.

---

## 16. Future Extensions

Possible later additions:

### 16.1 Multiple Cash Accounts

Add table:

```txt
cash_accounts
- id
- household_id
- name
- type
```

Then add `cash_account_id` to cash transactions.

### 16.2 R2 Attachments

Add table:

```txt
files
- id
- household_id
- object_key
- visibility
- mime_type
- size
- linked_entity_type
- linked_entity_id
```

### 16.3 Recurring Transactions

Add recurring rules for bills/subscriptions.

### 16.4 Budgets

Add monthly budgets by category.

### 16.5 Credit Card Statement Cycles

Add:

```txt
credit_card_statements
credit_card_statement_items
```

### 16.6 Asset Price Integration

Add third-party API integration. Avoid storing every live tick. Store only manual snapshots or periodic daily snapshots if needed.

---

## 17. Important Edge Cases

### 17.1 Double Counting Credit Card

Never count both:

- credit card transaction
- credit card payment cash transaction

as spending.

Credit card transaction = spending incurred.  
Credit card payment = cash movement.

### 17.2 Double Counting Installments

Never count both:

- installment original amount
- installment monthly payment cash transaction

as spending.

Installment plan = spending incurred.  
Installment payment = cash movement.

### 17.3 Saving Deposit Reporting

Saving deposit is cash outflow but not lifestyle spending.

Maturity income includes principal + interest because principal was already deducted when deposited.

### 17.4 Asset Buy/Sell Reporting

Asset buy is cash outflow and asset increase.  
Asset sell is cash inflow and asset decrease.

Do not treat asset sell income as salary/business income unless reporting groups distinguish it.

### 17.5 Category Parent Validation

If creating a child category:

- parent must exist
- parent must belong to same household
- parent must have same type
- parent must not itself have a parent if max depth is 2

---

## 18. Minimal Seed Data

When household is created, seed default categories.

### Expense Categories

```txt
Ăn uống
Đi chợ
Hóa đơn
Di chuyển
Nhà cửa
Sức khỏe
Giải trí
Mua sắm
Mua tài sản
Gửi tiết kiệm
Thanh toán thẻ tín dụng
Trả góp
Khác
```

### Income Categories

```txt
Lương
Kinh doanh
Bán tài sản
Đáo hạn tiết kiệm
Lãi tiết kiệm
Khác
```

Note:

- `Thanh toán thẻ tín dụng` and `Trả góp` should generally be excluded from spending incurred reports if they represent cash settlement only.

---

## 19. Recommended Indexes

```txt
users(email)
household_members(user_id)
household_members(household_id, user_id)
categories(household_id, type)
cash_transactions(household_id, transaction_date)
cash_transactions(household_id, type, transaction_date)
cash_transactions(household_id, paid_by_user_id, transaction_date)
credit_card_transactions(household_id, status, expected_payment_date)
credit_card_transactions(household_id, transaction_date)
installment_payments(household_id, status, due_date)
asset_transactions(household_id, asset_id, transaction_date)
saving_deposits(household_id, status, maturity_date)
```

---

## 20. Definition of Done for MVP Backend

Backend MVP is considered complete when:

1. User can register/login.
2. Household exists with two members.
3. Both members can view/filter each other's transactions.
4. User can manage 2-level categories.
5. User can create cash income/expense.
6. User can create credit card transaction.
7. User can resolve credit card transaction individually.
8. User can create installment plan and pay monthly installment.
9. User can create asset and buy/sell asset.
10. User can create saving deposit and mature it.
11. User can view:
    - cash balance
    - monthly spending incurred
    - cash flow
    - upcoming credit card/installment obligations
    - asset holdings
    - active savings
12. All multi-step financial actions use DB transactions.
13. All data access is scoped by household.
14. No native enum is used in database schema.
15. String status/type columns have check constraints.

