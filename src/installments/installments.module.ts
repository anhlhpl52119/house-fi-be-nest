import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { InstallmentsController } from './installments.controller.js';
import { InstallmentsService } from './installments.service.js';

@Module({
  imports: [AuthModule],
  controllers: [InstallmentsController],
  providers: [InstallmentsService],
})
export class InstallmentsModule {}
