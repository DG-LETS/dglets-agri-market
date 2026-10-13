/**
 * PaymentsService — DG-LETS Agri Marketplace
 *
 * Implements:
 *  - Section 8  (Payment Architecture — server-side verification only)
 *  - Section 29 (Security — never trust frontend payment status)
 *  - Section 29 (Idempotency — duplicate webhooks cannot create duplicate entries)
 *  - Section 30 (Recommended payment states)
 *  - Section 14 (Ledger entries written on successful payment)
 */

import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { ConfigService }        from '@nestjs/config';
import { PrismaService }        from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LedgerService }        from '../ledger/ledger.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma:         PrismaService,
    private readonly config:         ConfigService,
    private readonly notifications:  NotificationsService,
    private readonly ledger:         LedgerService,
  ) {}

  /* ── Initialise a Paystack payment for an order ── */
  async initializePaystack(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where:   { id: orderId },
      include: { buyer: { select: { email: true, phone: true } } },
    });

    if (!order)               throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new BadRequestException('Access denied');
    if (order.paymentStatus === 'PAID' as any) throw new BadRequestException('Order already paid');

    // Use buyerTotal (spec Section 16 — buyer sees product + delivery only)
    const amountNgn = order.buyerTotal ?? order.total;

    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey || secretKey.startsWith('sk_test_REPLACE')) {
      this.logger.warn('Paystack key not configured — returning mock payment link');

      // Still create/update payment record in dev mode
      const reference = `DG-MOCK-${orderId.replace(/-/g,'').substring(0, 8).toUpperCase()}-${Date.now()}`;
      await this.prisma.payment.upsert({
        where:  { orderId },
        create: {
          orderId,
          amount:           amountNgn,
          currency:         order.currency ?? 'NGN',
          provider:         'paystack',
          providerRef:      reference,
          idempotencyKey:   reference,
          status:           'PENDING' as any,
          commissionAmount: order.commissionAmount,
          sellerAmount:     order.sellerNet,
          logisticsAmount:  order.logisticsBaseCost,
          paymentProcessingFee: order.paymentProcessingFee,
          platformFee:      order.commissionAmount,
        },
        update: { providerRef: reference, status: 'PENDING' as any },
      });

      return {
        status:  true,
        message: 'Mock payment initialized (configure PAYSTACK_SECRET_KEY)',
        data: {
          authorization_url: `https://checkout.paystack.com/mock/${orderId}`,
          access_code:       `mock_${orderId}`,
          reference,
        },
        orderSummary: {
          productTotal: order.subtotal,
          deliveryFee:  order.deliveryFee,
          total:        amountNgn,
          currency:     order.currency ?? 'NGN',
        },
      };
    }

    // Real Paystack initialise
    const reference      = `DG-${orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}-${Date.now()}`;
    const amountKobo     = Math.round(amountNgn * 100);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:        order.buyer?.email ?? `${order.buyerId}@dglets.app`,
        amount:       amountKobo,
        reference,
        currency:     'NGN',
        metadata: {
          orderId,
          orderNumber:      order.orderNumber,
          buyerId,
          productSubtotal:  order.subtotal,
          deliveryFee:      order.deliveryFee,
          commissionAmount: order.commissionAmount,
          sellerNet:        order.sellerNet,
        },
        callback_url: this.config.get<string>('PAYSTACK_CALLBACK_URL', 'https://dglets.app/payment/callback'),
      }),
    });

    const result = await response.json() as any;
    if (!result.status) throw new BadRequestException(result.message || 'Paystack initialisation failed');

    await this.prisma.payment.upsert({
      where:  { orderId },
      create: {
        orderId,
        amount:           amountNgn,
        currency:         order.currency ?? 'NGN',
        provider:         'paystack',
        providerRef:      reference,
        idempotencyKey:   reference,
        status:           'PENDING' as any,
        commissionAmount: order.commissionAmount,
        sellerAmount:     order.sellerNet,
        logisticsAmount:  order.logisticsBaseCost,
        paymentProcessingFee: order.paymentProcessingFee,
        platformFee:      order.commissionAmount,
      },
      update: { providerRef: reference, status: 'PENDING' as any },
    });

    return result;
  }

  /* ── Verify a Paystack payment by reference (server-side only) ── */
  async verifyPaystack(reference: string) {
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey || secretKey.startsWith('sk_test_REPLACE')) {
      return { verified: false, message: 'Paystack key not configured' };
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const result = await response.json() as any;

    if (result.status && result.data?.status === 'success') {
      await this._markOrderPaid(reference);
      return { verified: true, data: result.data };
    }

    return { verified: false, data: result.data };
  }

  /* ── Paystack webhook handler — idempotent, server-side verified ── */
  async handlePaystackWebhook(rawBody: Buffer, signature: string) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY', '');
    const hash   = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      this.logger.warn('Paystack webhook: invalid signature');
      return { received: false };
    }

    const event = JSON.parse(rawBody.toString()) as any;
    this.logger.log(`Paystack webhook: ${event.event}`);

    if (event.event === 'charge.success') {
      const reference = event.data?.reference as string;
      await this._markOrderPaid(reference);
    }

    if (event.event === 'refund.processed') {
      const reference = event.data?.transaction_reference as string;
      await this._markRefundProcessed(reference, event.data?.amount / 100);
    }

    return { received: true };
  }

  /* ── Get payment record for an order ── */
  async getPaymentForOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new BadRequestException('Access denied');
    }
    return this.prisma.payment.findUnique({ where: { orderId } });
  }

  /* ── Internal: mark order as paid & write ledger entries ──
   * IDEMPOTENT — if already PAID, skip (prevents duplicate webhook processing).
   */
  private async _markOrderPaid(reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where:   { providerRef: reference },
      include: {
        order: {
          select: {
            id: true, orderNumber: true,
            buyerId: true, sellerId: true,
            subtotal: true, buyerTotal: true,
            commissionAmount: true, sellerNet: true,
            logisticsBaseCost: true, logisticsMargin: true,
            paymentProcessingFee: true, currency: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`Payment record not found for reference: ${reference}`);
      return;
    }

    // IDEMPOTENCY — skip if already paid (Section 29)
    if (payment.status === 'PAID' as any || payment.order?.paymentStatus === 'PAID' as any) {
      this.logger.log(`Order already PAID, skipping duplicate webhook: ${reference}`);
      return;
    }

    const now = new Date();
    const order = payment.order!;

    await Promise.all([
      this.prisma.payment.update({
        where: { providerRef: reference },
        data:  { status: 'PAID' as any, paidAt: now },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data:  { paymentStatus: 'PAID' as any, status: 'PAID' as any, paidAt: now },
      }),
    ]);

    // Write all ledger entries (Section 14 & 12)
    await this.ledger.recordOrderPayment({
      orderId:              order.id,
      buyerId:              order.buyerId,
      sellerId:             order.sellerId,
      currency:             order.currency ?? 'NGN',
      buyerTotal:           order.buyerTotal ?? payment.amount,
      commissionAmount:     order.commissionAmount ?? 0,
      sellerNet:            order.sellerNet ?? 0,
      logisticsBaseCost:    order.logisticsBaseCost ?? 0,
      logisticsMargin:      order.logisticsMargin ?? 0,
      paymentProcessingFee: order.paymentProcessingFee ?? 0,
      paymentReference:     reference,
    }).catch(err => this.logger.error('Ledger write failed:', err));

    // Notify both parties
    const amount = `₦${(order.buyerTotal ?? payment.amount).toLocaleString()}`;
    await Promise.all([
      this.notifications.create(
        order.buyerId, 'PAYMENT', '✅ Payment Confirmed',
        `Your payment of ${amount} for order #${order.orderNumber} was successful.`,
        { orderId: order.id, screen: 'OrderDetail' },
      ).catch(() => {}),
      this.notifications.create(
        order.sellerId, 'PAYMENT', '💰 Payment Received',
        `Payment received for order #${order.orderNumber}. You will receive ₦${order.sellerNet?.toLocaleString()} after DG-LETS fee, once buyer confirms delivery.`,
        { orderId: order.id, screen: 'OrderDetail' },
      ).catch(() => {}),
    ]);

    this.logger.log(`Order ${payment.orderId} marked PAID (ref: ${reference})`);
  }

  /* ── Internal: mark refund processed & reverse ledger entries ── */
  private async _markRefundProcessed(reference: string, refundAmountNgn: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: reference },
    });
    if (!payment) return;

    await Promise.all([
      this.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'REFUNDED' as any },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data:  {
          paymentStatus: 'REFUNDED' as any,
          status:        'REFUNDED' as any,
          refundAmount:  refundAmountNgn,
        },
      }),
    ]);

    await this.ledger.recordReversal(payment.orderId, 'Refund processed by payment gateway', reference);
    this.logger.log(`Order ${payment.orderId} refund processed (ref: ${reference})`);
  }
}
