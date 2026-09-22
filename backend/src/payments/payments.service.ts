import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { ConfigService }        from '@nestjs/config';
import { PrismaService }        from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma:         PrismaService,
    private readonly config:         ConfigService,
    private readonly notifications:  NotificationsService,
  ) {}

  /* ── Initialise a Paystack payment for an order ── */
  async initializePaystack(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where:   { id: orderId },
      include: { buyer: { select: { email: true, phone: true } } },
    });

    if (!order)               throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new BadRequestException('Access denied');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Order already paid');

    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey || secretKey.startsWith('sk_test_REPLACE')) {
      /* Dev mode — return a mock response */
      this.logger.warn('Paystack key not configured — returning mock payment link');
      return {
        status:  true,
        message: 'Mock payment initialized (configure PAYSTACK_SECRET_KEY)',
        data: {
          authorization_url: `https://checkout.paystack.com/mock/${orderId}`,
          access_code:       `mock_${orderId}`,
          reference:         `DG-${orderId.split('-')[0].toUpperCase()}-${Date.now()}`,
        },
      };
    }

    /* Real Paystack initialise call */
    const reference  = `DG-${orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}-${Date.now()}`;
    const amountKobo = Math.round(order.total * 100);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:    order.buyer?.email ?? `${order.buyerId}@dglets.app`,
        amount:   amountKobo,
        reference,
        metadata: { orderId, orderNumber: order.orderNumber, buyerId },
        callback_url: this.config.get<string>('PAYSTACK_CALLBACK_URL', 'https://dglets.app/payment/callback'),
      }),
    });

    const result = await response.json() as any;
    if (!result.status) throw new BadRequestException(result.message || 'Paystack initialisation failed');

    /* Persist payment record */
    await this.prisma.payment.upsert({
      where:  { orderId },
      create: {
        orderId,
        amount:       order.total,
        currency:     'NGN',
        provider:     'paystack',
        providerRef:  reference,
        status:       'PENDING',
        platformFee:  order.platformFee,
        sellerAmount: order.subtotal - order.platformFee,
      },
      update: { providerRef: reference, status: 'PENDING' },
    });

    return result;
  }

  /* ── Verify a Paystack payment by reference ── */
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
    }

    return result;
  }

  /* ── Paystack webhook handler ── */
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

  /* ── Internal: mark order + payment as paid and notify parties ── */
  private async _markOrderPaid(reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where:   { providerRef: reference },
      include: { order: { select: { id: true, orderNumber: true, buyerId: true, sellerId: true, total: true } } },
    });
    if (!payment) {
      this.logger.warn(`Payment record not found for reference: ${reference}`);
      return;
    }

    const now = new Date();

    await Promise.all([
      this.prisma.payment.update({
        where: { providerRef: reference },
        data:  { status: 'PAID', paidAt: now },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data:  { paymentStatus: 'PAID', paidAt: now },
      }),
    ]);

    /* Notify buyer + seller */
    const order = payment.order;
    if (order) {
      const amount = `₦${order.total.toLocaleString()}`;
      await Promise.all([
        this.notifications.create(
          order.buyerId,
          'PAYMENT',
          '✅ Payment Confirmed',
          `Your payment of ${amount} for order #${order.orderNumber} was successful.`,
          { orderId: order.id, screen: 'OrderDetail' },
        ).catch(() => {}),
        this.notifications.create(
          order.sellerId,
          'PAYMENT',
          '💰 Payment Received',
          `Payment of ${amount} received for order #${order.orderNumber}.`,
          { orderId: order.id, screen: 'OrderDetail' },
        ).catch(() => {}),
      ]);
    }

    this.logger.log(`Order ${payment.orderId} marked as PAID (ref: ${reference})`);
  }
}
