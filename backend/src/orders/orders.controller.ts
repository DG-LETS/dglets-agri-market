import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.orders.createOrder(user.id, body);
  }

  @Get('buying')
  @ApiOperation({ summary: 'Get my orders as buyer' })
  myBuyerOrders(@CurrentUser() user: any) {
    return this.orders.getMyOrdersAsBuyer(user.id);
  }

  @Get('selling')
  @ApiOperation({ summary: 'Get my orders as seller' })
  mySellerOrders(@CurrentUser() user: any) {
    return this.orders.getMyOrdersAsSeller(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orders.findById(id, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @CurrentUser() user: any, @Body('status') status: string) {
    return this.orders.updateStatus(id, user.id, status);
  }
}
