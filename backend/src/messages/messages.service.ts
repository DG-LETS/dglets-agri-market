import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /* ────────────────────────────────────────────────────
     GET or CREATE a conversation between two users.
     Optionally linked to a product and/or order.
     Idempotent — returns existing conversation if found.
  ──────────────────────────────────────────────────── */
  async getOrCreateConversation(
    initiatorId: string,
    recipientId: string,
    productId?:  string,
    orderId?:    string,
  ) {
    if (initiatorId === recipientId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    /* Look for an existing conversation between these two users
       for the same product (if provided). */
    const participants = [initiatorId, recipientId].sort(); /* sorted for deterministic match */

    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { has: initiatorId } },
          { participants: { has: recipientId } },
          productId ? { productId } : {},
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take:    1,
          include: { sender: { select: { id: true, firstName: true } } },
        },
      },
    });

    if (existing) return existing;

    /* Create new conversation */
    const conversation = await this.prisma.conversation.create({
      data: {
        participants,
        productId: productId ?? null,
        orderId:   orderId   ?? null,
      },
      include: {
        messages: true,
      },
    });

    this.logger.log(
      `Conversation created: ${initiatorId} ↔ ${recipientId}` +
      (productId ? ` [product:${productId}]` : ''),
    );

    return conversation;
  }

  /* ────────────────────────────────────────────────────
     LIST all conversations for the current user.
     Returns conversations sorted by last message time,
     with unread count and last message preview.
  ──────────────────────────────────────────────────── */
  async getMyConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { has: userId } },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take:    1,
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    /* Enrich each conversation with the other participant's profile */
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherId = conv.participants.find(p => p !== userId);
        const other   = otherId
          ? await this.prisma.user.findUnique({
              where:  { id: otherId },
              select: {
                id: true, firstName: true, lastName: true,
                profileImage: true, role: true,
                verification: { select: { identityStatus: true, phoneVerified: true } },
              },
            })
          : null;

        /* Unread count: messages sent by the other participant that haven't been read */
        const unread = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId:       { not: userId },
            readAt:         null,
          },
        });

        /* Product context */
        const product = conv.productId
          ? await this.prisma.product.findUnique({
              where:  { id: conv.productId },
              select: { id: true, name: true, images: true, price: true, priceUnit: true },
            })
          : null;

        const lastMsg = conv.messages[0] ?? null;

        return {
          id:           conv.id,
          participants: conv.participants,
          other,
          product,
          orderId:      conv.orderId,
          lastMessage:  lastMsg
            ? {
                body:      lastMsg.body,
                senderId:  lastMsg.senderId,
                senderName:lastMsg.sender?.firstName,
                createdAt: lastMsg.createdAt,
              }
            : null,
          unread,
          lastMessageAt: conv.lastMessageAt,
          createdAt:     conv.createdAt,
        };
      }),
    );

    /* Sort by lastMessageAt descending */
    return enriched.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }

  /* ────────────────────────────────────────────────────
     GET messages for a conversation (paginated).
  ──────────────────────────────────────────────────── */
  async getMessages(
    conversationId: string,
    userId: string,
    page  = 1,
    limit = 30,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where:   { conversationId },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        },
        orderBy: { createdAt: 'desc' },  /* newest first for pagination, client reverses */
        skip,
        take:    limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    /* Auto-mark incoming messages as read */
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt:   null,
      },
      data: { readAt: new Date() },
    });

    return {
      data: messages.reverse(), /* chronological order */
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /* ────────────────────────────────────────────────────
     SEND a message.
  ──────────────────────────────────────────────────── */
  async sendMessage(
    conversationId: string,
    senderId: string,
    body: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participants.includes(senderId)) {
      throw new ForbiddenException('You are not part of this conversation');
    }
    if (!body?.trim()) throw new BadRequestException('Message body cannot be empty');
    if (body.length > 2000) throw new BadRequestException('Message too long (max 2000 characters)');

    const [message] = await Promise.all([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          body: body.trim(),
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        },
      }),
      /* Update conversation lastMessageAt */
      this.prisma.conversation.update({
        where: { id: conversationId },
        data:  { lastMessageAt: new Date() },
      }),
    ]);

    this.logger.log(`Message sent in conversation ${conversationId} by ${senderId}`);
    return message;
  }

  /* ────────────────────────────────────────────────────
     GET unread message count for a user (for tab badge).
  ──────────────────────────────────────────────────── */
  async getUnreadCount(userId: string): Promise<number> {
    /* Get all conversations the user is in */
    const convIds = await this.prisma.conversation.findMany({
      where:  { participants: { has: userId } },
      select: { id: true },
    });

    if (convIds.length === 0) return 0;

    return this.prisma.message.count({
      where: {
        conversationId: { in: convIds.map(c => c.id) },
        senderId:       { not: userId },
        readAt:         null,
      },
    });
  }

  /* ────────────────────────────────────────────────────
     REPORT a user (basic — creates an audit log entry).
  ──────────────────────────────────────────────────── */
  async reportUser(
    reporterId:    string,
    reportedId:    string,
    conversationId: string,
    reason:        string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId:   reporterId,
        action:   'REPORT_USER',
        entity:   'User',
        entityId: reportedId,
        newValues: { conversationId, reason, reportedAt: new Date() },
      },
    });

    this.logger.warn(
      `User reported: reporter=${reporterId} reported=${reportedId} reason=${reason}`,
    );

    return { message: 'Report submitted. Our team will review it.' };
  }

  /* ────────────────────────────────────────────────────
     ADMIN: get conversation by ID (for dispute review).
  ──────────────────────────────────────────────────── */
  async adminGetConversation(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where:   { id: conversationId },
      include: {
        messages: {
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}
