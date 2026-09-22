import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

/**
 * GET /health
 *
 * Liveness + readiness probe for hosting platforms (Koyeb, Railway, Render).
 * Returns 200 when the API is up and the database is reachable.
 * Returns 503 when the database ping fails — tells the platform to restart.
 *
 * @SkipThrottle — health probes run every few seconds; they must not be
 * rate-limited or they will start returning 429 and kill the service.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const start = Date.now();

    /* Ping the database */
    let dbStatus: 'ok' | 'error' = 'ok';
    let dbMessage: string | undefined;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus  = 'error';
      dbMessage = err?.message ?? 'unknown';
    }

    const latencyMs = Date.now() - start;
    const healthy   = dbStatus === 'ok';

    const payload = {
      status:    healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime:    Math.floor(process.uptime()),
      latencyMs,
      services: {
        database: { status: dbStatus, ...(dbMessage ? { error: dbMessage } : {}) },
      },
      version: process.env.npm_package_version ?? '0.1.0',
    };

    /* Return 503 if database is unreachable so the platform can restart */
    if (!healthy) {
      /* NestJS doesn't allow setting status from a plain controller without
         HttpCode decorator or res injection — throw HttpException instead */
      const { HttpException, HttpStatus } = await import('@nestjs/common');
      throw new HttpException(payload, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return payload;
  }
}
