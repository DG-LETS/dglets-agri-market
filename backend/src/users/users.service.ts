import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where:   { id },
      include: { verification: true, farmerProfile: true, buyerProfile: true, rewardWallet: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async updateProfile(id: string, data: any) {
    return this.prisma.user.update({
      where:   { id },
      data:    { firstName: data.firstName, lastName: data.lastName, profileImage: data.profileImage },
      select:  { id: true, firstName: true, lastName: true, phone: true, email: true, role: true, profileImage: true },
    });
  }

  async updateFarmerProfile(userId: string, data: any) {
    return this.prisma.farmerProfile.upsert({
      where:  { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async updateBuyerProfile(userId: string, data: any) {
    return this.prisma.buyerProfile.upsert({
      where:  { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /* ── Register Expo push token ── */
  async registerPushToken(userId: string, token: string, platform: string) {
    /* Store in a JSON metadata field on the user — no schema change needed */
    return this.prisma.user.update({
      where: { id: userId },
      data:  { pushToken: token } as any,
      select: { id: true },
    });
  }
}
