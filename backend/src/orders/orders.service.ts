/**
 * OrdersService — DG-LETS Agri Marketplace
 *
 * Implements:
 *  - Section 4  (Transaction Structure fields)
 *  - Section 5  (Basic transaction example)
 *  - Section 6  (5% deducted from seller — buyer pays product + delivery only)
 *  - Section 9  (Order status lifecycle)
 *  - Section 10 (Escrow-style release: seller paid after BUYER_CONFIRMED)
 *  - Section 11 (Settlement ledger split)
 *  - Section 32 (Commission rate snapshotted at order creation)
 *  - Section 33 (MVP formula)
 */

import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService }       from '../prisma/prisma.service';
import { HaulageService }      from '../haulage/haulage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LedgerService }       from '../ledger/ledger.service';
import { CommissionService }   from '../commission/commission.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma:        PrismaService,
    private readonly haulage:       HaulageService,
    private readonly notifications: NotificationsService,
    private readonly ledger:        LedgerService,
    private readonly commission:    CommissionService,
  ) {}

  private generateOrderNumber() {
    return `DG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  /* ─────────────────────────────────────────────────────────
   * CREATE ORDER
   * Buyer pays: product subtotal + delivery fee
   * DG-LETS earns: 5% of subtotal (deducted from seller)
   * Formula (Section 33):
   *   product_subtotal = Σ(quantity × unit_price)
   *   commission       = product_subtotal × commission_rate
   *   seller_net       = product_subtotal − commission
   *   buyer_total      = product_subtotal + delivery_fee
   * ───────────────────────────────────────────────────────── */
  async createOrder(buyerId: string, data: {
    items:              { productId: string; quantity: number }[];
    deliveryAddress?:   string;
    deliveryState?:     string;
    notes?:             string;
    logisticsBaseCost?: number;
    logisticsMargin?:   number;
  }) {
    // Validate products & accumulate subtotal
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
      // MVP: all items in one order from same seller
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

    const logisticsBaseCost = data.logisticsBaseCost ?? 0;
    const logisticsMargin   = data.logisticsMargin   ?? 0;

    // Calculate complete financial snapshot — rate snapshotted NOW (Section 32)
    const financials = await this.commission.calculateOrderFinancials({
      subtotal,
      logisticsBaseCost,
      logisticsMargin,
    });

    const order = await this.prisma.order.create({
      data: {
        orderNumber:         this.generateOrderNumber(),
        buyerId,
        sellerId,
        status:              'PENDING' as any,
        paymentStatus:       'PENDING' as any,
        settlementStatus:    'PENDING_DELIVERY' as any,

        // Financial snapshot fields (Section 4 & 13)
        currency:            financials.currency,
        subtotal:            financials.subtotal,
        commissionRate:      financials.commissionRate,
        commissionAmount:    financials.commissionAmount,
        logisticsBaseCost:   financials.logisticsBaseCost,
        logisticsMargin:     financials.logisticsMargin,
        deliveryFee:         financials.deliveryFee,
        paymentProcessingFee: financials.paymentProcessingFee,
        buyerTotal:          financials.buyerTotal,
        sellerGross:         financials.sellerGross,
        sellerNet:           financials.sellerNet,
        dgLetsRevenue:       financials.dgLetsRevenue,
        refundAmount:        0,

        // Backward-compat aliases
        platformFee:         financials.commissionAmount,
        total:               financials.buyerTotal,

        deliveryAddress:     data.deliveryAddress,
        deliveryState:       data.deliveryState,
        notes:               data.notes,
        items:               { create: enrichedItems },
      },
      include: {
        items:  { include: { product: true } },
        buyer:  { select: { id: true, firstName: true, phone: true } },
      },
    });

    // Notify seller
    await this.notifications.create(
      sellerId,
      'ORDER',
      '🛒 New Order Received',
      `New order #${order.orderNumber} — ₦${financials.buyerTotal.toLocaleString()} (you receive ₦${financials.sellerNet.toLocaleString()} after 5% DG-LETS fee)`,
      { orderId: order.id, screen: 'OrderDetail' },
    ).catch(() => {});

    return {
      ...order,
      financialSummary: {
        productSubtotal:     financials.subtotal,
        commissionRate:      `${(financials.commissionRate * 100).toFixed(1)}%`,
        commissionAmount:    financials.commissionAmount,
        deliveryFee:         financials.deliveryFee,
        buyerPays:           financials.buyerTotal,
        sellerReceives:      financials.sellerNet,
        dgLetsEarns:         financials.dgLetsRevenue,
      },
    };
  }

  /* ── Get orders for buyer ── */
  getMyOrdersAsBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where:   { buyerId },
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
      where:   { sellerId },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
        buyer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ── Seller wallet/earnings dashboard (Section 15) ── */
  async getSellerEarnings(sellerId: string) {
    const wallet = await this.ledger.getSellerWallet(sellerId);

    // Per-order breakdown
    const orders = await this.prisma.order.findMany({
      where:   { sellerId, paymentStatus: 'PAID' as any },
      select:  {
        id: true, orderNumber: true, status: true, settlementStatus: true,
        subtotal: true, commissionRate: true, commissionAmount: true,
        sellerNet: true, createdAt: true, settledAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      wallet,
      orders: orders.map(o => ({
        orderId:          o.id,
        orderNumber:      o.orderNumber,
        orderStatus:      o.status,
        settlementStatus: o.settlementStatus,
        saleAmount:       o.subtotal,
        dgLetsFee:        o.commissionAmount,
        commissionRate:   `${(o.commissionRate * 100).toFixed(1)}%`,
        amountToReceive:  o.sellerNet,
        settledAt:        o.settledAt,
        createdAt:        o.createdAt,
      })),
    };
  }

  /* ── Get order by id ── */
  async findById(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where:   { id },
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
  async updateStatus(id: string, userId: string, status: string, extra?: { reason?: string }) {
    const order = await this.prisma.order.findUnique({
      where:   { id },
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
    if (status === 'SELLER_CONFIRMED') updateData.confirmedAt = new Date();
    if (status === 'CONFIRMED')        updateData.confirmedAt = new Date();
    if (status === 'COMPLETED')        updateData.completedAt = new Date();
    if (status === 'CANCELLED')        updateData.cancelledAt = new Date();
    if (status === 'CANCELLED' && extra?.reason) updateData.cancelReason = extra.reason;

    // Buyer confirms receipt → order eligible for settlement (Section 10)
    if (status === 'BUYER_CONFIRMED') {
      updateData.settlementStatus = 'ELIGIBLE_FOR_SETTLEMENT';
    }

    // Order completes → mark settled (Section 11)
    if (status === 'COMPLETED') {
      updateData.settlementStatus = 'SETTLED';
      updateData.settledAt        = new Date();
    }

    const updated = await this.prisma.order.update({ where: { id }, data: updateData });

    // Status-specific notifications
    const statusMessages: Record<string, { buyerMsg?: string; sellerMsg?: string }> = {
      SELLER_CONFIRMED: { buyerMsg: `✅ Your order #${order.orderNumber} has been confirmed by the seller.` },
      CONFIRMED:        { buyerMsg: `✅ Your order #${order.orderNumber} has been confirmed by the seller.` },
      PROCESSING:       { buyerMsg: `📦 Your order #${order.orderNumber} is being processed.` },
      READY_FOR_PICKUP: { buyerMsg: `🚛 Your order #${order.orderNumber} is ready for pickup.` },
      PICKED_UP:        { buyerMsg: `🚛 Your order #${order.orderNumber} has been picked up.` },
      IN_TRANSIT:       { buyerMsg: `🚚 Your order #${order.orderNumber} is on the way.` },
      DELIVERED:        { buyerMsg: `📍 Your order #${order.orderNumber} has been delivered. Please confirm receipt to release payment to the seller.` },
      BUYER_CONFIRMED:  {
        buyerMsg:  `✅ You confirmed receipt of order #${order.orderNumber}. Thank you!`,
        sellerMsg: `🎉 Buyer confirmed receipt of order #${order.orderNumber}. Payment is now eligible for settlement.`,
      },
      COMPLETED: {
        buyerMsg:  `🎉 Order #${order.orderNumber} completed. Thank you for using DG-LETS!`,
        sellerMsg: `💰 Order #${order.orderNumber} completed. ₦${order.sellerNet?.toLocaleString()} has been settled to your account.`,
      },
      CANCELLED: {
        buyerMsg:  `❌ Order #${order.orderNumber} has been cancelled.`,
        sellerMsg: `❌ Order #${order.orderNumber} has been cancelled.`,
      },
      DISPUTED: {
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

    // On confirm + delivery address → create HaulageJob (Section 25 logistics model)
    if ((status === 'SELLER_CONFIRMED' || status === 'CONFIRMED') && order.deliveryAddress && order.deliveryState) {
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
      }).catch(() => null);

      if (job) {
        await this.notifyHaulageProviders(job.id, order.deliveryState, cargoSummary || 'Agricultural produce').catch(() => {});
      }
    }

    return updated;
  }

  /* ── Get ledger for an order (visible to buyer, seller, admin) ── */
  async getOrderLedger(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true, sellerId: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId && order.sellerId !== userId) throw new ForbiddenException('Access denied');
    return this.ledger.getOrderLedger(orderId);
  }

  /* ── Notify haulage providers about new delivery job ── */
  private async notifyHaulageProviders(jobId: string, deliveryState: string, cargo: string) {
    const profiles = await this.prisma.haulageProfile.findMany({
      where:  { isAvailable: true, coverageStates: { has: deliveryState } },
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
