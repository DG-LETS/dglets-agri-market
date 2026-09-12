import {
  Controller, Post, Get, Param, Body, Headers,
  RawBodyRequest, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard';
import { CurrentUser }     from '../auth/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /* ── Initialise Paystack payment for an order ── */
  @Post('paystack/init/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Paystack payment link for an order' })
  initPaystack(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.payments.initializePaystack(orderId, user.id);
  }

  /* ── Verify a Paystack payment (called after redirect) ── */
  @Get('paystack/verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a Paystack payment by reference' })
  verifyPaystack(@Param('reference') reference: string) {
    return this.payments.verifyPaystack(reference);
  }

  /* ── Paystack webhook (no auth — Paystack posts here) ── */
  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint (internal)' })
  paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.payments.handlePaystackWebhook(rawBody, signature);
  }

  /* ── Get payment record for an order ── */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details for an order' })
  getForOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.payments.getPaymentForOrder(orderId, user.id);
  }
}
