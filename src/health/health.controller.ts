import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiZodOkResponse } from '../openapi/swagger.decorators.js';
import { HealthService, HealthStatus, HealthStatusSchema } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiZodOkResponse(HealthStatusSchema, 'Service health status.')
  getHealth(): HealthStatus {
    return this.healthService.getHealth();
  }
}
