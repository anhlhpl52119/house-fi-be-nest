import { Injectable } from '@nestjs/common';
import { z } from 'zod';

export const HealthStatusSchema = z.strictObject({
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

@Injectable()
export class HealthService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
