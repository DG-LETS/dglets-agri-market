import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Marketplace')
@Controller({ path: 'marketplace', version: '1' })
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get('products')
  @ApiOperation({ summary: 'Search and browse products' })
  @ApiQuery({ name: 'keyword',    required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'state',      required: false })
  @ApiQuery({ name: 'minPrice',   required: false, type: Number })
  @ApiQuery({ name: 'maxPrice',   required: false, type: Number })
  @ApiQuery({ name: 'page',       required: false, type: Number })
  @ApiQuery({ name: 'limit',      required: false, type: Number })
  search(@Query() query: any) {
    return this.marketplace.searchProducts(query);
  }

  @Get('products/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my product listings' })
  getMyProducts(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.marketplace.getMyProducts(user.id, status);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details' })
  findOne(@Param('id') id: string) {
    return this.marketplace.findProductById(id);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product listing' })
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.marketplace.createProduct(user.id, body);
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product listing' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.marketplace.updateProduct(id, user.id, body);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product listing' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.marketplace.deleteProduct(id, user.id);
  }

  @Post('products/:id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save/unsave a product' })
  toggleSave(@Param('id') productId: string, @CurrentUser() user: any) {
    return this.marketplace.toggleSaveProduct(user.id, productId);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved products' })
  getSaved(@CurrentUser() user: any) {
    return this.marketplace.getSavedProducts(user.id);
  }

  @Get('market-prices')
  @ApiOperation({ summary: 'Get market price intelligence' })
  @ApiQuery({ name: 'product', required: false })
  @ApiQuery({ name: 'state',   required: false })
  getMarketPrices(@Query('product') product?: string, @Query('state') state?: string) {
    return this.marketplace.getMarketPrices(product, state);
  }
}
