import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: string, title: string, body: string, data?: any) {
    return this.prisma.notification.create({
      data: { userId, type: type as any, title, body, data },
    });
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
