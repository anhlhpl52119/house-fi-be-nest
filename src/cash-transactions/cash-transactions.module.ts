import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CashTransactionsController } from './cash-transactions.controller.js';
import { CashTransactionsService } from './cash-transactions.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CashTransactionsController],
  providers: [CashTransactionsService],
})
export class CashTransactionsModule {}
