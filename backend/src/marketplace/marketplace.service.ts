import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  /* ── Search / browse products ── */
  async searchProducts(query: {
    keyword?: string;
    categoryId?: string;
    state?: string;
    minPrice?: number;
    maxPrice?: number;
    minQuantity?: number;
    sellerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page  = query.page  || 1;
    const limit = query.limit || 20;
    const skip  = (page - 1) * limit;

    const where: any = { status: 'PUBLISHED' };
    if (query.keyword)    where.OR = [
      { name:        { contains: query.keyword, mode: 'insensitive' } },
      { description: { contains: query.keyword, mode: 'insensitive' } },
    ];
    if (query.categoryId) where.categoryId  = query.categoryId;
    if (query.state)      where.state       = { contains: query.state, mode: 'insensitive' };
    if (query.sellerId)   where.sellerId    = query.sellerId;
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = query.minPrice;
      if (query.maxPrice) where.price.lte = query.maxPrice;
    }
    if (query.minQuantity) where.quantity = { gte: query.minQuantity };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take:    limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller:   {
            select: {
              id: true, firstName: true, lastName: true, profileImage: true,
              verification: { select: { phoneVerified: true, identityStatus: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data:  items,
      meta:  { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /* ── Get product by id ── */
  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where:   { id },
      include: {
        category: true,
        seller: {
          select: {
            id: true, firstName: true, lastName: true,
            profileImage: true, farmerProfile: true, verification: true,
          },
        },
        reviews: {
          include: { author: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take:    10,
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return product;
  }

  /* ── Create product ── */
  async createProduct(sellerId: string, data: any) {
    const slug = `${data.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    return this.prisma.product.create({
      data: { ...data, sellerId, slug },
    });
  }

  /* ── Update product ── */
  async updateProduct(id: string, sellerId: string, data: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product)               throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product');
    return this.prisma.product.update({ where: { id }, data });
  }

  /* ── Delete product ── */
  async deleteProduct(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product)               throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product');
    return this.prisma.product.update({ where: { id }, data: { status: 'DELETED' } });
  }

  /* ── Seller's own products ── */
  async getMyProducts(sellerId: string, status?: string) {
    return this.prisma.product.findMany({
      where:   { sellerId, ...(status ? { status: status as any } : {}) },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ── Save / unsave product ── */
  async toggleSaveProduct(userId: string, productId: string) {
    const existing = await this.prisma.savedProduct.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      await this.prisma.savedProduct.delete({ where: { userId_productId: { userId, productId } } });
      return { saved: false };
    }
    await this.prisma.savedProduct.create({ data: { userId, productId } });
    return { saved: true };
  }

  /* ── Get saved products ── */
  getSavedProducts(userId: string) {
    return this.prisma.savedProduct.findMany({
      where:   { userId },
      include: { product: { include: { category: true, seller: { select: { id: true, firstName: true, lastName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ── Market prices ── */
  getMarketPrices(product?: string, state?: string) {
    return this.prisma.marketPrice.findMany({
      where: {
        ...(product ? { product: { contains: product, mode: 'insensitive' as any } } : {}),
        ...(state   ? { state:   { contains: state,   mode: 'insensitive' as any } } : {}),
      },
      orderBy: { recordedAt: 'desc' },
      take:    50,
    });
  }
}
