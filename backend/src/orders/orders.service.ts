import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOrderNumber() {
    return `DG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  /* ── Create order ── */
  async createOrder(buyerId: string, data: {
    items: { productId: string; quantity: number }[];
    deliveryAddress?: string;
    deliveryState?: string;
    notes?: string;
  }) {
    /* Validate all products exist and have stock */
    let subtotal = 0;
    const enrichedItems: any[] = [];
    let sellerId = '';

    for (const item of data.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status !== 'PUBLISHED') {
        throw new BadRequestException(`Product ${item.productId} is not available`);
      }
      if (product.quantity < item.quantity) {
        throw new BadRequestException(`Insufficient quantity for ${product.name}`);
      }
      /* All items in one order must be from same seller (MVP constraint) */
      if (!sellerId) sellerId = product.sellerId;
      if (product.sellerId !== sellerId) {
        throw new BadRequestException('All items in one order must be from the same seller');
      }
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      enrichedItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: product.price, subtotal: lineTotal });
    }

    /* Calculate platform fee (2.05% default) */
    const platformFeeRate = 0.0205;
    const platformFee = parseFloat((subtotal * platformFeeRate).toFixed(2));
    const total = subtotal + platformFee;

    const order = await this.prisma.order.create({
      data: {
        orderNumber:     this.generateOrderNumber(),
        buyerId,
        sellerId,
        subtotal,
        platformFee,
        deliveryFee:     0,
        total,
        deliveryAddress: data.deliveryAddress,
        deliveryState:   data.deliveryState,
        notes:           data.notes,
        items:           { create: enrichedItems },
      },
      include: { items: { include: { product: true } }, buyer: { select: { id: true, firstName: true, phone: true } } },
    });

    return order;
  }

  /* ── Get orders for buyer ── */
  getMyOrdersAsBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where:   { buyerId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true } } } }, seller: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ── Get orders for seller ── */
  getMyOrdersAsSeller(sellerId: string) {
    return this.prisma.order.findMany({
      where:   { sellerId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true } } } }, buyer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ── Get order by id ── */
  async findById(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where:   { id },
      include: { items: { include: { product: true } }, buyer: { select: { id: true, firstName: true, lastName: true, phone: true } }, seller: { select: { id: true, firstName: true, lastName: true, phone: true } }, payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId && order.sellerId !== userId) throw new ForbiddenException('Access denied');
    return order;
  }

  /* ── Update order status ── */
  async updateStatus(id: string, userId: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== userId && order.buyerId !== userId) throw new ForbiddenException('Access denied');

    const data: any = { status };
    if (status === 'CONFIRMED')  data.confirmedAt  = new Date();
    if (status === 'COMPLETED')  data.completedAt  = new Date();
    if (status === 'CANCELLED')  data.cancelledAt  = new Date();

    return this.prisma.order.update({ where: { id }, data });
  }
}
