import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  /* ── Search / browse products ── */
  async searchProducts(query: {
    keyword?:    string;
    categoryId?: string;
    state?:      string;
    minPrice?:   number;
    maxPrice?:   number;
    minQuantity?: number;
    sellerId?:   string;
    lat?:        number;
    lng?:        number;
    radiusKm?:   number;
    page?:       number;
    limit?:      number;
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

    /* When lat/lng provided, only include products with geo coords */
    if (query.lat != null && query.lng != null) {
      where.geoLat = { not: null };
      where.geoLng = { not: null };
    }

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

    /* Attach isVerified flag and optionally distance */
    const shaped = items.map(p => {
      let distanceKm: number | null = null;
      if (query.lat != null && query.lng != null && p.geoLat != null && p.geoLng != null) {
        distanceKm = this.haversineKm(query.lat, query.lng, p.geoLat, p.geoLng);
      }
      return {
        ...p,
        distanceKm,
        seller: p.seller
          ? {
              ...p.seller,
              isVerified: (p.seller as any).verification?.identityStatus === 'VERIFIED',
            }
          : p.seller,
      };
    });

    /* If geo filter active, apply radius and sort by distance */
    let filtered = shaped;
    if (query.lat != null && query.lng != null) {
      const radius = query.radiusKm ?? 100;
      filtered = shaped
        .filter(p => p.distanceKm != null && p.distanceKm <= radius)
        .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    return {
      data:  filtered,
      meta:  { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /* ── Haversine distance in km ── */
  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    return {
      ...product,
      seller: product.seller
        ? {
            ...product.seller,
            isVerified: (product.seller as any).verification?.identityStatus === 'VERIFIED',
          }
        : product.seller,
    };
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
