import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CreditCardsController } from './credit-cards.controller.js';
import { CreditCardsService } from './credit-cards.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CreditCardsController],
  providers: [CreditCardsService],
})
export class CreditCardsModule {}
