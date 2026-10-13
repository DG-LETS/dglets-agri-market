/**
 * LedgerService — DG-LETS Agri Marketplace
 *
 * Implements Section 14 (Transaction Ledger) of the MVP Revenue Spec.
 * Every financial movement (payment, commission, seller proceeds, logistics,
 * refund) creates an immutable ledger entry.
 * Refunds create REVERSAL entries with negative amounts — original records
 * are NEVER deleted (immutable audit trail).
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LedgerEntryInput {
  orderId:     string;
  userId?:     string;
  userRole?:   string;
  entryType:   'BUYER_PAYMENT' | 'MARKETPLACE_COMMISSION' | 'PAYMENT_PROCESSING_FEE' | 'SELLER_PROCEEDS' | 'LOGISTICS_PAYMENT' | 'LOGISTICS_MARGIN' | 'REFUND' | 'CHARGEBACK' | 'ADJUSTMENT';
  amount:      number;       // positive = inflow/credit, negative = outflow/reversal
  currency?:   string;
  reference?:  string;
  description?: string;
  metadata?:   Record<string, any>;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /* ── Write a single ledger entry ── */
  async record(entry: LedgerEntryInput) {
    const result = await this.prisma.transactionLedger.create({
      data: {
        orderId:     entry.orderId,
        userId:      entry.userId,
        userRole:    entry.userRole,
        entryType:   entry.entryType,
        amount:      entry.amount,
        currency:    entry.currency ?? 'NGN',
        status:      'SETTLED',
        reference:   entry.reference,
        description: entry.description,
        metadata:    entry.metadata ?? {},
      },
    });
    this.logger.log(`Ledger: [${entry.entryType}] ₦${entry.amount} | order=${entry.orderId}`);
    return result;
  }

  /* ── Record all entries for a successful payment (Section 12 example) ──
   *
   *  For a ₦1,000,000 product + ₦100,000 delivery order:
   *    BUYER_PAYMENT          +1,100,000  (what buyer paid)
   *    MARKETPLACE_COMMISSION    +50,000  (DG-LETS 5%)
   *    SELLER_PROCEEDS          +950,000  (seller net)
   *    LOGISTICS_PAYMENT         +90,000  (provider quote)
   *    LOGISTICS_MARGIN          +10,000  (DG-LETS margin)
   *
   *  Sum seller + commission + logistics provider + logistics margin = buyer total ✓
   */
  async recordOrderPayment(params: {
    orderId:              string;
    buyerId:              string;
    sellerId:             string;
    currency:             string;
    buyerTotal:           number;
    commissionAmount:     number;
    sellerNet:            number;
    logisticsBaseCost:    number;
    logisticsMargin:      number;
    paymentProcessingFee: number;
    paymentReference?:    string;
  }) {
    const {
      orderId, buyerId, sellerId, currency = 'NGN',
      buyerTotal, commissionAmount, sellerNet,
      logisticsBaseCost, logisticsMargin, paymentProcessingFee,
      paymentReference,
    } = params;

    const entries: LedgerEntryInput[] = [
      {
        orderId, userId: buyerId, userRole: 'BUYER',
        entryType: 'BUYER_PAYMENT',
        amount:     buyerTotal,
        currency,   reference: paymentReference,
        description: 'Buyer payment captured by DG-LETS payment service',
      },
      {
        orderId, userId: undefined, userRole: 'PLATFORM',
        entryType: 'MARKETPLACE_COMMISSION',
        amount:     commissionAmount,
        currency,
        description: `DG-LETS 5% marketplace commission on product subtotal`,
      },
      {
        orderId, userId: sellerId, userRole: 'SELLER',
        entryType: 'SELLER_PROCEEDS',
        amount:     sellerNet,
        currency,
        description: 'Seller net proceeds (product subtotal minus commission) — held pending buyer confirmation',
      },
    ];

    if (logisticsBaseCost > 0) {
      entries.push({
        orderId, userRole: 'LOGISTICS',
        entryType: 'LOGISTICS_PAYMENT',
        amount:     logisticsBaseCost,
        currency,
        description: 'Logistics provider cost',
      });
    }

    if (logisticsMargin > 0) {
      entries.push({
        orderId, userRole: 'PLATFORM',
        entryType: 'LOGISTICS_MARGIN',
        amount:     logisticsMargin,
        currency,
        description: 'DG-LETS logistics coordination margin (kept separate from marketplace commission)',
      });
    }

    if (paymentProcessingFee > 0) {
      entries.push({
        orderId, userRole: 'PLATFORM',
        entryType: 'PAYMENT_PROCESSING_FEE',
        amount:     -paymentProcessingFee,   // cost to the platform (negative)
        currency,
        description: 'Payment gateway processing fee (deducted from platform revenue)',
      });
    }

    // Write all in a transaction
    const created = await this.prisma.$transaction(
      entries.map(e =>
        this.prisma.transactionLedger.create({
          data: {
            orderId:     e.orderId,
            userId:      e.userId,
            userRole:    e.userRole,
            entryType:   e.entryType,
            amount:      e.amount,
            currency:    e.currency ?? 'NGN',
            status:      'SETTLED',
            reference:   e.reference,
            description: e.description,
          },
        }),
      ),
    );

    this.logger.log(`Ledger: recorded ${created.length} entries for order=${orderId}`);
    return created;
  }

  /* ── Reverse all entries for an order (refund/cancellation) (Section 23) ──
   * Creates negative mirror entries. Original records are preserved.
   */
  async recordReversal(orderId: string, reason: string, reference?: string) {
    const originals = await this.prisma.transactionLedger.findMany({
      where: { orderId, status: 'SETTLED' },
    });

    if (originals.length === 0) {
      this.logger.warn(`Ledger reversal: no settled entries found for order=${orderId}`);
      return [];
    }

    const reversals = await this.prisma.$transaction(
      originals.map(entry =>
        this.prisma.transactionLedger.create({
          data: {
            orderId:     entry.orderId,
            userId:      entry.userId,
            userRole:    entry.userRole,
            entryType:   entry.entryType === 'BUYER_PAYMENT' ? 'REFUND' : entry.entryType,
            amount:      -entry.amount,        // reversal = negative of original
            currency:    entry.currency,
            status:      'REVERSED',
            reference,
            description: `Reversal: ${reason}`,
            metadata:    { reversalOf: entry.id },
          },
        }),
      ),
    );

    // Also mark the originals as reversed
    await this.prisma.transactionLedger.updateMany({
      where: { orderId, status: 'SETTLED' },
      data:  { status: 'REVERSED' },
    });

    this.logger.log(`Ledger: reversed ${reversals.length} entries for order=${orderId} — reason: ${reason}`);
    return reversals;
  }

  /* ── Seller wallet summary for Dashboard (Section 15) ── */
  async getSellerWallet(sellerId: string) {
    const entries = await this.prisma.transactionLedger.findMany({
      where:   { userId: sellerId, entryType: 'SELLER_PROCEEDS' },
      include: { order: { select: { id: true, orderNumber: true, settlementStatus: true, status: true } } },
    });

    const totalSales        = entries.filter(e => e.status === 'SETTLED').reduce((s, e) => s + e.amount, 0);
    const pendingSettlement = entries
      .filter(e => e.status === 'SETTLED' && e.order?.settlementStatus === 'ELIGIBLE_FOR_SETTLEMENT')
      .reduce((s, e) => s + e.amount, 0);
    const settled           = entries
      .filter(e => e.status === 'SETTLED' && e.order?.settlementStatus === 'SETTLED')
      .reduce((s, e) => s + e.amount, 0);

    // Commission paid = total sales * commission rate (read from entries on order)
    const commEntries = await this.prisma.transactionLedger.findMany({
      where: { orderId: { in: entries.map(e => e.orderId).filter(Boolean) as string[] }, entryType: 'MARKETPLACE_COMMISSION' },
    });
    const totalFees = commEntries.reduce((s, e) => s + Math.abs(e.amount), 0);

    return {
      totalSales,
      dgLetsFees:          totalFees,
      pendingSettlement,
      availableForWithdrawal: settled,
    };
  }

  /* ── Admin financial KPIs (Section 21 & 22) ── */
  async getPlatformRevenueSummary(from?: Date, to?: Date) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = from;
    if (to)   dateFilter.lte = to;
    const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [gmvResult, commissionResult, logisticsMarginResult, paymentFeeResult, refundResult, orderCount, completedOrderCount] =
      await Promise.all([
        this.prisma.transactionLedger.aggregate({ where: { ...where, entryType: 'BUYER_PAYMENT',          status: 'SETTLED' }, _sum: { amount: true } }),
        this.prisma.transactionLedger.aggregate({ where: { ...where, entryType: 'MARKETPLACE_COMMISSION',  status: 'SETTLED' }, _sum: { amount: true } }),
        this.prisma.transactionLedger.aggregate({ where: { ...where, entryType: 'LOGISTICS_MARGIN',        status: 'SETTLED' }, _sum: { amount: true } }),
        this.prisma.transactionLedger.aggregate({ where: { ...where, entryType: 'PAYMENT_PROCESSING_FEE' },                    _sum: { amount: true } }),
        this.prisma.transactionLedger.aggregate({ where: { ...where, entryType: 'REFUND',                  status: 'REVERSED' }, _sum: { amount: true } }),
        this.prisma.order.count({ where: { status: { in: ['COMPLETED', 'PAID', 'DELIVERED', 'BUYER_CONFIRMED'] as any } } }),
        this.prisma.order.count({ where: { status: 'COMPLETED' as any } }),
      ]);

    const gmv              = gmvResult._sum.amount             ?? 0;
    const commission       = commissionResult._sum.amount      ?? 0;
    const logisticsMargin  = logisticsMarginResult._sum.amount ?? 0;
    const paymentFees      = Math.abs(paymentFeeResult._sum.amount ?? 0);
    const refunds          = Math.abs(refundResult._sum.amount ?? 0);
    const netPlatformRevenue = commission + logisticsMargin - paymentFees - refunds;
    const takeRate         = gmv > 0 ? commission / gmv : 0;
    const aov              = completedOrderCount > 0 ? gmv / completedOrderCount : 0;

    return {
      gmv,
      grossMarketplaceRevenue: commission,
      logisticsRevenue:        logisticsMargin,
      paymentProcessingCosts:  -paymentFees,
      refunds:                 -refunds,
      netPlatformRevenue,
      takeRate:                parseFloat((takeRate * 100).toFixed(2)),  // %
      aov,
      totalOrders:             orderCount,
      completedOrders:         completedOrderCount,
    };
  }

  /* ── Get ledger entries for an order ── */
  getOrderLedger(orderId: string) {
    return this.prisma.transactionLedger.findMany({
      where:   { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
