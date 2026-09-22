import {
  Controller, Get, Patch, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminService }   from './admin.service';
import { JwtAuthGuard }   from '../auth/guards/jwt-auth.guard';
import { RolesGuard }     from '../auth/guards/roles.guard';
import { Roles }          from '../auth/decorators/roles.decorator';
import { CurrentUser }    from '../auth/decorators/current-user.decorator';

@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* ── Dashboard stats ── */
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  /* ══════════════════════ USERS ══════════════════════ */
  @Get('users')
  listUsers(
    @Query('role')   role?:   string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
  ) {
    return this.adminService.listUsers({
      role, status, search,
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 30,
    });
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  updateUserStatus(
    @Param('id')    id:        string,
    @Body('status') status:    string,
    @CurrentUser()  admin:     any,
  ) {
    return this.adminService.updateUserStatus(id, status, admin.id);
  }

  /* ── Verified badge ── */
  @Patch('users/:id/verified')
  @HttpCode(HttpStatus.OK)
  setVerifiedBadge(
    @Param('id')        id:       string,
    @Body('verified')   verified: boolean,
    @CurrentUser()      admin:    any,
  ) {
    return this.adminService.setVerifiedBadge(id, verified, admin.id);
  }

  /* ══════════════════════ PRODUCTS ══════════════════════ */
  @Get('products')
  listProducts(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
  ) {
    return this.adminService.listProducts({
      status, search,
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 30,
    });
  }

  @Patch('products/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveProduct(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.adminService.approveProduct(id, admin.id);
  }

  @Patch('products/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectProduct(
    @Param('id')    id:     string,
    @Body('reason') reason: string,
    @CurrentUser()  admin:  any,
  ) {
    return this.adminService.rejectProduct(id, reason ?? 'Does not meet listing standards', admin.id);
  }

  /* ══════════════════════ ORDERS ══════════════════════ */
  @Get('orders')
  listOrders(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
  ) {
    return this.adminService.listOrders({
      status, search,
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 30,
    });
  }

  /* ══════════════════════ DISPUTES ══════════════════════ */
  @Get('disputes')
  listDisputes(
    @Query('page')  page?:  string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listDisputes({
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Patch('disputes/:orderId/resolve')
  @HttpCode(HttpStatus.OK)
  resolveDispute(
    @Param('orderId')     orderId:    string,
    @Body('resolution')   resolution: 'COMPLETED' | 'REFUNDED' | 'CANCELLED',
    @CurrentUser()        admin:      any,
  ) {
    return this.adminService.resolveDispute(orderId, resolution, admin.id);
  }

  /* ══════════════════════ FEES ══════════════════════ */
  @Get('fees')
  listFees(
    @Query('type')   type?:   string,
    @Query('status') status?: string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
  ) {
    return this.adminService.listFees({
      type, status,
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 30,
    });
  }
}
