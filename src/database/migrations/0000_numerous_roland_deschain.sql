CREATE TABLE "asset_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"quantity" numeric(30, 10) NOT NULL,
	"unit_price" bigint NOT NULL,
	"total_amount" bigint NOT NULL,
	"transaction_date" date NOT NULL,
	"cash_transaction_id" uuid,
	"paid_by_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_transactions_type_check" CHECK ("asset_transactions"."type" in ('buy', 'sell')),
	CONSTRAINT "asset_transactions_quantity_check" CHECK ("asset_transactions"."quantity" > 0),
	CONSTRAINT "asset_transactions_unit_price_check" CHECK ("asset_transactions"."unit_price" >= 0),
	CONSTRAINT "asset_transactions_total_amount_check" CHECK ("asset_transactions"."total_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"symbol" varchar(40),
	"name" varchar(160) NOT NULL,
	"unit" varchar(40) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_type_check" CHECK ("assets"."type" in ('gold', 'stock', 'crypto'))
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(120) NOT NULL,
	"type" varchar(20) NOT NULL,
	"icon" varchar(80),
	"color" varchar(40),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_type_check" CHECK ("categories"."type" in ('income', 'expense'))
);
--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" bigint NOT NULL,
	"transaction_date" date NOT NULL,
	"category_id" uuid,
	"paid_by_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"note" text,
	"source_type" varchar(40),
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_transactions_type_check" CHECK ("cash_transactions"."type" in ('income', 'expense')),
	CONSTRAINT "cash_transactions_amount_check" CHECK ("cash_transactions"."amount" > 0),
	CONSTRAINT "cash_transactions_source_type_check" CHECK ("cash_transactions"."source_type" is null or "cash_transactions"."source_type" in ('asset_transaction', 'saving_deposit', 'saving_maturity', 'credit_card_payment', 'installment_payment', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "credit_card_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"credit_card_transaction_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"payment_date" date NOT NULL,
	"cash_transaction_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_card_payments_amount_check" CHECK ("credit_card_payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "credit_card_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"transaction_date" date NOT NULL,
	"category_id" uuid,
	"paid_by_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"note" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expected_payment_date" date,
	"resolved_payment_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_card_transactions_amount_check" CHECK ("credit_card_transactions"."amount" > 0),
	CONSTRAINT "credit_card_transactions_status_check" CHECK ("credit_card_transactions"."status" in ('pending', 'resolved', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "household_members_role_check" CHECK ("household_members"."role" in ('owner', 'member'))
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"installment_plan_id" uuid NOT NULL,
	"sequence_no" integer NOT NULL,
	"amount" bigint NOT NULL,
	"due_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_date" date,
	"cash_transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installment_payments_sequence_no_check" CHECK ("installment_payments"."sequence_no" > 0),
	CONSTRAINT "installment_payments_amount_check" CHECK ("installment_payments"."amount" > 0),
	CONSTRAINT "installment_payments_status_check" CHECK ("installment_payments"."status" in ('pending', 'paid', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "installment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"original_amount" bigint NOT NULL,
	"purchase_date" date NOT NULL,
	"category_id" uuid,
	"paid_by_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"note" text,
	"installment_count" integer NOT NULL,
	"monthly_amount" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installment_plans_original_amount_check" CHECK ("installment_plans"."original_amount" > 0),
	CONSTRAINT "installment_plans_installment_count_check" CHECK ("installment_plans"."installment_count" > 0),
	CONSTRAINT "installment_plans_monthly_amount_check" CHECK ("installment_plans"."monthly_amount" > 0),
	CONSTRAINT "installment_plans_status_check" CHECK ("installment_plans"."status" in ('active', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "saving_deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"bank_name" varchar(160) NOT NULL,
	"principal_amount" bigint NOT NULL,
	"interest_rate" numeric(8, 4) NOT NULL,
	"start_date" date NOT NULL,
	"maturity_date" date NOT NULL,
	"term_months" integer,
	"expected_interest_amount" bigint,
	"actual_interest_amount" bigint,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"deposit_cash_transaction_id" uuid NOT NULL,
	"maturity_cash_transaction_id" uuid,
	"paid_by_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saving_deposits_principal_amount_check" CHECK ("saving_deposits"."principal_amount" > 0),
	CONSTRAINT "saving_deposits_interest_rate_check" CHECK ("saving_deposits"."interest_rate" >= 0),
	CONSTRAINT "saving_deposits_maturity_date_check" CHECK ("saving_deposits"."maturity_date" >= "saving_deposits"."start_date"),
	CONSTRAINT "saving_deposits_term_months_check" CHECK ("saving_deposits"."term_months" is null or "saving_deposits"."term_months" > 0),
	CONSTRAINT "saving_deposits_expected_interest_amount_check" CHECK ("saving_deposits"."expected_interest_amount" is null or "saving_deposits"."expected_interest_amount" >= 0),
	CONSTRAINT "saving_deposits_actual_interest_amount_check" CHECK ("saving_deposits"."actual_interest_amount" is null or "saving_deposits"."actual_interest_amount" >= 0),
	CONSTRAINT "saving_deposits_status_check" CHECK ("saving_deposits"."status" in ('active', 'matured', 'withdrawn', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_cash_transaction_id_cash_transactions_id_fk" FOREIGN KEY ("cash_transaction_id") REFERENCES "public"."cash_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_payments" ADD CONSTRAINT "credit_card_payments_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_payments" ADD CONSTRAINT "credit_card_payments_credit_card_transaction_id_credit_card_transactions_id_fk" FOREIGN KEY ("credit_card_transaction_id") REFERENCES "public"."credit_card_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_payments" ADD CONSTRAINT "credit_card_payments_cash_transaction_id_cash_transactions_id_fk" FOREIGN KEY ("cash_transaction_id") REFERENCES "public"."cash_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_payments" ADD CONSTRAINT "credit_card_payments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_payments" ADD CONSTRAINT "installment_payments_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_payments" ADD CONSTRAINT "installment_payments_installment_plan_id_installment_plans_id_fk" FOREIGN KEY ("installment_plan_id") REFERENCES "public"."installment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_payments" ADD CONSTRAINT "installment_payments_cash_transaction_id_cash_transactions_id_fk" FOREIGN KEY ("cash_transaction_id") REFERENCES "public"."cash_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saving_deposits" ADD CONSTRAINT "saving_deposits_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saving_deposits" ADD CONSTRAINT "saving_deposits_deposit_cash_transaction_id_cash_transactions_id_fk" FOREIGN KEY ("deposit_cash_transaction_id") REFERENCES "public"."cash_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saving_deposits" ADD CONSTRAINT "saving_deposits_maturity_cash_transaction_id_cash_transactions_id_fk" FOREIGN KEY ("maturity_cash_transaction_id") REFERENCES "public"."cash_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saving_deposits" ADD CONSTRAINT "saving_deposits_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saving_deposits" ADD CONSTRAINT "saving_deposits_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_transactions_cash_transaction_unique" ON "asset_transactions" USING btree ("cash_transaction_id");--> statement-breakpoint
CREATE INDEX "asset_transactions_household_asset_date_idx" ON "asset_transactions" USING btree ("household_id","asset_id","transaction_date");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_household_type_idx" ON "categories" USING btree ("household_id","type");--> statement-breakpoint
CREATE INDEX "cash_transactions_household_date_idx" ON "cash_transactions" USING btree ("household_id","transaction_date");--> statement-breakpoint
CREATE INDEX "cash_transactions_household_type_date_idx" ON "cash_transactions" USING btree ("household_id","type","transaction_date");--> statement-breakpoint
CREATE INDEX "cash_transactions_household_paid_by_date_idx" ON "cash_transactions" USING btree ("household_id","paid_by_user_id","transaction_date");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_payments_transaction_unique" ON "credit_card_payments" USING btree ("credit_card_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_payments_cash_transaction_unique" ON "credit_card_payments" USING btree ("cash_transaction_id");--> statement-breakpoint
CREATE INDEX "credit_card_transactions_household_status_expected_payment_idx" ON "credit_card_transactions" USING btree ("household_id","status","expected_payment_date");--> statement-breakpoint
CREATE INDEX "credit_card_transactions_household_date_idx" ON "credit_card_transactions" USING btree ("household_id","transaction_date");--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_household_user_unique" ON "household_members" USING btree ("household_id","user_id");--> statement-breakpoint
CREATE INDEX "household_members_user_idx" ON "household_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "household_members_household_user_idx" ON "household_members" USING btree ("household_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "installment_payments_plan_sequence_unique" ON "installment_payments" USING btree ("installment_plan_id","sequence_no");--> statement-breakpoint
CREATE UNIQUE INDEX "installment_payments_cash_transaction_unique" ON "installment_payments" USING btree ("cash_transaction_id");--> statement-breakpoint
CREATE INDEX "installment_payments_household_status_due_date_idx" ON "installment_payments" USING btree ("household_id","status","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "saving_deposits_deposit_cash_transaction_unique" ON "saving_deposits" USING btree ("deposit_cash_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saving_deposits_maturity_cash_transaction_unique" ON "saving_deposits" USING btree ("maturity_cash_transaction_id");--> statement-breakpoint
CREATE INDEX "saving_deposits_household_status_maturity_idx" ON "saving_deposits" USING btree ("household_id","status","maturity_date");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");