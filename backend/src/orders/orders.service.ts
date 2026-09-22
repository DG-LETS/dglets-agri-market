import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService }         from '../prisma/prisma.service';
import { HaulageService }        from '../haulage/haulage.service';
import { FeesService }           from '../fees/fees.service';
import { NotificationsService }  from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma:         PrismaService,
    private readonly haulage:        HaulageService,
    private readonly fees:           FeesService,
    private readonly notifications:  NotificationsService,
  ) {}

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
      enrichedItems.push({
        productId: item.productId,
        quantity:  item.quantity,
        unitPrice: product.price,
        subtotal:  lineTotal,
      });
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
      include: {
        items: { include: { product: true } },
        buyer: { select: { id: true, firstName: true, phone: true } },
      },
    });

    /* Notify seller about new order */
    await this.notifications.create(
      sellerId,
      'ORDER',
      '🛒 New Order Received',
      `You have a new order #${order.orderNumber} — ₦${total.toLocaleString()}`,
      { orderId: order.id, screen: 'OrderDetail' },
    ).catch(() => {});

    return order;
  }

  /* ── Get orders for buyer ── */
  getMyOrdersAsBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: {
        items:  { include: { product: { select: { id: true, name: true, images: true } } } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ── Get orders for seller ── */
  getMyOrdersAsSeller(sellerId: string) {
    return this.prisma.order.findMany({
      where: { sellerId },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
        buyer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ── Get order by id ── */
  async findById(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items:   { include: { product: true } },
        buyer:   { select: { id: true, firstName: true, lastName: true, phone: true } },
        seller:  { select: { id: true, firstName: true, lastName: true, phone: true } },
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  /* ── Update order status ── */
  async updateStatus(id: string, userId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        seller: { select: { farmerProfile: true, firstName: true } },
        buyer:  { select: { firstName: true } },
        items:  { include: { product: { select: { name: true, quantityUnit: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== userId && order.buyerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = { status };
    if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();

    const updated = await this.prisma.order.update({ where: { id }, data: updateData });

    /* ── Notifications per status transition ── */
    const statusMessages: Record<string, { buyerMsg?: string; sellerMsg?: string }> = {
      CONFIRMED:        { buyerMsg:  `✅ Your order #${order.orderNumber} has been confirmed by the seller.` },
      PROCESSING:       { buyerMsg:  `📦 Your order #${order.orderNumber} is being processed.` },
      READY_FOR_PICKUP: { buyerMsg:  `🚛 Your order #${order.orderNumber} is ready for pickup.` },
      PICKED_UP:        { buyerMsg:  `🚛 Your order #${order.orderNumber} has been picked up.` },
      IN_TRANSIT:       { buyerMsg:  `🚚 Your order #${order.orderNumber} is on the way.` },
      DELIVERED:        { buyerMsg:  `📍 Your order #${order.orderNumber} has been delivered. Please confirm receipt.` },
      COMPLETED:        {
        buyerMsg:  `🎉 Order #${order.orderNumber} completed. Thank you for using DG-LETS!`,
        sellerMsg: `💰 Order #${order.orderNumber} completed. Payment will be processed.`,
      },
      CANCELLED:        {
        buyerMsg:  `❌ Order #${order.orderNumber} has been cancelled.`,
        sellerMsg: `❌ Order #${order.orderNumber} has been cancelled.`,
      },
      DISPUTED:         {
        buyerMsg:  `⚠️ A dispute has been raised on order #${order.orderNumber}. Our team will review it.`,
        sellerMsg: `⚠️ A dispute has been raised on order #${order.orderNumber}. Our team will review it.`,
      },
    };

    const msgs = statusMessages[status];
    if (msgs) {
      const notifData = { orderId: order.id, screen: 'OrderDetail' };
      if (msgs.buyerMsg)  await this.notifications.create(order.buyerId,  'ORDER', 'Order Update', msgs.buyerMsg,  notifData).catch(() => {});
      if (msgs.sellerMsg) await this.notifications.create(order.sellerId, 'ORDER', 'Order Update', msgs.sellerMsg, notifData).catch(() => {});
    }

    /* ── When seller confirms + delivery address set → create HaulageJob ── */
    if (status === 'CONFIRMED' && order.deliveryAddress && order.deliveryState) {
      const sellerProfile = order.seller?.farmerProfile;
      const cargoSummary  = order.items.map(i => i.product?.name).filter(Boolean).join(', ');
      const totalWeight   = order.items.reduce((s, i) => s + i.quantity, 0);

      const job = await this.haulage.createJobFromOrder(id, {
        sellerId:      order.sellerId,
        sellerState:   sellerProfile?.state,
        sellerLga:     sellerProfile?.lga ?? undefined,
        deliveryState: order.deliveryState,
        deliveryAddr:  order.deliveryAddress,
        deliveryFee:   order.deliveryFee,
        cargoSummary:  cargoSummary || 'Agricultural produce',
        totalWeight,
      });

      /* Broadcast new haulage job to all active haulage providers */
      if (job) {
        await this.notifyHaulageProviders(
          job.id,
          order.deliveryState,
          cargoSummary || 'Agricultural produce',
        ).catch(() => {});
      }
    }

    /* ── Record transaction fee when order completes ── */
    if (status === 'COMPLETED' && order.platformFee > 0) {
      await this.fees.recordTransactionFee(order.sellerId, id, order.platformFee);
    }

    return updated;
  }

  /* ── Notify haulage providers about a new job ── */
  private async notifyHaulageProviders(jobId: string, deliveryState: string, cargo: string) {
    /* Find haulage providers who cover this delivery state */
    const profiles = await this.prisma.haulageProfile.findMany({
      where: {
        isAvailable: true,
        coverageStates: { has: deliveryState },
      },
      select: { userId: true },
    });

    const userIds = profiles.map(p => p.userId);
    if (userIds.length === 0) return;

    await this.notifications.createBulk(
      userIds,
      'DELIVERY',
      '🚛 New Delivery Job',
      `New delivery job available: ${cargo.slice(0, 60)} → ${deliveryState}`,
      { jobId, screen: 'HaulageJobs' },
    );
  }
}
