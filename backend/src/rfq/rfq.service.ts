import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RfqService {
  constructor(private readonly prisma: PrismaService) {}

  /* ──────────────────────────────────────────────────────────
     BUYER REQUESTS (RFQs)
     Section 18 & 21: Bulk buyers post purchase requests with specs
  ────────────────────────────────────────────────────────── */
  async createRequest(buyerId: string, data: {
    cropCategory: string;
    variety?: string;
    quantity: number;
    unit: string;
    targetPrice?: number;
    destinationCity?: string;
    destinationState?: string;
    deliveryDeadline?: Date;
    description?: string;
  }) {
    return (this.prisma as any).buyerRequest.create({
      data: {
        buyerId,
        cropCategory: data.cropCategory,
        variety: data.variety,
        quantity: data.quantity,
        unit: data.unit,
        targetPrice: data.targetPrice,
        destinationCity: data.destinationCity,
        destinationState: data.destinationState,
        deliveryDeadline: data.deliveryDeadline ? new Date(data.deliveryDeadline) : undefined,
        description: data.description,
        status: 'OPEN',
      },
    });
  }

  async getRequests(query?: { cropCategory?: string; status?: string; buyerId?: string }) {
    const where: any = {};
    if (query?.cropCategory) where.cropCategory = query.cropCategory;
    if (query?.status) where.status = query.status;
    if (query?.buyerId) where.buyerId = query.buyerId;

    return (this.prisma as any).buyerRequest.findMany({
      where,
      include: {
        buyer: {
          select: { id: true, fullName: true, companyName: true, city: true, state: true },
        },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequestById(id: string) {
    const request = await (this.prisma as any).buyerRequest.findUnique({
      where: { id },
      include: {
        buyer: {
          select: { id: true, fullName: true, companyName: true, phone: true, city: true, state: true },
        },
        offers: {
          include: {
            seller: {
              select: { id: true, fullName: true, companyName: true, city: true, state: true, rating: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!request) throw new NotFoundException('Buyer request (RFQ) not found');
    return request;
  }

  async closeRequest(buyerId: string, id: string) {
    const request = await (this.prisma as any).buyerRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.buyerId !== buyerId) throw new BadRequestException('Not authorized to close this request');

    return (this.prisma as any).buyerRequest.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  /* ──────────────────────────────────────────────────────────
     SELLER OFFERS / QUOTES
     Sellers submit competitive quotes against open RFQs
  ────────────────────────────────────────────────────────── */
  async createOffer(sellerId: string, requestId: string, data: {
    offeredPrice: number;
    availableQuantity: number;
    originCity?: string;
    originState?: string;
    notes?: string;
    validUntil?: Date;
  }) {
    const request = await (this.prisma as any).buyerRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Target RFQ not found');
    if (request.status !== 'OPEN') throw new BadRequestException('This RFQ is no longer open for offers');

    return (this.prisma as any).sellerOffer.create({
      data: {
        requestId,
        sellerId,
        offeredPrice: data.offeredPrice,
        availableQuantity: data.availableQuantity,
        originCity: data.originCity,
        originState: data.originState,
        notes: data.notes,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        status: 'PENDING',
      },
    });
  }

  async getSellerOffers(sellerId: string) {
    return (this.prisma as any).sellerOffer.findMany({
      where: { sellerId },
      include: {
        request: {
          include: {
            buyer: { select: { id: true, fullName: true, companyName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptOffer(buyerId: string, offerId: string) {
    const offer = await (this.prisma as any).sellerOffer.findUnique({
      where: { id: offerId },
      include: { request: true },
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.request.buyerId !== buyerId) throw new BadRequestException('Not authorized to accept this offer');

    /* Accept this offer and mark request fulfilled */
    await (this.prisma as any).sellerOffer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED' },
    });

    return (this.prisma as any).buyerRequest.update({
      where: { id: offer.requestId },
      data: { status: 'FULFILLED' },
    });
  }
}
