import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PushService
 *
 * Wraps the Expo Push Notifications API.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * - Fetches recipient's push token from the DB
 * - Batches payloads to the Expo endpoint (max 100 per request)
 * - Handles TicketError / DeviceNotRegistered gracefully by clearing stale tokens
 */

interface PushPayload {
  to:    string;
  title: string;
  body:  string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string; // Android channel
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /* ─────────────────────────────────────────────────────────
     PUBLIC: send a push to a single user by their userId.
     Silently no-ops when push token is absent or invalid.
  ───────────────────────────────────────────────────────── */
  async sendToUser(
    userId: string,
    title:  string,
    body:   string,
    data?:  Record<string, any>,
  ) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { pushToken: true },
    });

    if (!user?.pushToken) return; /* no token registered */

    await this.sendBatch([{
      to:        user.pushToken,
      title,
      body,
      data:      data ?? {},
      sound:     'default',
      channelId: 'default',
    }]);
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC: send to multiple users at once (e.g. haulage providers)
  ───────────────────────────────────────────────────────── */
  async sendToUsers(
    userIds: string[],
    title:   string,
    body:    string,
    data?:   Record<string, any>,
  ) {
    if (userIds.length === 0) return;

    const users = await this.prisma.user.findMany({
      where:  { id: { in: userIds }, pushToken: { not: null } },
      select: { id: true, pushToken: true },
    });

    const payloads: PushPayload[] = users
      .filter(u => u.pushToken)
      .map(u => ({
        to:        u.pushToken!,
        title,
        body,
        data:      data ?? {},
        sound:     'default' as const,
        channelId: 'default',
      }));

    await this.sendBatch(payloads);
  }

  /* ─────────────────────────────────────────────────────────
     PRIVATE: batch send to Expo (100 per chunk)
  ───────────────────────────────────────────────────────── */
  private async sendBatch(payloads: PushPayload[]) {
    if (payloads.length === 0) return;

    /* Chunk into groups of 100 */
    const chunks: PushPayload[][] = [];
    for (let i = 0; i < payloads.length; i += 100) {
      chunks.push(payloads.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Accept':        'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(chunk),
        });

        if (!res.ok) {
          this.logger.warn(`Expo push HTTP ${res.status}: ${await res.text()}`);
          return;
        }

        const result = await res.json() as { data: Array<{ status: string; id?: string; message?: string; details?: any }> };

        /* Check for DeviceNotRegistered tickets and clear stale tokens */
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          if (ticket.status === 'error') {
            const details = ticket.details as any;
            if (details?.error === 'DeviceNotRegistered') {
              const token = chunk[i]?.to;
              if (token) await this.clearStaleToken(token);
            } else {
              this.logger.warn(`Push ticket error: ${ticket.message}`);
            }
          }
        }
      } catch (err: any) {
        /* Non-fatal — log and continue. Push failures must never break app flow. */
        this.logger.warn(`Expo push batch failed: ${err?.message}`);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────
     Clear stale/invalid token from the DB
  ───────────────────────────────────────────────────────── */
  private async clearStaleToken(token: string) {
    try {
      await this.prisma.user.updateMany({
        where: { pushToken: token },
        data:  { pushToken: null },
      });
      this.logger.log(`Cleared stale push token: ${token.slice(0, 20)}…`);
    } catch { /* ignore */ }
  }
}
