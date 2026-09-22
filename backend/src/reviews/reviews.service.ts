import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ────────────────────────────────────────────────────────
     Submit a review.
     Two review types:
       • Order review  — orderId required, subjectId = seller/buyer userId
       • Haulage review — haulageJobId required, subjectId = haulage provider userId
     One review per (authorId + orderId/jobId) — enforced below.
  ──────────────────────────────────────────────────────── */
  async create(authorId: string, data: {
    orderId?:      string;
    haulageJobId?: string;
    subjectId:     string;
    productId?:    string;
    rating:        number;
    comment?:      string;
    tags?:         string[];
  }) {
    if (!data.orderId && !data.haulageJobId) {
      throw new BadRequestException('Either orderId or haulageJobId is required');
    }
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    if (authorId === data.subjectId) {
      throw new BadRequestException('Cannot review yourself');
    }

    /* ── Order review path ── */
    if (data.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.buyerId !== authorId && order.sellerId !== authorId) {
        throw new ForbiddenException('You are not part of this order');
      }
      if (order.status !== 'COMPLETED') {
        throw new BadRequestException('Order must be completed before leaving a review');
      }

      /* Idempotent — one review per author per order */
      const existing = await this.prisma.review.findFirst({
        where: { orderId: data.orderId, authorId },
      });
      if (existing) throw new BadRequestException('You have already reviewed this order');

      const review = await this.prisma.review.create({
        data: {
          orderId:   data.orderId,
          authorId,
          subjectId: data.subjectId,
          productId: data.productId ?? null,
          rating:    data.rating,
          comment:   data.comment?.trim() ?? null,
        },
      });

      /* Update seller average rating in haulage profile (if subject is haulage) */
      await this.recalcUserRating(data.subjectId);
      return review;
    }

    /* ── Haulage job review path ── */
    const job = await this.prisma.haulageJob.findUnique({
      where: { id: data.haulageJobId! },
      include: { order: { select: { buyerId: true, sellerId: true, id: true, orderNumber: true } } },
    });
    if (!job) throw new NotFoundException('Haulage job not found');

    /* Only the buyer or seller of the linked order can review the haulage provider */
    const authorIsParty =
      job.order?.buyerId === authorId || job.order?.sellerId === authorId;
    if (!authorIsParty) {
      throw new ForbiddenException('Only the buyer or seller of this order can rate the haulage provider');
    }
    if (job.status !== 'DELIVERED') {
      throw new BadRequestException('Job must be delivered before rating');
    }

    /* Idempotent */
    const existing = await this.prisma.review.findFirst({
      where: { orderId: job.order!.id, authorId, subjectId: data.subjectId },
    });
    if (existing) throw new BadRequestException('You have already rated this delivery');

    const review = await this.prisma.review.create({
      data: {
        orderId:   job.order!.id,
        authorId,
        subjectId: data.subjectId,   /* haulage provider userId */
        rating:    data.rating,
        comment:   data.comment?.trim() ?? null,
      },
    });

    /* Recalculate average rating for the haulage profile */
    await this.recalcHaulageRating(data.subjectId);
    return review;
  }

  /* ────────────────────────────────────────────────────────
     Get reviews for a subject (seller / haulage provider)
  ──────────────────────────────────────────────────────── */
  async getForSubject(subjectId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total, avg] = await Promise.all([
      this.prisma.review.findMany({
        where:   { subjectId },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.review.count({ where: { subjectId } }),
      this.prisma.review.aggregate({
        where: { subjectId },
        _avg:  { rating: true },
        _count: true,
      }),
    ]);
    return {
      data: items,
      meta: {
        total, page, limit,
        averageRating: avg._avg.rating ? parseFloat(avg._avg.rating.toFixed(1)) : null,
        ratingCount:   avg._count,
      },
    };
  }

  /* ────────────────────────────────────────────────────────
     Check if current user has already reviewed an order
  ──────────────────────────────────────────────────────── */
  async hasReviewed(authorId: string, orderId: string) {
    const review = await this.prisma.review.findFirst({
      where: { authorId, orderId },
    });
    return { hasReviewed: !!review, review: review ?? null };
  }

  /* ────────────────────────────────────────────────────────
     PRIVATE: recalculate and store average rating for any user
  ──────────────────────────────────────────────────────── */
  private async recalcUserRating(userId: string) {
    const avg = await this.prisma.review.aggregate({
      where: { subjectId: userId },
      _avg:  { rating: true },
      _count: true,
    });
    /* Store on haulage profile if it exists */
    await this.prisma.haulageProfile.updateMany({
      where: { userId },
      data: {
        rating:    avg._avg.rating ?? 0,
        totalJobs: avg._count,
      },
    });
  }

  private async recalcHaulageRating(userId: string) {
    return this.recalcUserRating(userId);
  }
}
