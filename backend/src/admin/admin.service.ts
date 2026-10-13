import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService }        from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LedgerService }        from '../ledger/ledger.service';
import { CommissionService }    from '../commission/commission.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma:        PrismaService,
    private readonly notifications: NotificationsService,
    private readonly ledger:        LedgerService,
    private readonly commission:    CommissionService,
  ) {}

  /* ═══════════════════════════════════════════════════
     STATS — overview numbers for dashboard (Section 21)
  ═══════════════════════════════════════════════════ */
  async getStats() {
    const [
      totalUsers, activeUsers, pendingVerification,
      totalProducts, publishedProducts,
      totalOrders, completedOrders, cancelledOrders,
      activeSellers, activeBuyers,
      openDisputes,
      openHaulageJobs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'PENDING_VERIFICATION' } }),
      this.prisma.product.count({ where: { status: { not: 'DELETED' } } }),
      this.prisma.product.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.user.count({ where: { role: { in: ['FARMER', 'TRADER', 'AGGREGATOR', 'PROCESSOR', 'EXPORTER'] }, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { role: 'BUYER', status: 'ACTIVE' } }),
      this.prisma.order.count({ where: { status: 'DISPUTED' } }),
      this.prisma.haulageJob.count({ where: { status: 'OPEN' } }),
    ]);

    // Financial KPIs from ledger (Section 22)
    const financials = await this.ledger.getPlatformRevenueSummary();
    const commissionRate = await this.commission.getCommissionRate();

    return {
      users:       { total: totalUsers, active: activeUsers, pendingVerification },
      products:    { total: totalProducts, published: publishedProducts },
      orders:      { total: totalOrders, completed: completedOrders, cancelled: cancelledOrders },
      sellers:     { active: activeSellers },
      buyers:      { active: activeBuyers },
      disputes:    { open: openDisputes },
      haulageJobs: { open: openHaulageJobs },
      // Revenue metrics (Section 21)
      revenue: {
        gmv:                     financials.gmv,
        grossMarketplaceRevenue: financials.grossMarketplaceRevenue,
        logisticsRevenue:        financials.logisticsRevenue,
        paymentProcessingCosts:  financials.paymentProcessingCosts,
        refunds:                 financials.refunds,
        netPlatformRevenue:      financials.netPlatformRevenue,
        takeRate:                `${financials.takeRate}%`,
        aov:                     financials.aov,
      },
      config: {
        commissionRate:          `${(commissionRate * 100).toFixed(1)}%`,
      },
    };
  }

  /* ═══════════════════════════════════════════════════
     FINANCIAL KPIs — detailed revenue report (Section 22)
  ═══════════════════════════════════════════════════ */
  async getFinancialReport(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate   = to   ? new Date(to)   : undefined;
    return this.ledger.getPlatformRevenueSummary(fromDate, toDate);
  }

  /* ═══════════════════════════════════════════════════
     COMMISSION CONFIG — admin can change rate (Section 20)
  ═══════════════════════════════════════════════════ */
  async setCommissionRate(rate: number, adminId: string) {
    return this.commission.setCommissionRate(rate, adminId);
  }

  async getSystemSettings() {
    return this.commission.getAllSettings();
  }

  /* ═══════════════════════════════════════════════════
     USERS
  ═══════════════════════════════════════════════════ */
  async listUsers(filters: {
    role?:    string;
    status?:  string;
    search?:  string;
    page?:    number;
    limit?:   number;
  }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 30;
    const where: any = {};

    if (filters.role)   where.role   = filters.role;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName:  { contains: filters.search, mode: 'insensitive' } },
        { phone:     { contains: filters.search } },
        { email:     { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true,
          phone: true, email: true, role: true, status: true,
          createdAt: true, lastLoginAt: true, profileImage: true,
          verification: { select: { phoneVerified: true, identityStatus: true } },
          _count: { select: { products: true, ordersAsBuyer: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit } };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        verification:   true,
        farmerProfile:  true,
        buyerProfile:   true,
        haulageProfile: true,
        rewardWallet:   true,
        _count: { select: { products: true, ordersAsBuyer: true, ordersAsSeller: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async updateUserStatus(userId: string, status: string, adminId: string) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data:  { status: status as any },
      select: { id: true, firstName: true, status: true },
    });

    this.logger.log(`Admin ${adminId} set user ${userId} status → ${status}`);
    return user;
  }

  /* ═══════════════════════════════════════════════════
     VERIFIED BADGE — admin sets seller/farmer as verified
  ═══════════════════════════════════════════════════ */
  async setVerifiedBadge(userId: string, verified: boolean, adminId: string) {
    /* Update the verification record's identityStatus */
    const verification = await this.prisma.verification.upsert({
      where:  { userId },
      create: {
        userId,
        phoneVerified:  false,
        emailVerified:  false,
        identityStatus: verified ? 'VERIFIED' : 'UNVERIFIED',
      },
      update: { identityStatus: verified ? 'VERIFIED' : 'UNVERIFIED' },
    });

    this.logger.log(
      `Admin ${adminId} set verified badge → ${verified} for user ${userId}`,
    );

    /* Notify the user */
    if (verified) {
      await this.notifications.create(
        userId,
        'VERIFICATION',
        '✅ Account Verified',
        'Congratulations! Your account has been verified. A verified badge is now visible on your listings.',
        { screen: 'Profile' },
      ).catch(() => {});
    }

    return verification;
  }

  /* ═══════════════════════════════════════════════════
     PRODUCTS — approval queue
  ═══════════════════════════════════════════════════ */
  async listProducts(filters: {
    status?: string;
    search?: string;
    page?:   number;
    limit?:  number;
  }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 30;
    const where: any = {};

    if (filters.status) where.status = filters.status;
    else where.status = { not: 'DELETED' };

    if (filters.search) {
      where.OR = [
        { name:        { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          seller:   { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit } };
  }

  async approveProduct(productId: string, adminId: string) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data:  { status: 'PUBLISHED' },
      select: { id: true, name: true, sellerId: true, status: true },
    });

    await this.notifications.create(
      product.sellerId,
      'VERIFICATION',
      '✅ Listing Approved',
      `Your product "${product.name}" has been approved and is now live on the marketplace.`,
      { productId: product.id, screen: 'Market' },
    ).catch(() => {});

    this.logger.log(`Admin ${adminId} approved product ${productId}`);
    return product;
  }

  async rejectProduct(productId: string, reason: string, adminId: string) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data:  { status: 'PAUSED' },
      select: { id: true, name: true, sellerId: true, status: true },
    });

    await this.notifications.create(
      product.sellerId,
      'VERIFICATION',
      '⚠️ Listing Needs Attention',
      `Your product "${product.name}" was not approved. Reason: ${reason}`,
      { productId: product.id, screen: 'CreateListing' },
    ).catch(() => {});

    this.logger.log(`Admin ${adminId} paused product ${productId}: ${reason}`);
    return product;
  }

  /* ═══════════════════════════════════════════════════
     ORDERS
  ═══════════════════════════════════════════════════ */
  async listOrders(filters: {
    status?:  string;
    search?:  string;
    page?:    number;
    limit?:   number;
  }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 30;
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.orderNumber = { contains: filters.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer:  { select: { id: true, firstName: true, lastName: true, phone: true } },
          seller: { select: { id: true, firstName: true, lastName: true, phone: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit } };
  }

  /* ═══════════════════════════════════════════════════
     DISPUTES — orders with status DISPUTED
  ═══════════════════════════════════════════════════ */
  async listDisputes(filters: { page?: number; limit?: number }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where:   { status: 'DISPUTED' },
        include: {
          buyer:  { select: { id: true, firstName: true, lastName: true, phone: true } },
          seller: { select: { id: true, firstName: true, lastName: true, phone: true } },
          items:  { include: { product: { select: { name: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.order.count({ where: { status: 'DISPUTED' } }),
    ]);

    return { data: items, meta: { total, page, limit } };
  }

  async resolveDispute(orderId: string, resolution: 'COMPLETED' | 'REFUNDED' | 'CANCELLED', adminId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { status: resolution as any },
    });

    /* Notify both parties */
    const msg = `Dispute on order #${order.orderNumber} has been resolved. Status: ${resolution}`;
    await Promise.all([
      this.notifications.create(order.buyerId,  'ORDER', '⚖️ Dispute Resolved', msg, { orderId, screen: 'OrderDetail' }).catch(() => {}),
      this.notifications.create(order.sellerId, 'ORDER', '⚖️ Dispute Resolved', msg, { orderId, screen: 'OrderDetail' }).catch(() => {}),
    ]);

    this.logger.log(`Admin ${adminId} resolved dispute for order ${orderId} → ${resolution}`);
    return updated;
  }

  /* ═══════════════════════════════════════════════════
     FEES
  ═══════════════════════════════════════════════════ */
  async listFees(filters: {
    type?:   string;
    status?: string;
    page?:   number;
    limit?:  number;
  }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 30;
    const where: any = {};

    if (filters.type)   where.type   = filters.type;
    if (filters.status) where.status = filters.status;

    const [items, total, summary] = await Promise.all([
      this.prisma.platformFee.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.platformFee.count({ where }),
      this.prisma.platformFee.groupBy({
        by:     ['type', 'status'],
        _sum:   { amount: true },
        _count: true,
      }),
    ]);

    return { data: items, meta: { total, page, limit }, summary };
  }

  /* ═══════════════════════════════════════════════════
     LEDGER EXPORT — admin reconciliation (Section 31)
  ═══════════════════════════════════════════════════ */
  async getLedgerEntries(filters: {
    entryType?: string;
    from?:      string;
    to?:        string;
    page?:      number;
    limit?:     number;
  }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 50;
    const where: any = {};

    if (filters.entryType) where.entryType = filters.entryType;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to)   where.createdAt.lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.transactionLedger.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true } },
          user:  { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.transactionLedger.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit } };
  }
}
