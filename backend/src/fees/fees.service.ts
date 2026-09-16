import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly config:  ConfigService,
  ) {}

  /* ──────────────────────────────────────────────────────────
     REGISTRATION FEE
     Called after OTP verify for roles that have a fee > 0.
     Creates a PlatformFee record with status PENDING.
     The mobile app then calls initRegistrationPayment() to
     get a Paystack link and the webhook marks it PAID.
  ────────────────────────────────────────────────────────── */
  async createRegistrationFee(userId: string, role: string) {
    const fees: Record<string, number> =
      this.config.get('app.registrationFees') ?? {};
    const amount = fees[role] ?? 0;

    if (amount === 0) return null; /* Free role — no fee needed */

    /* Idempotent — don't double-charge */
    const existing = await this.prisma.platformFee.findFirst({
      where: { userId, type: 'REGISTRATION' },
    });
    if (existing) return existing;

    return this.prisma.platformFee.create({
      data: {
        userId,
        type:        'REGISTRATION',
        amount,
        description: `One-time registration fee for ${role} account`,
        referenceId: 'registration',
        status:      'PENDING',
      },
    });
  }

  /* ──────────────────────────────────────────────────────────
     INIT REGISTRATION PAYMENT (Paystack)
     Returns a Paystack checkout URL for the pending fee.
  ────────────────────────────────────────────────────────── */
  async initRegistrationPayment(userId: string) {
    const fee = await this.prisma.platformFee.findFirst({
      where:   { userId, type: 'REGISTRATION', status: 'PENDING' },
      include: { user: { select: { email: true, phone: true, firstName: true } } },
    });

    if (!fee) throw new BadRequestException('No pending registration fee found');

    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY', '');
    const reference = `DGREG-${userId.replace(/-/g,'').substring(0,8).toUpperCase()}-${Date.now()}`;

    if (!secretKey || secretKey.includes('REPLACE')) {
      /* Dev / mock mode */
      await this.prisma.platformFee.update({
        where: { id: fee.id },
        data:  { paystackRef: reference },
      });
      return {
        mock: true,
        authorization_url: `https://checkout.paystack.com/mock/reg/${fee.id}`,
        reference,
        amount: fee.amount,
      };
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:  fee.user?.email ?? `${userId}@dglets.app`,
        amount: Math.round(fee.amount * 100), /* kobo */
        reference,
        metadata: { feeId: fee.id, userId, type: 'REGISTRATION' },
        callback_url: this.config.get<string>('PAYSTACK_CALLBACK_URL', ''),
      }),
    });

    const result = await response.json() as any;
    if (!result.status) throw new BadRequestException(result.message ?? 'Paystack error');

    await this.prisma.platformFee.update({
      where: { id: fee.id },
      data:  { paystackRef: reference },
    });

    return { ...result.data, amount: fee.amount };
  }

  /* ──────────────────────────────────────────────────────────
     MARK REGISTRATION FEE PAID
     Called by Paystack webhook or manual verify.
  ────────────────────────────────────────────────────────── */
  async markRegistrationFeePaid(paystackRef: string) {
    const fee = await this.prisma.platformFee.findFirst({
      where: { paystackRef },
    });
    if (!fee) {
      this.logger.warn(`No PlatformFee found for ref: ${paystackRef}`);
      return;
    }
    if (fee.status === 'PAID') return; /* Already paid — idempotent */

    await this.prisma.platformFee.update({
      where: { id: fee.id },
      data:  { status: 'PAID', paidAt: new Date() },
    });

    this.logger.log(`Registration fee paid: userId=${fee.userId} ref=${paystackRef}`);
  }

  /* ──────────────────────────────────────────────────────────
     CHECK REGISTRATION FEE STATUS
     Returns { required, paid, amount, feeId }
  ────────────────────────────────────────────────────────── */
  async getRegistrationFeeStatus(userId: string, role: string) {
    const fees: Record<string, number> =
      this.config.get('app.registrationFees') ?? {};
    const amount = fees[role] ?? 0;

    if (amount === 0) return { required: false, paid: true, amount: 0, feeId: null };

    const fee = await this.prisma.platformFee.findFirst({
      where:   { userId, type: 'REGISTRATION' },
      orderBy: { createdAt: 'desc' },
    });

    if (!fee) return { required: true, paid: false, amount, feeId: null };
    return {
      required: true,
      paid:     fee.status === 'PAID',
      amount:   fee.amount,
      feeId:    fee.id,
    };
  }

  /* ──────────────────────────────────────────────────────────
     HAULAGE COMMISSION
     Called when a HaulageJob is marked DELIVERED.
     Deducts platform commission from the agreed delivery fee.
  ────────────────────────────────────────────────────────── */
  async chargeHaulageCommission(jobId: string, haulageUserId: string, deliveryFee: number) {
    const rate       = this.config.get<number>('app.haulageCommissionRate', 0.05);
    const commission = parseFloat((deliveryFee * rate).toFixed(2));

    /* Idempotent */
    const existing = await this.prisma.platformFee.findFirst({
      where: { userId: haulageUserId, type: 'HAULAGE_COMMISSION', referenceId: jobId },
    });
    if (existing) return existing;

    const fee = await this.prisma.platformFee.create({
      data: {
        userId:      haulageUserId,
        type:        'HAULAGE_COMMISSION',
        amount:      commission,
        status:      'PAID', /* deducted automatically — no separate payment needed */
        referenceId: jobId,
        description: `Platform commission (${(rate * 100).toFixed(0)}%) on delivery fee ₦${deliveryFee.toLocaleString()}`,
        paidAt:      new Date(),
      },
    });

    this.logger.log(
      `Haulage commission charged: jobId=${jobId} amount=₦${commission} user=${haulageUserId}`,
    );
    return fee;
  }

  /* ──────────────────────────────────────────────────────────
     TRANSACTION FEE (record-keeping)
     Creates a PAID record when an order fee is collected.
  ────────────────────────────────────────────────────────── */
  async recordTransactionFee(userId: string, orderId: string, feeAmount: number) {
    const existing = await this.prisma.platformFee.findFirst({
      where: { userId, type: 'TRANSACTION', referenceId: orderId },
    });
    if (existing) return existing;

    return this.prisma.platformFee.create({
      data: {
        userId,
        type:        'TRANSACTION',
        amount:      feeAmount,
        status:      'PAID',
        referenceId: orderId,
        description: `Platform transaction fee for order ${orderId}`,
        paidAt:      new Date(),
      },
    });
  }

  /* ──────────────────────────────────────────────────────────
     ADMIN: List all fees
  ────────────────────────────────────────────────────────── */
  async listFees(filters: {
    type?:   string;
    status?: string;
    userId?: string;
    page?:   number;
    limit?:  number;
  }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 50;
    const where: any = {};
    if (filters.type)   where.type   = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;

    const [items, total] = await Promise.all([
      this.prisma.platformFee.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, phone: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.platformFee.count({ where }),
    ]);

    const summary = await this.prisma.platformFee.groupBy({
      by:    ['type', 'status'],
      _sum:  { amount: true },
      _count: true,
    });

    return { data: items, meta: { total, page, limit }, summary };
  }
}
