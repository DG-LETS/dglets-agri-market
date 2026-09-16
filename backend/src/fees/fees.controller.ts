import {
  Controller, Post, Get, Query, UseGuards, Request,
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('fees')
@UseGuards(JwtAuthGuard)
export class FeesController {
  constructor(private readonly fees: FeesService) {}

  /* GET /fees/registration-status — check if registration fee is required/paid */
  @Get('registration-status')
  registrationStatus(@CurrentUser() user: any) {
    return this.fees.getRegistrationFeeStatus(user.id, user.role);
  }

  /* POST /fees/registration/pay — init Paystack link for registration fee */
  @Post('registration/pay')
  initRegistrationPayment(@CurrentUser() user: any) {
    return this.fees.initRegistrationPayment(user.id);
  }

  /* GET /fees — admin: list all fees */
  @Get()
  listFees(
    @CurrentUser() user: any,
    @Query('type')   type?: string,
    @Query('status') status?: string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
  ) {
    /* Only admins in production — for MVP allow any authenticated user to see their own */
    return this.fees.listFees({
      type,
      status,
      userId: user.role === 'ADMIN' ? undefined : user.id,
      page:   page  ? parseInt(page,  10) : 1,
      limit:  limit ? parseInt(limit, 10) : 50,
    });
  }
}
