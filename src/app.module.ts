import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module.js';
import { CashTransactionsModule } from './cash-transactions/cash-transactions.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { HouseholdsModule } from './households/households.module.js';

@Module({
  imports: [ConfigModule, DatabaseModule, HealthModule, AuthModule, HouseholdsModule, CategoriesModule, CashTransactionsModule],
})
export class AppModule {}
