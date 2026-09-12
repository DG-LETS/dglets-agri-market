import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, NotFoundException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SmsService } from '../sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly users:   UsersService,
    private readonly jwt:     JwtService,
    private readonly config:  ConfigService,
    private readonly sms:     SmsService,
  ) {}

  /* ── Register ── */
  async register(dto: RegisterDto) {
    /* Check phone uniqueness */
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone number already registered');

    /* Check email if provided */
    if (dto.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailExists) throw new ConflictException('Email address already registered');
    }

    const rounds  = this.config.get<number>('auth.bcryptRounds', 12);
    const hash    = dto.password ? await bcrypt.hash(dto.password, rounds) : null;
    const refCode = uuidv4().split('-')[0].toUpperCase();

    const user = await this.prisma.user.create({
      data: {
        phone:        dto.phone,
        email:        dto.email   || null,
        firstName:    dto.firstName,
        lastName:     dto.lastName,
        role:         dto.role    || 'BUYER',
        passwordHash: hash,
        referralCode: refCode,
        referredBy:   dto.referralCode || null,
        status:       'PENDING_VERIFICATION',
        verification: {
          create: {
            phoneVerified: false,
            emailVerified: false,
          },
        },
        rewardWallet: { create: {} },
      },
      include: { verification: true },
    });

    /* Generate and send OTP */
    await this.generateOtp(user.id, 'verify_phone');

    return {
      message: 'Registration successful. Please verify your phone number.',
      userId:  user.id,
    };
  }

  /* ── Login ── */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.identifier },
          { email: dto.identifier },
        ],
      },
      include: { verification: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'SUSPENDED') throw new UnauthorizedException('Account suspended');

    if (dto.password) {
      if (!user.passwordHash) throw new UnauthorizedException('Please use OTP login');
      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
    } else {
      /* OTP-based login — send OTP */
      await this.generateOtp(user.id, 'login');
      return {
        message:  'OTP sent to your phone number',
        userId:   user.id,
        otpSent:  true,
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    });

    return this.generateTokens(user);
  }

  /* ── Verify OTP ── */
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { verification: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.prisma.otpToken.findFirst({
      where: {
        userId:  dto.userId,
        token:   dto.token,
        purpose: dto.purpose,
        usedAt:  null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    /* Mark OTP used */
    await this.prisma.otpToken.update({
      where: { id: otp.id },
      data:  { usedAt: new Date() },
    });

    /* Handle purpose */
    if (dto.purpose === 'verify_phone') {
      await this.prisma.verification.update({
        where: { userId: dto.userId },
        data:  { phoneVerified: true },
      });
      await this.prisma.user.update({
        where: { id: dto.userId },
        data:  { status: 'ACTIVE', lastLoginAt: new Date() },
      });
    }

    if (dto.purpose === 'login') {
      await this.prisma.user.update({
        where: { id: dto.userId },
        data:  { lastLoginAt: new Date() },
      });
    }

    return this.generateTokens(user);
  }

  /* ── Request password reset ── */
  async requestPasswordReset(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException('User not found');
    await this.generateOtp(user.id, 'reset_password');
    return { message: 'OTP sent for password reset', userId: user.id };
  }

  /* ── Reset password ── */
  async resetPassword(userId: string, token: string, newPassword: string) {
    await this.verifyOtp({ userId, token, purpose: 'reset_password' });
    const rounds = this.config.get<number>('auth.bcryptRounds', 12);
    const hash   = await bcrypt.hash(newPassword, rounds);
    await this.prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: hash },
    });
    return { message: 'Password reset successful' };
  }

  /* ── Refresh token ── */
  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where:   { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    /* Rotate refresh token */
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data:  { revokedAt: new Date() },
    });

    return this.generateTokens(stored.user);
  }

  /* ── Logout ── */
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data:  { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  /* ── Helpers ── */
  private async generateOtp(userId: string, purpose: string): Promise<string> {
    const token     = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(
      Date.now() + this.config.get<number>('auth.otpExpiresMinutes', 10) * 60 * 1000,
    );

    /* Invalidate previous OTPs for same purpose */
    await this.prisma.otpToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data:  { usedAt: new Date() },
    });

    await this.prisma.otpToken.create({
      data: { userId, token, purpose, expiresAt },
    });

    /* Send OTP via Termii SMS */
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
    if (user?.phone) {
      const purposeLabel: Record<string, string> = {
        verify_phone:   'phone verification',
        login:          'login',
        reset_password: 'password reset',
      };
      const label   = purposeLabel[purpose] ?? 'verification';
      const message = `Your DG-LETS ${label} code is: ${token}. Valid for ${this.config.get<number>('auth.otpExpiresMinutes', 10)} minutes. Do not share this code.`;
      await this.sms.send(user.phone, message);
    }

    return token;
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, role: user.role, phone: user.phone };

    const accessToken  = this.jwt.sign(payload);
    const refreshToken = uuidv4();

    const refreshExpiresIn = this.config.get<string>('auth.jwtRefreshExpiresIn', '30d');
    const days = parseInt(refreshExpiresIn.replace('d', ''), 10);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id:        user.id,
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone,
        email:     user.email,
        role:      user.role,
        status:    user.status,
      },
    };
  }
}
