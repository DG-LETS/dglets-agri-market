/**
 * CommissionService — DG-LETS Agri Marketplace
 *
 * Section 20 & 33: Single source of truth for fee calculation.
 * Reads commission rate from DB (SystemSetting) at runtime so admin
 * can change rates without a code deployment.
 * Falls back to app.config (env var) if no DB setting found.
 *
 * Section 32 (Critical): The rate is SNAPSHOTTED at order creation.
 * Changing it later does NOT affect historical orders.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { PrismaService }      from '../prisma/prisma.service';

export interface OrderFinancials {
  currency:             string;
  subtotal:             number;  // product_subtotal = Σ(qty × unit_price)
  commissionRate:       number;  // snapshot rate e.g. 0.05
  commissionAmount:     number;  // marketplace_commission = subtotal * rate
  logisticsBaseCost:    number;  // actual logistics provider cost
  logisticsMargin:      number;  // DG-LETS coordination margin
  deliveryFee:          number;  // logisticsBaseCost + logisticsMargin (buyer sees this)
  paymentProcessingFee: number;  // gateway cost
  buyerTotal:           number;  // subtotal + deliveryFee
  sellerGross:          number;  // = subtotal (gross before commission)
  sellerNet:            number;  // = subtotal - commissionAmount
  dgLetsRevenue:        number;  // = commissionAmount + logisticsMargin
}

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly config:  ConfigService,
  ) {}

  /* ── Get the live commission rate (DB overrides env, env overrides default) ── */
  async getCommissionRate(): Promise<number> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'marketplace_commission_rate' },
      });
      if (setting) {
        return parseFloat(setting.value);
      }
    } catch {
      this.logger.warn('Could not read commission rate from SystemSetting — using config default');
    }
    return this.config.get<number>('app.marketplaceCommissionRate', 0.05);
  }

  /* ── Calculate payment processing fee per provider config ── */
  calculatePaymentFee(amount: number): number {
    const type    = this.config.get<string>('app.paymentProcessingFeeType',  'percentage');
    const pct     = this.config.get<number>('app.paymentProcessingPercentage', 0.015);
    const fixed   = this.config.get<number>('app.paymentProcessingFixedFee',   100);
    const cap     = this.config.get<number>('app.paymentProcessingCap',        2000);

    let fee = 0;
    if (type === 'percentage') {
      fee = amount * pct;
    } else if (type === 'fixed') {
      fee = fixed;
    } else if (type === 'percentage_with_cap') {
      // Paystack: 1.5% + ₦100 flat (for > ₦2,500), capped at ₦2,000
      fee = amount * pct;
      if (amount > 2500) fee += fixed;
      fee = Math.min(fee, cap);
    }

    return parseFloat(fee.toFixed(2));
  }

  /* ── Compute full order financials snapshot (Section 33) ── */
  async calculateOrderFinancials(params: {
    subtotal:          number;
    logisticsBaseCost: number;
    logisticsMargin:   number;
    currency?:         string;
  }): Promise<OrderFinancials> {
    const { subtotal, logisticsBaseCost, logisticsMargin, currency = 'NGN' } = params;

    const commissionRate   = await this.getCommissionRate();
    const commissionAmount = parseFloat((subtotal * commissionRate).toFixed(2));
    const deliveryFee      = parseFloat((logisticsBaseCost + logisticsMargin).toFixed(2));
    const buyerTotal       = parseFloat((subtotal + deliveryFee).toFixed(2));
    const sellerGross      = subtotal;
    const sellerNet        = parseFloat((subtotal - commissionAmount).toFixed(2));
    const dgLetsRevenue    = parseFloat((commissionAmount + logisticsMargin).toFixed(2));
    const paymentProcessingFee = this.calculatePaymentFee(buyerTotal);

    return {
      currency,
      subtotal,
      commissionRate,
      commissionAmount,
      logisticsBaseCost,
      logisticsMargin,
      deliveryFee,
      paymentProcessingFee,
      buyerTotal,
      sellerGross,
      sellerNet,
      dgLetsRevenue,
    };
  }

  /* ── Admin: update commission rate in DB (audit-logged) ── */
  async setCommissionRate(rate: number, adminId: string) {
    if (rate < 0 || rate > 1) throw new Error('Commission rate must be between 0 and 1 (e.g. 0.05 for 5%)');

    const setting = await this.prisma.systemSetting.upsert({
      where:  { key: 'marketplace_commission_rate' },
      create: { key: 'marketplace_commission_rate', value: String(rate), description: 'Marketplace transaction commission rate (e.g. 0.05 = 5%)', updatedBy: adminId },
      update: { value: String(rate), updatedBy: adminId },
    });

    this.logger.log(`Commission rate updated to ${rate} (${(rate * 100).toFixed(1)}%) by admin=${adminId}`);
    return setting;
  }

  /* ── Get all system settings (admin view) ── */
  getAllSettings() {
    return this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
  }
}
