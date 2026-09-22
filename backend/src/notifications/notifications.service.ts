import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService }   from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push:   PushService,
  ) {}

  /**
   * Create a DB notification AND fire a push notification.
   * Push failures are non-fatal — the DB record is always created first.
   */
  async create(
    userId: string,
    type:   string,
    title:  string,
    body:   string,
    data?:  any,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type: type as any, title, body, data },
    });

    /* Fire push — non-blocking, errors swallowed inside PushService */
    this.push.sendToUser(userId, title, body, data ?? {}).catch(() => {});

    return notification;
  }

  /** Create notification for multiple users at once (e.g. new haulage job broadcast) */
  async createBulk(
    userIds: string[],
    type:    string,
    title:   string,
    body:    string,
    data?:   any,
  ) {
    if (userIds.length === 0) return;

    await this.prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId, type: type as any, title, body, data,
      })),
      skipDuplicates: true,
    });

    await this.push.sendToUsers(userIds, title, body, data ?? {}).catch(() => {});
  }

  async getMyNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { data: items, meta: { total, unread, page, limit } };
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data:  { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data:  { readAt: new Date() },
    });
  }
}
